import { BudgetItem, Guest, PreparationStage, WeddingTask } from "./types";

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
    value
  );
}

export function formatDate(iso?: string): string {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
}

export function getCountdown(weddingDateIso: string) {
  const target = new Date(weddingDateIso).getTime();
  const now = Date.now();
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds, isPast: diff === 0 };
}

export function overallPreparationProgress(stages: PreparationStage[]) {
  const allItems = stages.flatMap((s) => s.items);
  const done = allItems.filter((i) => i.status === "selesai").length;
  const total = allItems.length || 1;
  return { done, total, percent: Math.round((done / total) * 100) };
}

export function stageProgress(stage: PreparationStage) {
  const total = stage.items.length || 1;
  const done = stage.items.filter((i) => i.status === "selesai").length;
  return Math.round((done / total) * 100);
}

export function budgetTotals(items: BudgetItem[]) {
  const planned = items.reduce((sum, i) => sum + i.plannedAmount, 0);
  const actual = items.reduce((sum, i) => sum + i.actualAmount, 0);
  const paid = items.reduce((sum, i) => sum + i.paidAmount, 0);
  const remaining = Math.max(0, actual - paid);
  const utilization = actual === 0 ? 0 : Math.round((paid / actual) * 100);
  return { planned, actual, paid, remaining, utilization };
}

export function guestTotals(guests: Guest[]) {
  const total = guests.reduce((sum, g) => sum + g.pax, 0);
  const confirmed = guests.filter((g) => g.rsvp === "hadir").reduce((s, g) => s + g.pax, 0);
  const pending = guests.filter((g) => g.rsvp === "belum").reduce((s, g) => s + g.pax, 0);
  const declined = guests.filter((g) => g.rsvp === "tidak_hadir").reduce((s, g) => s + g.pax, 0);
  return { total, confirmed, pending, declined };
}

export function upcomingTasks(tasks: WeddingTask[], limit = 5) {
  return [...tasks]
    .filter((t) => t.status !== "completed" && t.deadline)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, limit);
}

export function daysUntil(iso?: string): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
