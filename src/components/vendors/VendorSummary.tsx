import { CalendarCheck, Receipt, Store, Wallet, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui";
import { formatRupiah } from "@/lib/derive";
import type { VendorSummary } from "@/lib/vendors";

/**
 * Semua angka dihitung dari data vendor.
 *  - Total Nilai Kontrak = nilai vendor yang SUDAH DIPESAN saja (penawaran dipisah, bukan biaya)
 *  - Sisa Pembayaran    = nilai kontrak − pembayaran yang benar-benar tercatat
 */
export function VendorSummaryView({ summary }: { summary: VendorSummary }) {
  const extra = [summary.cancelled ? `${summary.cancelled} dibatalkan` : "", summary.archived ? `${summary.archived} diarsipkan` : ""].filter(Boolean).join(" · ");
  const cards: { label: string; value: string; sub: string; icon: LucideIcon; chip: string }[] = [
    { label: "Total Vendor", value: String(summary.total), sub: extra || "vendor aktif", icon: Store, chip: "bg-blush-50 text-blush-600" },
    { label: "Sudah Dipesan", value: String(summary.booked), sub: `dari ${summary.total} vendor aktif`, icon: CalendarCheck, chip: "bg-success-bg text-success" },
    { label: "Total Nilai Kontrak", value: formatRupiah(summary.contractValue), sub: `Penawaran belum dipesan: ${formatRupiah(summary.quoteValue)}`, icon: Receipt, chip: "bg-surface-muted text-ink-soft" },
    { label: "Sisa Pembayaran", value: formatRupiah(summary.remaining), sub: `Terbayar: ${formatRupiah(summary.paid)}`, icon: Wallet, chip: "bg-warning-bg text-[#8A6428]" },
  ];
  return (
    <section aria-label="Ringkasan vendor" className="space-y-2">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(({ label, value, sub, icon: Icon, chip }) => (
          <Card key={label} className="h-full">
            <div className="flex h-full items-center gap-3 p-4">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${chip}`}>
                <Icon size={18} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs text-ink-soft">{label}</p>
                <p className="mt-0.5 break-words text-xl font-semibold leading-tight tabular-nums text-ink">{value}</p>
                <p className="break-words text-xs tabular-nums text-ink-soft">{sub}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <p className="text-xs text-ink-soft">
        Nilai kontrak hanya dari vendor yang sudah dipesan; penawaran belum dihitung sebagai biaya. Pembayaran dicatat di halaman ini dan tidak mengubah Budget.
      </p>
    </section>
  );
}
