import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Plus } from "lucide-react";
import { Button } from "@/components/ui";
import { SeserahanSummaryView } from "@/components/seserahan/SeserahanSummary";
import { SeserahanFilters } from "@/components/seserahan/SeserahanFilters";
import { SeserahanEmptyState, SeserahanList } from "@/components/seserahan/SeserahanList";
import { SeserahanFormModal } from "@/components/seserahan/SeserahanFormModal";
import { SeserahanDeleteDialog } from "@/components/seserahan/SeserahanDeleteDialog";
import {
  DEFAULT_SESERAHAN_FILTERS,
  SESERAHAN_STATUS_LABEL,
  filterAndSortSeserahan,
  hasActiveSeserahanFilters,
  itemErrorMessage,
  seserahanCategories,
  summarizeSeserahan,
  type SeserahanFilters as Filters,
  type SeserahanStatus,
} from "@/lib/seserahan";
import { useStore } from "@/lib/store";
import type { SeserahanItem } from "@/lib/types";

type FormState = null | { item: SeserahanItem | null };
type Notice = null | { type: "success" | "error"; text: string };

export default function SeserahanPage() {
  const { seserahan, addSeserahan, updateSeserahan, deleteSeserahan, setSeserahanStatus } = useStore();
  const [filters, setFilters] = useState<Filters>(DEFAULT_SESERAHAN_FILTERS);
  const [form, setForm] = useState<FormState>(null);
  const [toDelete, setToDelete] = useState<SeserahanItem | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  // Pesan sukses hilang sendiri; pesan galat tetap sampai diganti oleh aksi berikutnya.
  useEffect(() => {
    if (notice?.type !== "success") return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const summary = useMemo(() => summarizeSeserahan(seserahan), [seserahan]);
  const visible = useMemo(() => filterAndSortSeserahan(seserahan, filters), [seserahan, filters]);
  const categories = useMemo(() => seserahanCategories(seserahan), [seserahan]);
  const clearFilters = () => setFilters({ ...DEFAULT_SESERAHAN_FILTERS, sort: filters.sort });

  function handleStatus(item: SeserahanItem, status: SeserahanStatus) {
    const result = setSeserahanStatus(item.id, status);
    setNotice(
      result.ok
        ? { type: "success", text: `Status ${item.name} diubah menjadi ${SESERAHAN_STATUS_LABEL[status]}.` }
        : { type: "error", text: itemErrorMessage(result.error) }
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-ink">Seserahan</h2>
          <p className="mt-1 text-sm text-ink-soft">Kelola kebutuhan seserahan dan pantau persiapannya.</p>
        </div>
        <Button onClick={() => setForm({ item: null })}>
          <Plus size={16} aria-hidden="true" /> Tambah Item
        </Button>
      </header>

      {/* Wilayah pengumuman: selalu ada di DOM agar pembaca layar mengumumkan perubahannya */}
      <div role={notice?.type === "error" ? "alert" : "status"} aria-live="polite">
        {notice ? (
          <div className={`flex items-start gap-2 rounded-md px-3 py-2.5 text-sm ${notice.type === "success" ? "bg-success-bg text-[#2F6B47]" : "bg-danger-bg text-[#962F27]"}`}>
            {notice.type === "success" ? <CheckCircle2 size={16} aria-hidden="true" className="mt-0.5 shrink-0" /> : <AlertCircle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />}
            <span>{notice.text}</span>
          </div>
        ) : null}
      </div>

      <SeserahanSummaryView summary={summary} />

      <SeserahanFilters filters={filters} onChange={setFilters} categories={categories} disabled={seserahan.length === 0} shown={visible.length} total={seserahan.length} />

      {seserahan.length === 0 ? (
        <SeserahanEmptyState kind="none" onAdd={() => setForm({ item: null })} onClearFilters={clearFilters} />
      ) : visible.length === 0 ? (
        <SeserahanEmptyState kind="no-match" onAdd={() => setForm({ item: null })} onClearFilters={clearFilters} />
      ) : (
        <SeserahanList items={visible} onEdit={(i) => setForm({ item: i })} onDelete={setToDelete} onStatusChange={handleStatus} />
      )}

      {form ? (
        <SeserahanFormModal
          key={form.item?.id ?? "baru"}
          item={form.item}
          existing={seserahan}
          onClose={() => setForm(null)}
          onSubmit={(raw) => {
            const result = form.item ? updateSeserahan(form.item.id, raw) : addSeserahan(raw);
            if (result.ok) {
              const hidden = hasActiveSeserahanFilters(filters) && filterAndSortSeserahan([result.item], filters).length === 0;
              setForm(null);
              setNotice({ type: "success", text: `${form.item ? "Perubahan disimpan" : "Item ditambahkan"}: ${result.item.name}.${hidden ? " Item ini tidak tampil karena filter aktif." : ""}` });
            }
            return result;
          }}
        />
      ) : null}

      {toDelete ? (
        <SeserahanDeleteDialog
          key={toDelete.id}
          item={toDelete}
          onCancel={() => setToDelete(null)}
          onConfirm={() => {
            const result = deleteSeserahan(toDelete.id);
            if (result.ok) {
              setToDelete(null);
              setNotice({ type: "success", text: `Item dihapus: ${result.item.name}.` });
            }
            return result;
          }}
        />
      ) : null}
    </div>
  );
}
