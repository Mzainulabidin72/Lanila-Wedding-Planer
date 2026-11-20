/**
 * Operasi data murni (tanpa React) atas UserData milik satu akun.
 * Dipisah dari store.tsx supaya logikanya bisa diuji langsung.
 */

import { formatRupiah } from "./derive";
import { validateGuestInput, type GuestActionError, type GuestErrors, type RawGuestInput } from "./guests";
import { validateSeserahanInput, type ItemActionError, type RawSeserahanInput, type SeserahanErrors } from "./seserahan";
import { buildStarterStages } from "./templates";
import {
  QUOTE_STATUSES,
  VENDOR_STATUSES,
  localDateString,
  paymentsOf,
  validatePaymentInput,
  validateVendorInput,
  type RawPaymentInput,
  type RawVendorInput,
  type VendorActionError,
} from "./vendors";
import type { ActivityLogEntry, BudgetItem, BudgetPayment, GiftRecord, Guest, PreparationStage, SeserahanItem, Vendor, VendorPayment, VendorStatus, WeddingTask, WeddingWorkspace } from "./types";
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

export function updateWorkspaceBudget(data: UserData, targetBudget: number, ctx: ActionContext): UserData {
  if (!data.workspace || !Number.isFinite(targetBudget) || targetBudget < 0) return data;
  const workspace = { ...data.workspace, targetBudget: Math.round(targetBudget) };
  return withActivity({ ...data, workspace }, ctx, "memperbarui budget pernikahan", formatRupiah(workspace.targetBudget));
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

export interface RawTaskInput {
  title: string;
  description?: string;
  category: string;
  startDate?: string;
  deadline?: string;
  priority: WeddingTask["priority"];
  status: WeddingTask["status"];
  notes?: string;
  reminderDate?: string;
  assignee?: string;
}

export function saveTask(data: UserData, taskId: string | null, input: RawTaskInput, ctx: ActionContext): UserData {
  if (!data.workspace || !input.title.trim() || !input.category.trim()) return data;
  if (input.startDate && input.deadline && input.startDate > input.deadline) return data;
  if (taskId) {
    const existing = data.tasks.find((task) => task.id === taskId);
    if (!existing) return data;
    const tasks = data.tasks.map((task) =>
      task.id === taskId
        ? { ...task, ...input, title: input.title.trim(), category: input.category.trim(), workspaceId: data.workspace!.id }
        : task
    );
    return withActivity({ ...data, tasks }, ctx, "memperbarui tugas", input.title.trim());
  }
  const task: WeddingTask = {
    id: newId("task"),
    workspaceId: data.workspace.id,
    title: input.title.trim(),
    category: input.category.trim(),
    description: input.description?.trim() || undefined,
    assignee: input.assignee?.trim() || undefined,
    startDate: input.startDate || undefined,
    deadline: input.deadline || undefined,
    priority: input.priority,
    status: input.status,
    notes: input.notes?.trim() || undefined,
    reminderDate: input.reminderDate || undefined,
  };
  return withActivity({ ...data, tasks: [task, ...data.tasks] }, ctx, "menambah tugas", task.title);
}

export function deleteTask(data: UserData, taskId: string, ctx: ActionContext): UserData {
  const task = data.tasks.find((item) => item.id === taskId);
  if (!task) return data;
  return withActivity({ ...data, tasks: data.tasks.filter((item) => item.id !== taskId) }, ctx, "menghapus tugas", task.title);
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

export interface RawBudgetInput {
  name: string;
  category: string;
  vendorId?: string;
  plannedAmount: number;
  actualAmount: number;
  deadline?: string;
  notes?: string;
}

export function saveBudgetItem(data: UserData, itemId: string | null, input: RawBudgetInput, ctx: ActionContext): UserData {
  if (!data.workspace || !input.name.trim() || !input.category.trim()) return data;
  if (input.plannedAmount < 0 || input.actualAmount < 0) return data;
  if (itemId) {
    const existing = data.budgetItems.find((item) => item.id === itemId);
    if (!existing) return data;
    const budgetItems = data.budgetItems.map((item) =>
      item.id === itemId
        ? {
            ...item,
            ...input,
            name: input.name.trim(),
            category: input.category.trim(),
            paidAmount: Math.min(existing.paidAmount, input.actualAmount),
            paymentStatus: existing.paidAmount >= input.actualAmount && input.actualAmount > 0 ? ("lunas" as const) : existing.paidAmount > 0 ? ("dp" as const) : ("belum_bayar" as const),
          }
        : item
    );
    return withActivity({ ...data, budgetItems }, ctx, "memperbarui anggaran", input.name.trim());
  }
  const item: BudgetItem = {
    id: newId("budget"),
    workspaceId: data.workspace.id,
    name: input.name.trim(),
    category: input.category.trim(),
    vendorId: input.vendorId || undefined,
    plannedAmount: Math.round(input.plannedAmount),
    actualAmount: Math.round(input.actualAmount),
    paidAmount: 0,
    deadline: input.deadline || undefined,
    paymentStatus: "belum_bayar",
    notes: input.notes?.trim() || undefined,
  };
  return withActivity({ ...data, budgetItems: [item, ...data.budgetItems] }, ctx, "menambah anggaran", item.name);
}

export function deleteBudgetItem(data: UserData, itemId: string, ctx: ActionContext): UserData {
  const item = data.budgetItems.find((entry) => entry.id === itemId);
  if (!item) return data;
  return withActivity(
    {
      ...data,
      budgetItems: data.budgetItems.filter((entry) => entry.id !== itemId),
      budgetPayments: (data.budgetPayments ?? []).filter((payment) => payment.budgetItemId !== itemId),
    },
    ctx,
    "menghapus anggaran",
    item.name
  );
}

export interface RawBudgetPaymentInput {
  amount: number;
  paidAt: string;
  method?: string;
  type: BudgetPayment["type"];
  notes?: string;
}

export function addBudgetPayment(
  data: UserData,
  budgetItemId: string,
  input: RawBudgetPaymentInput,
  ctx: ActionContext
): UserData {
  const item = data.budgetItems.find((entry) => entry.id === budgetItemId);
  if (!item || !data.workspace || input.amount <= 0 || !input.paidAt) return data;
  const currentPaid = (data.budgetPayments ?? []).filter((payment) => payment.budgetItemId === budgetItemId).reduce((sum, payment) => sum + payment.amount, 0);
  const payable = Math.max(0, item.actualAmount - currentPaid);
  if (payable <= 0) return data;
  const amount = Math.min(Math.round(input.amount), payable);
  const payment: BudgetPayment = {
    id: newId("payment"),
    workspaceId: data.workspace.id,
    budgetItemId,
    amount,
    paidAt: input.paidAt,
    method: input.method?.trim() || undefined,
    type: input.type,
    notes: input.notes?.trim() || undefined,
  };
  const paidAmount = currentPaid + amount;
  const budgetItems = data.budgetItems.map((entry) =>
    entry.id === budgetItemId
      ? {
          ...entry,
          paidAmount,
          paymentStatus: paidAmount >= entry.actualAmount ? ("lunas" as const) : ("dp" as const),
        }
      : entry
  );
  return withActivity(
    { ...data, budgetItems, budgetPayments: [payment, ...(data.budgetPayments ?? [])] },
    ctx,
    "mencatat pembayaran",
    `${formatRupiah(amount)} untuk ${item.name}`
  );
}

export function deleteBudgetPayment(data: UserData, budgetItemId: string, paymentId: string, ctx: ActionContext): UserData {
  const item = data.budgetItems.find((entry) => entry.id === budgetItemId);
  const payment = (data.budgetPayments ?? []).find((entry) => entry.id === paymentId);
  if (!item || !payment) return data;
  const budgetPayments = (data.budgetPayments ?? []).filter((entry) => entry.id !== paymentId);
  const paidAmount = budgetPayments.filter((entry) => entry.budgetItemId === budgetItemId).reduce((sum, entry) => sum + entry.amount, 0);
  const budgetItems = data.budgetItems.map((entry) =>
    entry.id === budgetItemId
      ? {
          ...entry,
          paidAmount,
          paymentStatus: paidAmount >= entry.actualAmount && entry.actualAmount > 0 ? ("lunas" as const) : paidAmount > 0 ? ("dp" as const) : ("belum_bayar" as const),
        }
      : entry
  );
  return withActivity({ ...data, budgetItems, budgetPayments }, ctx, "menghapus pembayaran", item.name);
}

export interface RawGiftInput {
  giftType: GiftRecord["giftType"];
  donorName?: string;
  description: string;
  amount?: number;
  itemName?: string;
  receivedAt: string;
  thankYouStatus: GiftRecord["thankYouStatus"];
  notes?: string;
}

export function saveGift(data: UserData, giftId: string | null, input: RawGiftInput, ctx: ActionContext): UserData {
  if (!data.workspace || !input.description.trim() || !input.receivedAt) return data;
  if ((input.giftType === "cash" || input.giftType === "transfer") && (!input.amount || input.amount < 0)) return data;
  if (giftId) {
    const existing = (data.gifts ?? []).find((gift) => gift.id === giftId);
    if (!existing) return data;
    const gifts = (data.gifts ?? []).map((gift) =>
      gift.id === giftId
        ? {
            ...gift,
            ...input,
            donorName: input.donorName?.trim() || undefined,
            description: input.description.trim(),
            amount: input.giftType === "cash" || input.giftType === "transfer" ? Math.round(input.amount ?? 0) : undefined,
            itemName: input.giftType === "physical" ? input.itemName?.trim() || undefined : undefined,
            notes: input.notes?.trim() || undefined,
          }
        : gift
    );
    return withActivity({ ...data, gifts }, ctx, "memperbarui hadiah", input.description.trim());
  }
  const gift: GiftRecord = {
    id: newId("gift"),
    workspaceId: data.workspace.id,
    giftType: input.giftType,
    donorName: input.donorName?.trim() || undefined,
    description: input.description.trim(),
    amount: input.giftType === "cash" || input.giftType === "transfer" ? Math.round(input.amount ?? 0) : undefined,
    itemName: input.giftType === "physical" ? input.itemName?.trim() || undefined : undefined,
    receivedAt: input.receivedAt,
    thankYouStatus: input.thankYouStatus,
    notes: input.notes?.trim() || undefined,
  };
  return withActivity({ ...data, gifts: [gift, ...(data.gifts ?? [])] }, ctx, "menambah hadiah", gift.description);
}

export function deleteGift(data: UserData, giftId: string, ctx: ActionContext): UserData {
  const gift = (data.gifts ?? []).find((entry) => entry.id === giftId);
  if (!gift) return data;
  return withActivity({ ...data, gifts: (data.gifts ?? []).filter((entry) => entry.id !== giftId) }, ctx, "menghapus hadiah", gift.description);
}

export function updateGiftThankYou(data: UserData, giftId: string, thankYouStatus: GiftRecord["thankYouStatus"], ctx: ActionContext): UserData {
  const gift = (data.gifts ?? []).find((entry) => entry.id === giftId);
  if (!gift) return data;
  const gifts = (data.gifts ?? []).map((entry) => (entry.id === giftId ? { ...entry, thankYouStatus } : entry));
  return withActivity({ ...data, gifts }, ctx, "memperbarui status ucapan terima kasih", gift.description);
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

// ---------------------------------------------------------------- vendor (CRUD, arsip, pembayaran)

export type { VendorActionError };

export type VendorActionResult =
  | { ok: true; data: UserData; vendor: Vendor }
  | { ok: false; error: VendorActionError; errors?: Partial<Record<string, string>> };

function replaceVendor(data: UserData, vendor: Vendor): UserData["vendors"] {
  return data.vendors.map((v) => (v.id === vendor.id ? vendor : v));
}

export function addVendor(data: UserData, raw: RawVendorInput, ctx: ActionContext): VendorActionResult {
  if (!data.workspace) return { ok: false, error: "no-workspace" };
  const { errors, value } = validateVendorInput(raw, data.vendors);
  if (!value) return { ok: false, error: "validation", errors };
  const vendor: Vendor = { id: newId("v"), workspaceId: data.workspace.id, ...value };
  return { ok: true, data: withActivity({ ...data, vendors: [...data.vendors, vendor] }, ctx, "menambahkan vendor", vendor.name), vendor };
}

/** Mengubah vendor; catatan pembayaran, status arsip, dan kolom lain yang tidak ada di form tetap dipertahankan. */
export function updateVendor(data: UserData, vendorId: string, raw: RawVendorInput, ctx: ActionContext): VendorActionResult {
  const current = data.vendors.find((v) => v.id === vendorId);
  if (!current) return { ok: false, error: "not-found" };
  const { errors, value } = validateVendorInput(raw, data.vendors, vendorId);
  if (!value) return { ok: false, error: "validation", errors };
  const vendor: Vendor = { ...current, ...value }; // kolom opsional yang dikosongkan menjadi undefined; payments/archivedAt ikut dari current
  return { ok: true, data: withActivity({ ...data, vendors: replaceVendor(data, vendor) }, ctx, "mengubah vendor", vendor.name), vendor };
}

/** Ubah status pemesanan saja (aksi cepat). Tidak membuat atau mengubah pembayaran apa pun. */
export function setVendorStatus(data: UserData, vendorId: string, status: VendorStatus, ctx: ActionContext): VendorActionResult {
  const current = data.vendors.find((v) => v.id === vendorId);
  if (!current) return { ok: false, error: "not-found" };
  if (!VENDOR_STATUSES.includes(status)) return { ok: false, error: "validation", errors: { status: "Status tidak dikenal." } };
  if (paymentsOf(current).length > 0 && QUOTE_STATUSES.includes(status)) {
    return { ok: false, error: "validation", errors: { status: "Vendor ini sudah punya pembayaran tercatat. Hapus pembayaran dulu, atau ubah status ke Dibatalkan." } };
  }
  const vendor: Vendor = { ...current, status };
  return { ok: true, data: withActivity({ ...data, vendors: replaceVendor(data, vendor) }, ctx, "memperbarui status vendor", vendor.name), vendor };
}

/** Arsip = disembunyikan dari daftar dan ringkasan, tetapi seluruh catatan pembayaran dipertahankan. */
export function archiveVendor(data: UserData, vendorId: string, ctx: ActionContext): VendorActionResult {
  const current = data.vendors.find((v) => v.id === vendorId);
  if (!current) return { ok: false, error: "not-found" };
  if (current.archivedAt) return { ok: true, data, vendor: current };
  const vendor: Vendor = { ...current, archivedAt: (ctx.now ?? new Date()).toISOString() };
  return { ok: true, data: withActivity({ ...data, vendors: replaceVendor(data, vendor) }, ctx, "mengarsipkan vendor", vendor.name), vendor };
}

export function restoreVendor(data: UserData, vendorId: string, ctx: ActionContext): VendorActionResult {
  const current = data.vendors.find((v) => v.id === vendorId);
  if (!current) return { ok: false, error: "not-found" };
  if (!current.archivedAt) return { ok: true, data, vendor: current };
  const { archivedAt: _archivedAt, ...rest } = current;
  void _archivedAt;
  const vendor: Vendor = rest;
  return { ok: true, data: withActivity({ ...data, vendors: replaceVendor(data, vendor) }, ctx, "memulihkan vendor", vendor.name), vendor };
}

/** Hapus permanen; catatan pembayaran vendor itu ikut terhapus (UI menawarkan Arsipkan sebagai pilihan aman). */
export function deleteVendor(data: UserData, vendorId: string, ctx: ActionContext): VendorActionResult {
  const vendor = data.vendors.find((v) => v.id === vendorId);
  if (!vendor) return { ok: false, error: "not-found" };
  const vendors = data.vendors.filter((v) => v.id !== vendorId);
  return { ok: true, data: withActivity({ ...data, vendors }, ctx, "menghapus vendor", vendor.name), vendor };
}

/** Mencatat satu pembayaran yang sudah dilakukan. Hanya ini jalur yang menambah pembayaran. */
export function addVendorPayment(data: UserData, vendorId: string, raw: RawPaymentInput, ctx: ActionContext): VendorActionResult {
  const current = data.vendors.find((v) => v.id === vendorId);
  if (!current) return { ok: false, error: "not-found" };
  const today = localDateString(ctx.now ?? new Date());
  const { errors, value } = validatePaymentInput(raw, current, today);
  if (!value) return { ok: false, error: "validation", errors };
  const payment: VendorPayment = { id: newId("pay"), ...value };
  const vendor: Vendor = { ...current, payments: [...paymentsOf(current), payment] };
  return { ok: true, data: withActivity({ ...data, vendors: replaceVendor(data, vendor) }, ctx, "mencatat pembayaran vendor", `${vendor.name}: ${formatRupiah(payment.amount)}`), vendor };
}

export function deleteVendorPayment(data: UserData, vendorId: string, paymentId: string, ctx: ActionContext): VendorActionResult {
  const current = data.vendors.find((v) => v.id === vendorId);
  const payment = current && paymentsOf(current).find((p) => p.id === paymentId);
  if (!current || !payment) return { ok: false, error: "not-found" };
  const vendor: Vendor = { ...current, payments: paymentsOf(current).filter((p) => p.id !== paymentId) };
  return { ok: true, data: withActivity({ ...data, vendors: replaceVendor(data, vendor) }, ctx, "menghapus catatan pembayaran vendor", `${vendor.name}: ${formatRupiah(payment.amount)}`), vendor };
}
