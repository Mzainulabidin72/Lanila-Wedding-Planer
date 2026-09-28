import { Card, CardBody } from "@/components/ui";
import { BudgetItem, PreparationStage, Vendor, WeddingTask } from "@/lib/types";
import { budgetTotals } from "@/lib/derive";

// Data-driven health summary (section 22): each line is computed from real
// state, never an arbitrary hand-picked score.

interface Props {
  stages: PreparationStage[];
  budgetItems: BudgetItem[];
  vendors: Vendor[];
  tasks: WeddingTask[];
}

type Level = "good" | "watch" | "attention";

const dot: Record<Level, string> = { good: "🟢", watch: "🟡", attention: "🔴" };

export function WeddingHealthPanel({ stages, budgetItems, vendors, tasks }: Props) {
  const rows: { level: Level; title: string; detail: string }[] = [];

  // Administration = KUA-track stages
  const admin = stages.filter((s) => ["RT/RW", "Kelurahan", "Puskesmas", "KUA"].includes(s.name));
  const adminItems = admin.flatMap((s) => s.items);
  const adminDone = adminItems.filter((i) => i.status === "selesai").length;
  rows.push({
    level: adminDone === adminItems.length ? "good" : adminDone / (adminItems.length || 1) > 0.5 ? "watch" : "attention",
    title: "Administrasi",
    detail: `${adminDone} dari ${adminItems.length} dokumen selesai.`,
  });

  // Budget = utilization vs planned
  const { actual, paid, planned } = budgetTotals(budgetItems);
  const overPlanned = actual > planned;
  rows.push({
    level: overPlanned ? "watch" : "good",
    title: "Budget",
    detail: overPlanned
      ? "Total pengeluaran aktual melebihi rencana awal."
      : `${Math.round((paid / (actual || 1)) * 100)}% dari total biaya sudah dibayar.`,
  });

  // Vendors = booked/paid ratio
  const vendorSettled = vendors.filter((v) => v.status === "dp_paid" || v.status === "fully_paid" || v.status === "booked").length;
  rows.push({
    level: vendorSettled === vendors.length ? "good" : vendorSettled / (vendors.length || 1) > 0.6 ? "watch" : "attention",
    title: "Vendor",
    detail: `${vendorSettled} dari ${vendors.length} vendor terkonfirmasi.`,
  });

  // Timeline = tasks due within 7 days or delayed
  const now = Date.now();
  const dueSoon = tasks.filter((t) => {
    if (t.status === "completed") return false;
    if (t.status === "delayed") return true;
    if (!t.deadline) return false;
    const days = (new Date(t.deadline).getTime() - now) / (1000 * 60 * 60 * 24);
    return days <= 7;
  });
  rows.push({
    level: dueSoon.length === 0 ? "good" : dueSoon.length <= 2 ? "watch" : "attention",
    title: "Timeline",
    detail: dueSoon.length === 0 ? "Tidak ada tugas mendesak minggu ini." : `${dueSoon.length} tugas perlu perhatian dalam 7 hari.`,
  });

  return (
    <Card>
      <CardBody className="space-y-3">
        <h3 className="text-base font-semibold text-ink">Status Persiapan</h3>
        <ul className="space-y-2.5">
          {rows.map((r) => (
            <li key={r.title} className="flex items-start gap-2.5 text-sm">
              <span aria-hidden className="mt-0.5">{dot[r.level]}</span>
              <div>
                <p className="font-medium text-ink">{r.title}</p>
                <p className="text-ink-soft">{r.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
