import { CheckCircle2, Clock, Pencil, Phone, SearchX, Trash2, UserPlus, XCircle, type LucideIcon } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { RSVP_LABEL, RSVP_STATUSES } from "@/lib/guests";
import type { Guest, RsvpStatus } from "@/lib/types";

const STATUS_STYLE: Record<RsvpStatus, { icon: LucideIcon; box: string; iconColor: string }> = {
  belum: { icon: Clock, box: "border-warning/40 bg-warning-bg", iconColor: "text-[#8A6428]" },
  hadir: { icon: CheckCircle2, box: "border-success/40 bg-success-bg", iconColor: "text-success" },
  tidak_hadir: { icon: XCircle, box: "border-danger/40 bg-danger-bg", iconColor: "text-danger" },
};

/** Pilihan status: ikon + teks (bukan hanya warna) menunjukkan status. */
function RsvpSelect({ guest, onChange }: { guest: Guest; onChange: (g: Guest, s: RsvpStatus) => void }) {
  const { icon: Icon, box, iconColor } = STATUS_STYLE[guest.rsvp];
  return (
    <div className="relative inline-block">
      <Icon size={15} aria-hidden="true" className={`pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 ${iconColor}`} />
      <select
        aria-label={`Status konfirmasi ${guest.name}`}
        value={guest.rsvp}
        onChange={(e) => onChange(guest, e.target.value as RsvpStatus)}
        className={`h-9 rounded-md border py-1 pl-8 pr-2 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand ${box}`}
      >
        {RSVP_STATUSES.map((s) => (
          <option key={s} value={s}>
            {RSVP_LABEL[s]}
          </option>
        ))}
      </select>
    </div>
  );
}

function RowActions({ guest, onEdit, onDelete }: { guest: Guest; onEdit: (g: Guest) => void; onDelete: (g: Guest) => void }) {
  const btn =
    "flex h-9 w-9 items-center justify-center rounded-md text-ink-soft hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand";
  return (
    <div className="flex items-center gap-1">
      <button type="button" className={btn} onClick={() => onEdit(guest)} aria-label={`Ubah ${guest.name}`}>
        <Pencil size={16} aria-hidden="true" />
      </button>
      <button type="button" className={`${btn} hover:text-danger`} onClick={() => onDelete(guest)} aria-label={`Hapus ${guest.name}`}>
        <Trash2 size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

interface ListProps {
  guests: Guest[];
  onEdit: (g: Guest) => void;
  onDelete: (g: Guest) => void;
  onRsvpChange: (g: Guest, s: RsvpStatus) => void;
}

export function GuestList({ guests, onEdit, onDelete, onRsvpChange }: ListProps) {
  return (
    <Card>
      {/* Tablet/desktop: tabel */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <caption className="sr-only">Daftar tamu undangan</caption>
          <thead>
            <tr className="border-b border-surface-border text-left text-xs text-ink-soft">
              <th scope="col" className="px-4 py-3 font-medium">Nama</th>
              <th scope="col" className="px-3 py-3 font-medium">Kelompok</th>
              <th scope="col" className="px-3 py-3 font-medium">Kontak</th>
              <th scope="col" className="px-3 py-3 font-medium">Jumlah orang</th>
              <th scope="col" className="px-3 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {guests.map((g) => (
              <tr key={g.id} className="border-b border-surface-border last:border-0">
                <td className="max-w-[260px] px-4 py-3">
                  <p className="truncate font-medium text-ink">{g.name}</p>
                  {g.notes ? <p className="mt-0.5 truncate text-xs text-ink-soft" title={g.notes}>{g.notes}</p> : null}
                </td>
                <td className="px-3 py-3 text-ink-soft">{g.category}</td>
                <td className="px-3 py-3 text-ink-soft">{g.phone ?? <span aria-label="Tidak ada kontak">-</span>}</td>
                <td className="px-3 py-3 tabular-nums text-ink-soft">{g.pax}</td>
                <td className="px-3 py-3">
                  <RsvpSelect guest={g} onChange={onRsvpChange} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <RowActions guest={g} onEdit={onEdit} onDelete={onDelete} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: kartu */}
      <ul className="divide-y divide-surface-border md:hidden">
        {guests.map((g) => (
          <li key={g.id} className="space-y-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{g.name}</p>
                <p className="text-xs text-ink-soft">
                  {g.category} · {g.pax} orang
                </p>
              </div>
              <RowActions guest={g} onEdit={onEdit} onDelete={onDelete} />
            </div>
            {g.phone ? (
              <p className="flex items-center gap-1.5 text-xs text-ink-soft">
                <Phone size={13} aria-hidden="true" /> {g.phone}
              </p>
            ) : null}
            {g.notes ? <p className="text-xs text-ink-soft">{g.notes}</p> : null}
            <RsvpSelect guest={g} onChange={onRsvpChange} />
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** Keadaan kosong yang ringkas, di dalam area daftar (bukan panel selebar halaman). */
export function GuestEmptyState({ kind, onAdd, onClearFilters }: { kind: "none" | "no-match"; onAdd: () => void; onClearFilters: () => void }) {
  const none = kind === "none";
  const Icon = none ? UserPlus : SearchX;
  return (
    <Card>
      <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blush-50 text-blush-600">
          <Icon size={22} aria-hidden="true" />
        </span>
        <div>
          <p className="font-medium text-ink">{none ? "Belum ada tamu" : "Tidak ada tamu yang cocok"}</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">
            {none
              ? "Mulai susun daftar tamu undangan untuk memantau konfirmasi kehadiran."
              : "Coba ubah kata kunci pencarian atau filter yang sedang dipakai."}
          </p>
        </div>
        {none ? (
          <Button size="sm" onClick={onAdd}>
            Tambah Tamu
          </Button>
        ) : (
          <Button size="sm" variant="secondary" onClick={onClearFilters}>
            Hapus filter
          </Button>
        )}
      </div>
    </Card>
  );
}
