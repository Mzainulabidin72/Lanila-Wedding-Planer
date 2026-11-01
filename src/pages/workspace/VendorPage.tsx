import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Plus } from "lucide-react";
import { Button } from "@/components/ui";
import { VendorSummaryView } from "@/components/vendors/VendorSummary";
import { VendorFilters } from "@/components/vendors/VendorFilters";
import { VendorEmptyState, VendorList } from "@/components/vendors/VendorList";
import { VendorFormModal } from "@/components/vendors/VendorFormModal";
import { VendorDetailModal } from "@/components/vendors/VendorDetailModal";
import { VendorRemoveDialog } from "@/components/vendors/VendorRemoveDialog";
import {
  DEFAULT_VENDOR_FILTERS,
  VENDOR_STATUS_LABEL,
  filterAndSortVendors,
  hasActiveVendorFilters,
  isArchived,
  summarizeVendors,
  vendorCategories,
  vendorErrorMessage,
  type VendorFilters as Filters,
} from "@/lib/vendors";
import { useStore } from "@/lib/store";
import type { Vendor, VendorStatus } from "@/lib/types";

type Notice = null | { type: "success" | "error"; text: string };

export default function VendorPage() {
  const store = useStore();
  const { vendors, addVendor, updateVendor, setVendorStatus, archiveVendor, restoreVendor, deleteVendor, addVendorPayment, deleteVendorPayment } = store;
  const [filters, setFilters] = useState<Filters>(DEFAULT_VENDOR_FILTERS);
  const [form, setForm] = useState<null | { vendor: Vendor | null }>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [removing, setRemoving] = useState<Vendor | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  // Pesan sukses hilang sendiri; pesan galat tetap sampai diganti oleh aksi berikutnya.
  useEffect(() => {
    if (notice?.type !== "success") return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const summary = useMemo(() => summarizeVendors(vendors), [vendors]);
  const visible = useMemo(() => filterAndSortVendors(vendors, filters), [vendors, filters]);
  const categories = useMemo(() => vendorCategories(vendors), [vendors]);
  const clearFilters = () => setFilters({ ...DEFAULT_VENDOR_FILTERS, sort: filters.sort });
  const detailVendor = detailId ? vendors.find((v) => v.id === detailId) ?? null : null;
  const activeCount = vendors.filter((v) => !isArchived(v)).length;

  function handleStatus(vendor: Vendor, status: VendorStatus) {
    const result = setVendorStatus(vendor.id, status);
    setNotice(
      result.ok
        ? { type: "success", text: `Status ${vendor.name} diubah menjadi ${VENDOR_STATUS_LABEL[status]}.` }
        : { type: "error", text: result.errors?.status ?? vendorErrorMessage(result.error) }
    );
  }

  function handleRestore(vendor: Vendor) {
    const result = restoreVendor(vendor.id);
    setNotice(result.ok ? { type: "success", text: `Vendor dipulihkan: ${vendor.name}.` } : { type: "error", text: vendorErrorMessage(result.error) });
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-ink">Vendor</h2>
          <p className="mt-1 text-sm text-ink-soft">Kelola vendor, kontrak, dan pembayaran pernikahan.</p>
        </div>
        <Button onClick={() => setForm({ vendor: null })}>
          <Plus size={16} aria-hidden="true" /> Tambah Vendor
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

      <VendorSummaryView summary={summary} />

      <VendorFilters filters={filters} onChange={setFilters} categories={categories} disabled={vendors.length === 0} shown={visible.length} total={vendors.length} />

      {vendors.length === 0 || (activeCount === 0 && !hasActiveVendorFilters(filters)) ? (
        <VendorEmptyState kind="none" onAdd={() => setForm({ vendor: null })} onClearFilters={clearFilters} archivedCount={vendors.length - activeCount} />
      ) : visible.length === 0 ? (
        <VendorEmptyState kind="no-match" onAdd={() => setForm({ vendor: null })} onClearFilters={clearFilters} />
      ) : (
        <VendorList vendors={visible} onDetail={(v) => setDetailId(v.id)} onEdit={(v) => setForm({ vendor: v })} onRemove={setRemoving} onRestore={handleRestore} onStatusChange={handleStatus} />
      )}

      {form ? (
        <VendorFormModal
          key={form.vendor?.id ?? "baru"}
          vendor={form.vendor}
          existing={vendors}
          onClose={() => setForm(null)}
          onSubmit={(raw) => {
            const result = form.vendor ? updateVendor(form.vendor.id, raw) : addVendor(raw);
            if (result.ok) {
              const hidden = hasActiveVendorFilters(filters) && filterAndSortVendors([result.vendor], filters).length === 0;
              setForm(null);
              setNotice({ type: "success", text: `${form.vendor ? "Perubahan disimpan" : "Vendor ditambahkan"}: ${result.vendor.name}.${hidden ? " Vendor ini tidak tampil karena filter aktif." : ""}` });
            }
            return result;
          }}
        />
      ) : null}

      {detailVendor ? (
        <VendorDetailModal
          key={detailVendor.id}
          vendor={detailVendor}
          onClose={() => setDetailId(null)}
          onEdit={(v) => {
            setDetailId(null);
            setForm({ vendor: v });
          }}
          onAddPayment={(raw) => addVendorPayment(detailVendor.id, raw)}
          onDeletePayment={(paymentId) => deleteVendorPayment(detailVendor.id, paymentId)}
        />
      ) : null}

      {removing ? (
        <VendorRemoveDialog
          key={removing.id}
          vendor={removing}
          onCancel={() => setRemoving(null)}
          onArchive={() => {
            const result = archiveVendor(removing.id);
            if (result.ok) {
              setRemoving(null);
              setNotice({ type: "success", text: `Vendor diarsipkan: ${removing.name}. Lihat lewat filter "Diarsipkan".` });
            }
            return result;
          }}
          onDelete={() => {
            const result = deleteVendor(removing.id);
            if (result.ok) {
              setRemoving(null);
              setNotice({ type: "success", text: `Vendor dihapus permanen: ${removing.name}.` });
            }
            return result;
          }}
        />
      ) : null}
    </div>
  );
}
