/**
 * Operasi data murni (tanpa React) atas UserData milik satu akun.
 * Dipisah dari store.tsx supaya logikanya bisa diuji langsung.
 */

import { formatRupiah } from "./derive";
import { validateGuestInput, type GuestActionError, type GuestErrors, type RawGuestInput } from "./guests";
import { validateSeserahanInput, type ItemActionError, type RawSeserahanInput, type SeserahanErrors } from "./seserahan";
import { buildStarterStages } from "./templates";
import type { ActivityLogEntry, Guest, PreparationStage, SeserahanItem, Vendor, WeddingTask, WeddingWorkspace } from "./types";
import type { UserData } from "./user-storage";

const MAX_ACTIVITY = 50;

export interface ActionContext {
  /** Nama akun yang sedang login; dicatat sebagai pelaku di "Aktivitas Terbaru". */
  actorName: string;
  now?: Date;
}

export interface NewWorkspaceInput {
  name: string;
  weddingDate?: string;
  targetBudget: number;
  weddingType: string;
}

export function newId(prefix: string): string {
  const uuid =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${uuid}`;
}

function withActivity(data: UserData, ctx: ActionContext, action: string, objectLabel: string): UserData {
  if (!data.workspace) return data;
  const entry: ActivityLogEntry = {
    id: newId("a"),
    workspaceId: data.workspace.id,
    actorName: ctx.actorName,
    action,
    objectLabel,
    createdAt: (ctx.now ?? new Date()).toISOString(),
  };
  return { ...data, activityLog: [entry, ...data.activityLog].slice(0, MAX_ACTIVITY) };
}

/** Satu akun = satu proyek. Jika proyek sudah ada, data TIDAK ditimpa. */
export function createWorkspace(data: UserData, userId: string, input: NewWorkspaceInput): UserData {
  if (data.workspace) return data;
  const name = input.name.trim();
  if (!userId || !name) return data;

  const id = newId("wk");
  const workspace: WeddingWorkspace = {
    id,
    ownerId: userId,
    name,
    weddingDate: input.weddingDate || undefined,
    weddingType: input.weddingType,
    targetBudget: Math.max(0, Math.round(input.targetBudget) || 0),
  };
  return { ...data, workspace, stages: buildStarterStages(id) };
}

export function updatePreparationStatus(
  data: UserData,
  stageId: string,
  itemId: string,
  status: PreparationStage["items"][number]["status"],
  ctx: ActionContext
): UserData {
  const item = data.stages.find((s) => s.id === stageId)?.items.find((i) => i.id === itemId);
  if (!item) return data;
  const stages = data.stages.map((stage) =>
    stage.id !== stageId
      ? stage
      : { ...stage, items: stage.items.map((it) => (it.id === itemId ? { ...it, status } : it)) }
  );
  return withActivity({ ...data, stages }, ctx, status === "selesai" ? "menyelesaikan" : "memperbarui status", item.title);
}

export function updateTaskStatus(data: UserData, taskId: string, status: WeddingTask["status"], ctx: ActionContext): UserData {
  const task = data.tasks.find((t) => t.id === taskId);
  if (!task) return data;
  const tasks = data.tasks.map((t) => (t.id === taskId ? { ...t, status } : t));
  return withActivity({ ...data, tasks }, ctx, status === "completed" ? "menyelesaikan tugas" : "memperbarui tugas", task.title);
}

export function recordBudgetPayment(data: UserData, budgetItemId: string, amount: number, ctx: ActionContext): UserData {
  const item = data.budgetItems.find((b) => b.id === budgetItemId);
  if (!item || !Number.isFinite(amount)) return data;
  const budgetItems = data.budgetItems.map((b) =>
    b.id !== budgetItemId
      ? b
      : {
          ...b,
          paidAmount: Math.min(b.actualAmount, b.paidAmount + amount),
          paymentStatus: b.paidAmount + amount >= b.actualAmount ? ("lunas" as const) : amount > 0 ? ("dp" as const) : b.paymentStatus,
        }
  );
  const next = { ...data, budgetItems };
  return amount > 0 ? withActivity(next, ctx, "mencatat pembayaran", `${formatRupiah(amount)} untuk ${item.name}`) : next;
}

export function updateVendorStatus(data: UserData, vendorId: string, status: Vendor["status"], ctx: ActionContext): UserData {
  const vendor = data.vendors.find((v) => v.id === vendorId);
  if (!vendor) return data;
  const vendors = data.vendors.map((v) => (v.id === vendorId ? { ...v, status } : v));
  return withActivity({ ...data, vendors }, ctx, "memperbarui status vendor", vendor.name);
}

export function updateGuestRsvp(data: UserData, guestId: string, rsvp: Guest["rsvp"], ctx: ActionContext): UserData {
  const guest = data.guests.find((g) => g.id === guestId);
  if (!guest) return data;
  const guests = data.guests.map((g) => (g.id === guestId ? { ...g, rsvp } : g));
  return withActivity({ ...data, guests }, ctx, "memperbarui RSVP", guest.name);
}

export function updateSeserahanStatus(data: UserData, itemId: string, status: SeserahanItem["status"], ctx: ActionContext): UserData {
  const item = data.seserahan.find((it) => it.id === itemId);
  if (!item) return data;
  const seserahan = data.seserahan.map((it) => (it.id === itemId ? { ...it, status } : it));
  return withActivity({ ...data, seserahan }, ctx, status === "dibeli" ? "menandai dibeli" : "memperbarui status", `Seserahan — ${item.name}`);
}

// ---------------------------------------------------------------- tamu (tambah / ubah / hapus)

export type { GuestActionError };

export type GuestActionResult =
  | { ok: true; data: UserData; guest: Guest }
  | { ok: false; error: GuestActionError; errors?: GuestErrors };

export function addGuest(data: UserData, raw: RawGuestInput, ctx: ActionContext): GuestActionResult {
  if (!data.workspace) return { ok: false, error: "no-workspace" };
  const { errors, value } = validateGuestInput(raw, data.guests);
  if (!value) return { ok: false, error: "validation", errors };
  const guest: Guest = { id: newId("g"), workspaceId: data.workspace.id, ...value };
  const next = withActivity({ ...data, guests: [...data.guests, guest] }, ctx, "menambahkan tamu", guest.name);
  return { ok: true, data: next, guest };
}

/** Mengubah tamu; kolom yang tidak ada di form (relationship, table, giftStatus) dipertahankan. */
export function updateGuest(data: UserData, guestId: string, raw: RawGuestInput, ctx: ActionContext): GuestActionResult {
  const current = data.guests.find((g) => g.id === guestId);
  if (!current) return { ok: false, error: "not-found" };
  const { errors, value } = validateGuestInput(raw, data.guests, guestId);
  if (!value) return { ok: false, error: "validation", errors };
  const guest: Guest = { ...current, ...value, phone: value.phone, notes: value.notes };
  const guests = data.guests.map((g) => (g.id === guestId ? guest : g));
  return { ok: true, data: withActivity({ ...data, guests }, ctx, "mengubah data tamu", guest.name), guest };
}

export function deleteGuest(data: UserData, guestId: string, ctx: ActionContext): GuestActionResult {
  const guest = data.guests.find((g) => g.id === guestId);
  if (!guest) return { ok: false, error: "not-found" };
  const guests = data.guests.filter((g) => g.id !== guestId);
  return { ok: true, data: withActivity({ ...data, guests }, ctx, "menghapus tamu", guest.name), guest };
}

/** Ubah status konfirmasi saja (aksi cepat di daftar). */
export function setGuestRsvp(data: UserData, guestId: string, rsvp: Guest["rsvp"], ctx: ActionContext): GuestActionResult {
  const guest = data.guests.find((g) => g.id === guestId);
  if (!guest) return { ok: false, error: "not-found" };
  const updated: Guest = { ...guest, rsvp };
  const guests = data.guests.map((g) => (g.id === guestId ? updated : g));
  return { ok: true, data: withActivity({ ...data, guests }, ctx, "memperbarui RSVP", guest.name), guest: updated };
}

// ---------------------------------------------------------------- seserahan (tambah / ubah / hapus)

export type { ItemActionError };

export type ItemActionResult =
  | { ok: true; data: UserData; item: SeserahanItem }
  | { ok: false; error: ItemActionError; errors?: SeserahanErrors };

export function addSeserahan(data: UserData, raw: RawSeserahanInput, ctx: ActionContext): ItemActionResult {
  if (!data.workspace) return { ok: false, error: "no-workspace" };
  const { errors, value } = validateSeserahanInput(raw);
  if (!value) return { ok: false, error: "validation", errors };
  const item: SeserahanItem = { id: newId("s"), workspaceId: data.workspace.id, ...value };
  const next = withActivity({ ...data, seserahan: [...data.seserahan, item] }, ctx, "menambahkan item seserahan", item.name);
  return { ok: true, data: next, item };
}

/** Mengubah item; kolom yang tidak diketahui form tetap dipertahankan (spread dari data lama). */
export function updateSeserahan(data: UserData, itemId: string, raw: RawSeserahanInput, ctx: ActionContext): ItemActionResult {
  const current = data.seserahan.find((i) => i.id === itemId);
  if (!current) return { ok: false, error: "not-found" };
  const { errors, value } = validateSeserahanInput(raw);
  if (!value) return { ok: false, error: "validation", errors };
  const item: SeserahanItem = { ...current, ...value, purchaseDate: value.purchaseDate, notes: value.notes };
  const seserahan = data.seserahan.map((i) => (i.id === itemId ? item : i));
  return { ok: true, data: withActivity({ ...data, seserahan }, ctx, "mengubah item seserahan", item.name), item };
}

export function deleteSeserahan(data: UserData, itemId: string, ctx: ActionContext): ItemActionResult {
  const item = data.seserahan.find((i) => i.id === itemId);
  if (!item) return { ok: false, error: "not-found" };
  const seserahan = data.seserahan.filter((i) => i.id !== itemId);
  return { ok: true, data: withActivity({ ...data, seserahan }, ctx, "menghapus item seserahan", item.name), item };
}

/** Ubah status persiapan saja (aksi cepat di daftar). */
export function setSeserahanStatus(data: UserData, itemId: string, status: SeserahanItem["status"], ctx: ActionContext): ItemActionResult {
  const item = data.seserahan.find((i) => i.id === itemId);
  if (!item) return { ok: false, error: "not-found" };
  const updated: SeserahanItem = { ...item, status };
  const seserahan = data.seserahan.map((i) => (i.id === itemId ? updated : i));
  return { ok: true, data: withActivity({ ...data, seserahan }, ctx, status === "dibeli" ? "menandai sudah disiapkan" : "memperbarui status", `Seserahan — ${item.name}`), item: updated };
}
