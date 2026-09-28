// Domain types. These mirror the proposed Postgres schema (see /supabase/schema.sql)
// so the mock data layer in lib/store.tsx can be swapped for real Supabase queries
// later without changing any component code.

export type Role = "owner" | "partner" | "viewer";

export interface Profile {
  id: string;
  fullName: string;
  avatarUrl?: string;
}

export interface WeddingMember {
  profileId: string;
  workspaceId: string;
  role: Role;
  fullName: string;
  avatarUrl?: string;
}

export interface WeddingWorkspace {
  id: string;
  name: string; // e.g. "Ayu & Angga"
  weddingDate: string; // ISO date
  weddingType: string;
  venue?: string;
  targetBudget: number;
}

export type PreparationStatus = "belum" | "diproses" | "selesai" | "tertunda";

export interface PreparationItem {
  id: string;
  stageId: string;
  title: string;
  status: PreparationStatus;
  deadline?: string;
  responsible?: string;
  notes?: string;
}

export interface PreparationStage {
  id: string;
  workspaceId: string;
  name: string;
  order: number;
  items: PreparationItem[];
}

export type TaskStatus = "todo" | "in_progress" | "completed" | "delayed";
export type TaskPriority = "low" | "medium" | "high" | "critical";

export interface WeddingTask {
  id: string;
  workspaceId: string;
  title: string;
  category: string;
  assignee?: string;
  startDate?: string;
  deadline?: string;
  priority: TaskPriority;
  status: TaskStatus;
  linkedPreparationItemId?: string;
}

export type PaymentStatus = "belum_bayar" | "dp" | "lunas";

export interface BudgetItem {
  id: string;
  workspaceId: string;
  category: string;
  name: string;
  plannedAmount: number;
  actualAmount: number;
  paidAmount: number;
  vendorId?: string;
  deadline?: string;
  paymentStatus: PaymentStatus;
  notes?: string;
}

export type VendorStatus =
  | "research"
  | "contacted"
  | "negotiation"
  | "booked"
  | "dp_paid"
  | "fully_paid"
  | "cancelled";

export interface Vendor {
  id: string;
  workspaceId: string;
  name: string;
  category: string;
  contactPerson?: string;
  phone?: string;
  price: number;
  dpAmount: number;
  status: VendorStatus;
  paymentDeadline?: string;
  notes?: string;
}

export type RsvpStatus = "belum" | "hadir" | "tidak_hadir";

export interface Guest {
  id: string;
  workspaceId: string;
  name: string;
  category: string;
  relationship?: string;
  phone?: string;
  pax: number;
  rsvp: RsvpStatus;
  table?: string;
  giftStatus?: "belum" | "sudah";
  notes?: string;
}

export interface SeserahanItem {
  id: string;
  workspaceId: string;
  name: string;
  category: string;
  plannedBudget: number;
  actualCost: number;
  status: "belum" | "diproses" | "dibeli";
  purchaseDate?: string;
  notes?: string;
}

export interface FinancialTransaction {
  id: string;
  profileId: string;
  workspaceId?: string;
  sourceApp: "wedding_planner" | "buku_kas";
  relatedBudgetItemId?: string;
  amount: number;
  type: "expense" | "income";
  description: string;
  createdAt: string;
}

export interface ActivityLogEntry {
  id: string;
  workspaceId: string;
  actorName: string;
  action: string;
  objectLabel: string;
  createdAt: string;
}
