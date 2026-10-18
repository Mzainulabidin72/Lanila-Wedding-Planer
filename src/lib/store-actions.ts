/**
 * Operasi data murni (tanpa React) atas UserData milik satu akun.
 * Dipisah dari store.tsx supaya logikanya bisa diuji langsung.
 */

import { formatRupiah } from "./derive";
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
