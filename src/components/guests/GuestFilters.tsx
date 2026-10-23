import { Search, X } from "lucide-react";
import { Button } from "@/components/ui";
import {
  GUEST_SORT_LABEL,
  RSVP_LABEL,
  RSVP_STATUSES,
  hasActiveFilters,
  DEFAULT_GUEST_FILTERS,
  type GuestFilters as Filters,
  type GuestSort,
} from "@/lib/guests";

const SELECT =
  "h-10 rounded-md border border-surface-border bg-white px-3 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-50";

interface Props {
  filters: Filters;
  onChange: (next: Filters) => void;
  categories: string[];
  /** true saat belum ada tamu sama sekali: kontrol dinonaktifkan */
  disabled?: boolean;
  shown: number;
  total: number;
}

export function GuestFilters({ filters, onChange, categories, disabled, shown, total }: Props) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });
  const active = hasActiveFilters(filters);

  return (
    <section aria-label="Cari dan filter tamu" className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            type="search"
            aria-label="Cari nama tamu"
            placeholder="Cari nama tamu"
            value={filters.query}
            disabled={disabled}
            onChange={(e) => set({ query: e.target.value })}
            className="h-10 w-full rounded-md border border-surface-border bg-white pl-9 pr-3 text-sm text-ink placeholder:text-ink-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-50"
          />
        </div>

        <select aria-label="Filter status konfirmasi" className={SELECT} disabled={disabled} value={filters.status} onChange={(e) => set({ status: e.target.value as Filters["status"] })}>
          <option value="all">Semua status</option>
          {RSVP_STATUSES.map((s) => (
            <option key={s} value={s}>
              {RSVP_LABEL[s]}
            </option>
          ))}
        </select>

        <select aria-label="Filter kelompok tamu" className={SELECT} disabled={disabled} value={filters.category} onChange={(e) => set({ category: e.target.value })}>
          <option value="all">Semua kelompok</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select aria-label="Urutkan tamu" className={SELECT} disabled={disabled} value={filters.sort} onChange={(e) => set({ sort: e.target.value as GuestSort })}>
          {(Object.keys(GUEST_SORT_LABEL) as GuestSort[]).map((k) => (
            <option key={k} value={k}>
              Urut: {GUEST_SORT_LABEL[k]}
            </option>
          ))}
        </select>

        {active ? (
          <Button variant="ghost" size="sm" onClick={() => onChange({ ...DEFAULT_GUEST_FILTERS, sort: filters.sort })}>
            <X size={14} aria-hidden="true" /> Hapus filter
          </Button>
        ) : null}
      </div>
      <p className="text-xs text-ink-soft" aria-live="polite">
        {total === 0 ? "Belum ada undangan." : `Menampilkan ${shown} dari ${total} undangan`}
      </p>
    </section>
  );
}
