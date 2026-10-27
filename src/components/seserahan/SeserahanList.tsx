import { CheckCircle2, Circle, Clock, PackagePlus, Pencil, SearchX, Trash2, type LucideIcon } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { formatRupiah } from "@/lib/derive";
import { SESERAHAN_STATUSES, SESERAHAN_STATUS_LABEL, quantityOf, type SeserahanStatus } from "@/lib/seserahan";
import type { SeserahanItem } from "@/lib/types";

const STATUS_STYLE: Record<SeserahanStatus, { icon: LucideIcon; box: string; iconColor: string }> = {
  belum: { icon: Circle, box: "border-surface-border bg-surface-muted", iconColor: "text-ink-soft" },
  diproses: { icon: Clock, box: "border-warning/40 bg-warning-bg", iconColor: "text-[#8A6428]" },
  dibeli: { icon: CheckCircle2, box: "border-success/40 bg-success-bg", iconColor: "text-success" },
};

/** Pilihan status: ikon + teks (bukan hanya warna) menunjukkan status. */
function StatusSelect({ item, onChange }: { item: SeserahanItem; onChange: (i: SeserahanItem, s: SeserahanStatus) => void }) {
  const { icon: Icon, box, iconColor } = STATUS_STYLE[item.status];
  return (
    <div className="relative inline-block">
      <Icon size={15} aria-hidden="true" className={`pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 ${iconColor}`} />
      <select
        aria-label={`Status persiapan ${item.name}`}
        value={item.status}
        onChange={(e) => onChange(item, e.target.value as SeserahanStatus)}
        className={`h-9 rounded-md border py-1 pl-8 pr-2 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand ${box}`}
      >
        {SESERAHAN_STATUSES.map((s) => (
          <option key={s} value={s}>
            {SESERAHAN_STATUS_LABEL[s]}
          </option>
        ))}
      </select>
    </div>
  );
}

function Cost({ item }: { item: SeserahanItem }) {
  return (
    <div className="tabular-nums">
      <p className="text-ink">{formatRupiah(item.plannedBudget)}</p>
      {item.status === "dibeli" && item.actualCost > 0 ? <p className="text-xs text-ink-soft">Realisasi {formatRupiah(item.actualCost)}</p> : null}
    </div>
  );
}

function RowActions({ item, onEdit, onDelete }: { item: SeserahanItem; onEdit: (i: SeserahanItem) => void; onDelete: (i: SeserahanItem) => void }) {
  const btn = "flex h-9 w-9 items-center justify-center rounded-md text-ink-soft hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand";
  return (
    <div className="flex items-center gap-1">
      <button type="button" className={btn} onClick={() => onEdit(item)} aria-label={`Ubah ${item.name}`}>
        <Pencil size={16} aria-hidden="true" />
      </button>
      <button type="button" className={`${btn} hover:text-danger`} onClick={() => onDelete(item)} aria-label={`Hapus ${item.name}`}>
        <Trash2 size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

interface ListProps {
  items: SeserahanItem[];
  onEdit: (i: SeserahanItem) => void;
  onDelete: (i: SeserahanItem) => void;
  onStatusChange: (i: SeserahanItem, s: SeserahanStatus) => void;
}

export function SeserahanList({ items, onEdit, onDelete, onStatusChange }: ListProps) {
  return (
    <Card>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <caption className="sr-only">Daftar item seserahan</caption>
          <thead>
            <tr className="border-b border-surface-border text-left text-xs text-ink-soft">
              <th scope="col" className="px-4 py-3 font-medium">Item</th>
              <th scope="col" className="px-3 py-3 font-medium">Kategori</th>
              <th scope="col" className="px-3 py-3 font-medium">Jumlah</th>
              <th scope="col" className="px-3 py-3 font-medium">Estimasi biaya</th>
              <th scope="col" className="px-3 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-b border-surface-border last:border-0">
                <td className="max-w-[260px] px-4 py-3">
                  <p className="truncate font-medium text-ink">{i.name}</p>
                  {i.notes ? <p className="mt-0.5 truncate text-xs text-ink-soft" title={i.notes}>{i.notes}</p> : null}
                </td>
                <td className="px-3 py-3 text-ink-soft">{i.category}</td>
                <td className="px-3 py-3 tabular-nums text-ink-soft">{quantityOf(i)}</td>
                <td className="px-3 py-3"><Cost item={i} /></td>
                <td className="px-3 py-3"><StatusSelect item={i} onChange={onStatusChange} /></td>
                <td className="px-4 py-3">
                  <div className="flex justify-end"><RowActions item={i} onEdit={onEdit} onDelete={onDelete} /></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-surface-border md:hidden">
        {items.map((i) => (
          <li key={i.id} className="space-y-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{i.name}</p>
                <p className="text-xs text-ink-soft">{i.category} · {quantityOf(i)} buah</p>
              </div>
              <RowActions item={i} onEdit={onEdit} onDelete={onDelete} />
            </div>
            <Cost item={i} />
            {i.notes ? <p className="text-xs text-ink-soft">{i.notes}</p> : null}
            <StatusSelect item={i} onChange={onStatusChange} />
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** Keadaan kosong yang ringkas, di dalam area daftar. */
export function SeserahanEmptyState({ kind, onAdd, onClearFilters }: { kind: "none" | "no-match"; onAdd: () => void; onClearFilters: () => void }) {
  const none = kind === "none";
  const Icon = none ? PackagePlus : SearchX;
  return (
    <Card>
      <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blush-50 text-blush-600">
          <Icon size={22} aria-hidden="true" />
        </span>
        <div>
          <p className="font-medium text-ink">{none ? "Belum ada item seserahan" : "Tidak ada item yang cocok"}</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">
            {none ? "Mulai catat kebutuhan seserahan untuk memantau persiapan dan perkiraan biayanya." : "Coba ubah kata kunci pencarian atau filter yang sedang dipakai."}
          </p>
        </div>
        {none ? (
          <Button size="sm" onClick={onAdd}>Tambah Item Pertama</Button>
        ) : (
          <Button size="sm" variant="secondary" onClick={onClearFilters}>Hapus filter</Button>
        )}
      </div>
    </Card>
  );
}
