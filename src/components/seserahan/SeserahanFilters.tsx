import { Search, X } from "lucide-react";
import { Button } from "@/components/ui";
import {
  DEFAULT_SESERAHAN_FILTERS,
  SESERAHAN_SORT_LABEL,
  SESERAHAN_STATUSES,
  SESERAHAN_STATUS_LABEL,
  hasActiveSeserahanFilters,
  type SeserahanFilters as Filters,
  type SeserahanSort,
} from "@/lib/seserahan";

const SELECT =
  "h-10 rounded-md border border-surface-border bg-white px-3 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-50";

interface Props {
  filters: Filters;
  onChange: (next: Filters) => void;
  categories: string[];
  /** true saat belum ada item sama sekali: kontrol dinonaktifkan */
  disabled?: boolean;
  shown: number;
  total: number;
}

export function SeserahanFilters({ filters, onChange, categories, disabled, shown, total }: Props) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });
  return (
    <section aria-label="Cari dan filter item seserahan" className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            type="search"
            aria-label="Cari nama item"
            placeholder="Cari nama item"
            value={filters.query}
            disabled={disabled}
            onChange={(e) => set({ query: e.target.value })}
            className="h-10 w-full rounded-md border border-surface-border bg-white pl-9 pr-3 text-sm text-ink placeholder:text-ink-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-50"
          />
        </div>
        <select aria-label="Filter kategori" className={SELECT} disabled={disabled} value={filters.category} onChange={(e) => set({ category: e.target.value })}>
          <option value="all">Semua kategori</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select aria-label="Filter status persiapan" className={SELECT} disabled={disabled} value={filters.status} onChange={(e) => set({ status: e.target.value as Filters["status"] })}>
          <option value="all">Semua status</option>
          {SESERAHAN_STATUSES.map((s) => (
            <option key={s} value={s}>
              {SESERAHAN_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select aria-label="Urutkan item" className={SELECT} disabled={disabled} value={filters.sort} onChange={(e) => set({ sort: e.target.value as SeserahanSort })}>
          {(Object.keys(SESERAHAN_SORT_LABEL) as SeserahanSort[]).map((k) => (
            <option key={k} value={k}>
              Urut: {SESERAHAN_SORT_LABEL[k]}
            </option>
          ))}
        </select>
        {hasActiveSeserahanFilters(filters) ? (
          <Button variant="ghost" size="sm" onClick={() => onChange({ ...DEFAULT_SESERAHAN_FILTERS, sort: filters.sort })}>
            <X size={14} aria-hidden="true" /> Hapus filter
          </Button>
        ) : null}
      </div>
      <p className="text-xs text-ink-soft" aria-live="polite">
        {total === 0 ? "Belum ada item." : `Menampilkan ${shown} dari ${total} item`}
      </p>
    </section>
  );
}
