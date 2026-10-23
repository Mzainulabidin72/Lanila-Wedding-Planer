import { Clock, UserCheck, UserX, Users, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui";
import type { GuestSummary } from "@/lib/guests";

const CARDS: { key: keyof GuestSummary; label: string; icon: LucideIcon; chip: string }[] = [
  { key: "total", label: "Total Tamu", icon: Users, chip: "bg-blush-50 text-blush-600" },
  { key: "hadir", label: "Hadir", icon: UserCheck, chip: "bg-success-bg text-success" },
  { key: "belum", label: "Menunggu Konfirmasi", icon: Clock, chip: "bg-warning-bg text-[#8A6428]" },
  { key: "tidak_hadir", label: "Tidak Hadir", icon: UserX, chip: "bg-danger-bg text-danger" },
];

/**
 * Angka besar = jumlah ORANG (pax); keterangan kecil = jumlah UNDANGAN (baris tamu).
 * Hadir + Menunggu + Tidak Hadir selalu sama dengan Total di kedua satuan.
 */
export function GuestSummaryCards({ summary }: { summary: GuestSummary }) {
  return (
    <section aria-label="Ringkasan tamu">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {CARDS.map(({ key, label, icon: Icon, chip }) => (
          <Card key={key} className="h-full">
            <div className="flex h-full items-center gap-3 p-4">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${chip}`}>
                <Icon size={18} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs text-ink-soft">{label}</p>
                <p className="mt-0.5 text-xl font-semibold leading-tight tabular-nums text-ink">
                  {summary[key].people} <span className="text-xs font-normal text-ink-soft">orang</span>
                </p>
                <p className="text-xs tabular-nums text-ink-soft">{summary[key].invitations} undangan</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <p className="mt-2 text-xs text-ink-soft">
        Angka besar adalah jumlah orang. Satu undangan bisa mencakup lebih dari satu orang.
      </p>
    </section>
  );
}
