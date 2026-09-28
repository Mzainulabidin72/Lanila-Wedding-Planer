"use client";

import { useStore } from "@/lib/store";
import { Card, CardBody, EmptyState, Button } from "@/components/ui";
import { Badge } from "@/components/ui/Badge";
import { formatRupiah } from "@/lib/derive";
import { SeserahanItem } from "@/lib/types";
import { Plus } from "lucide-react";

const STATUS: Record<SeserahanItem["status"], { label: string; tone: "neutral" | "warning" | "success" }> = {
  belum: { label: "Belum", tone: "neutral" },
  diproses: { label: "Diproses", tone: "warning" },
  dibeli: { label: "Dibeli", tone: "success" },
};

export default function SeserahanPage() {
  const { seserahan, updateSeserahanStatus } = useStore();

  if (seserahan.length === 0) {
    return (
      <EmptyState
        icon="🎁"
        title="Belum ada item seserahan."
        description="Tambahkan item pertama untuk mulai melacak checklist seserahan."
        actionLabel="+ Tambah Item"
        onAction={() => {}}
      />
    );
  }

  const plannedTotal = seserahan.reduce((s, i) => s + i.plannedBudget, 0);
  const actualTotal = seserahan.reduce((s, i) => s + i.actualCost, 0);
  const remaining = Math.max(0, plannedTotal - actualTotal);
  const savings = Math.max(0, plannedTotal - actualTotal);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Rencana Total", value: plannedTotal },
          { label: "Realisasi", value: actualTotal },
          { label: "Sisa", value: remaining },
          { label: "Hemat", value: savings },
        ].map((s) => (
          <Card key={s.label}>
            <CardBody>
              <p className="text-xs text-ink-faint">{s.label}</p>
              <p className="mt-1 text-lg font-semibold text-ink">{formatRupiah(s.value)}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardBody>
          <div className="mb-3 flex justify-end">
            <Button size="sm">
              <Plus size={15} /> Tambah Item
            </Button>
          </div>
          <div className="scroll-x">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-surface-border text-left text-xs text-ink-faint">
                  <th className="py-2 font-medium">Item</th>
                  <th className="py-2 font-medium">Kategori</th>
                  <th className="py-2 font-medium">Budget</th>
                  <th className="py-2 font-medium">Realisasi</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {seserahan.map((item) => (
                  <tr key={item.id} className="border-b border-surface-border last:border-0">
                    <td className="py-2.5 text-ink">{item.name}</td>
                    <td className="py-2.5 text-ink-soft">{item.category}</td>
                    <td className="py-2.5 text-ink-soft">{formatRupiah(item.plannedBudget)}</td>
                    <td className="py-2.5 text-ink-soft">{formatRupiah(item.actualCost)}</td>
                    <td className="py-2.5">
                      <select
                        value={item.status}
                        onChange={(e) => updateSeserahanStatus(item.id, e.target.value as SeserahanItem["status"])}
                        className="rounded-md border border-surface-border bg-transparent px-1 py-0.5 text-xs"
                      >
                        <option value="belum">Belum</option>
                        <option value="diproses">Diproses</option>
                        <option value="dibeli">Dibeli</option>
                      </select>
                      <span className="ml-2 hidden sm:inline">
                        <Badge tone={STATUS[item.status].tone}>{STATUS[item.status].label}</Badge>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
