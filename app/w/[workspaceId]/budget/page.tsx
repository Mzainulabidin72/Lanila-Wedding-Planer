"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardBody, Button, Modal, ProgressBar } from "@/components/ui";
import { Badge } from "@/components/ui/Badge";
import { budgetTotals, formatRupiah } from "@/lib/derive";
import { BudgetItem } from "@/lib/types";
import { Plus } from "lucide-react";

const PAYMENT_LABEL: Record<BudgetItem["paymentStatus"], { label: string; tone: "neutral" | "warning" | "success" }> = {
  belum_bayar: { label: "Belum Bayar", tone: "neutral" },
  dp: { label: "DP Terbayar", tone: "warning" },
  lunas: { label: "Lunas", tone: "success" },
};

export default function BudgetPage() {
  const { budgetItems, recordBudgetPayment } = useStore();
  const totals = budgetTotals(budgetItems);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");

  const grouped = useMemo(() => {
    const map = new Map<string, BudgetItem[]>();
    budgetItems.forEach((item) => {
      map.set(item.category, [...(map.get(item.category) ?? []), item]);
    });
    return Array.from(map.entries());
  }, [budgetItems]);

  const payingItem = budgetItems.find((b) => b.id === payingId) ?? null;

  function submitPayment() {
    const value = Number(amount.replace(/[^0-9]/g, ""));
    if (payingId && value > 0) {
      recordBudgetPayment(payingId, value);
    }
    setPayingId(null);
    setAmount("");
  }

  if (budgetItems.length === 0) {
    return (
      <Card>
        <CardBody>
          <p className="font-medium text-ink">Belum ada budget pernikahan yang dibuat.</p>
          <p className="mt-1 text-sm text-ink-soft">Mulai dengan membuat kategori dan item budget pertamamu.</p>
          <Button className="mt-4" size="sm">
            <Plus size={15} /> Buat Budget
          </Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-xs text-ink-faint">Total Budget</p>
            <p className="mt-1 text-xl font-semibold text-ink">{formatRupiah(totals.actual)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-ink-faint">Total Terbayar</p>
            <p className="mt-1 text-xl font-semibold text-ink">{formatRupiah(totals.paid)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-ink-faint">Sisa Pembayaran</p>
            <p className="mt-1 text-xl font-semibold text-blush-600">{formatRupiah(totals.remaining)}</p>
          </CardBody>
        </Card>
      </div>

      {grouped.map(([category, items]) => {
        const catTotals = budgetTotals(items);
        return (
          <Card key={category}>
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-ink">{category}</h3>
                <span className="text-sm text-ink-faint">
                  {formatRupiah(catTotals.paid)} / {formatRupiah(catTotals.actual)}
                </span>
              </div>
              <ProgressBar percent={catTotals.utilization} tone="success" size="sm" />

              <div className="scroll-x">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-surface-border text-left text-xs text-ink-faint">
                      <th className="py-2 font-medium">Item</th>
                      <th className="py-2 font-medium">Rencana</th>
                      <th className="py-2 font-medium">Aktual</th>
                      <th className="py-2 font-medium">Terbayar</th>
                      <th className="py-2 font-medium">Status</th>
                      <th className="py-2 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b border-surface-border last:border-0">
                        <td className="py-2.5 text-ink">{item.name}</td>
                        <td className="py-2.5 text-ink-soft">{formatRupiah(item.plannedAmount)}</td>
                        <td className="py-2.5 text-ink-soft">{formatRupiah(item.actualAmount)}</td>
                        <td className="py-2.5 text-ink-soft">{formatRupiah(item.paidAmount)}</td>
                        <td className="py-2.5">
                          <Badge tone={PAYMENT_LABEL[item.paymentStatus].tone}>
                            {PAYMENT_LABEL[item.paymentStatus].label}
                          </Badge>
                        </td>
                        <td className="py-2.5 text-right">
                          {item.paymentStatus !== "lunas" ? (
                            <button
                              className="text-xs font-medium text-blush-600 hover:underline"
                              onClick={() => setPayingId(item.id)}
                            >
                              Catat pembayaran
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        );
      })}

      <Modal open={!!payingItem} onClose={() => setPayingId(null)} title={`Catat pembayaran — ${payingItem?.name ?? ""}`}>
        <div className="space-y-3">
          <p className="text-sm text-ink-soft">
            Sisa tagihan: {payingItem ? formatRupiah(payingItem.actualAmount - payingItem.paidAmount) : "-"}
          </p>
          <label className="block text-sm">
            <span className="mb-1 block text-ink-soft">Jumlah dibayar (Rp)</span>
            <input
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="5.000.000"
              className="w-full rounded-md border border-surface-border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
            />
          </label>
          <p className="text-xs text-ink-faint">
            Pembayaran ini nantinya juga dapat tercatat sebagai transaksi keuangan di Lanila Buku Kas.
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" size="sm" onClick={() => setPayingId(null)}>
              Batal
            </Button>
            <Button size="sm" onClick={submitPayment}>
              Simpan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
