import { CheckCircle2, Package, ShoppingBag, Wallet, type LucideIcon } from "lucide-react";
import { Card, ProgressBar } from "@/components/ui";
import { formatRupiah } from "@/lib/derive";
import type { SeserahanSummary } from "@/lib/seserahan";

/**
 * Kemajuan + 4 kartu ringkasan, semuanya dihitung dari data.
 * Selesai = status "Sudah Disiapkan". Total = Sudah Disiapkan + Dalam Persiapan + Belum Dibeli.
 * Estimasi (perkiraan semua item) dan Realisasi (biaya sebenarnya item yang sudah disiapkan) dipisah.
 */
export function SeserahanSummaryView({ summary }: { summary: SeserahanSummary }) {
  const { total, done, inProgress, notBought, percent, estimated, actual } = summary;

  const cards: { label: string; value: string; sub: string; icon: LucideIcon; chip: string; wide?: boolean }[] = [
    { label: "Total Item", value: String(total), sub: total === 1 ? "1 item seserahan" : `${total} item seserahan`, icon: Package, chip: "bg-blush-50 text-blush-600" },
    { label: "Sudah Disiapkan", value: String(done), sub: `dari ${total} item`, icon: CheckCircle2, chip: "bg-success-bg text-success" },
    { label: "Belum Dibeli", value: String(notBought), sub: `${inProgress} dalam persiapan`, icon: ShoppingBag, chip: "bg-warning-bg text-[#8A6428]" },
    { label: "Estimasi Biaya", value: formatRupiah(estimated), sub: `Realisasi: ${formatRupiah(actual)}`, icon: Wallet, chip: "bg-surface-muted text-ink-soft", wide: true },
  ];

  return (
    <section aria-label="Ringkasan seserahan" className="space-y-3">
      <Card>
        <div className="space-y-2.5 p-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-ink">Kemajuan persiapan</p>
              <p className="text-xs text-ink-soft">
                {total === 0 ? "Belum ada item" : `${done} dari ${total} item sudah disiapkan`}
              </p>
            </div>
            <p className="text-2xl font-semibold tabular-nums text-ink">{percent}%</p>
          </div>
          <ProgressBar percent={percent} tone={percent === 100 ? "success" : "blush"} label="Kemajuan persiapan seserahan" />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(({ label, value, sub, icon: Icon, chip, wide }) => (
          <Card key={label} className={`h-full ${wide ? "col-span-2 lg:col-span-1" : ""}`}>
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
        Estimasi adalah perkiraan biaya semua item. Realisasi hanya dihitung dari biaya sebenarnya item yang berstatus Sudah Disiapkan.
        Angka ini hanya untuk Seserahan dan tidak mengubah Budget.
      </p>
    </section>
  );
}
