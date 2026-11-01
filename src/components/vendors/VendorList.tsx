import { ArchiveRestore, CalendarCheck, CheckCircle2, Eye, FileText, MessageCircle, Pencil, Phone, Search, SearchX, Store, Trash2, Wallet, XCircle, type LucideIcon } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { formatRupiah } from "@/lib/derive";
import {
  CONTRACT_STATUS_LABEL,
  PAYMENT_STATE_LABEL,
  VENDOR_STATUSES,
  VENDOR_STATUS_LABEL,
  dateLabel,
  isArchived,
  isConfirmed,
  paidOf,
  paymentStateOf,
  remainingOf,
} from "@/lib/vendors";
import type { Vendor, VendorStatus } from "@/lib/types";

const STATUS_STYLE: Record<VendorStatus, { icon: LucideIcon; box: string; iconColor: string }> = {
  research: { icon: Search, box: "border-surface-border bg-surface-muted", iconColor: "text-ink-soft" },
  contacted: { icon: Phone, box: "border-surface-border bg-surface-muted", iconColor: "text-ink-soft" },
  negotiation: { icon: MessageCircle, box: "border-warning/40 bg-warning-bg", iconColor: "text-[#8A6428]" },
  booked: { icon: CalendarCheck, box: "border-blush-200 bg-blush-50", iconColor: "text-blush-600" },
  dp_paid: { icon: Wallet, box: "border-warning/40 bg-warning-bg", iconColor: "text-[#8A6428]" },
  fully_paid: { icon: CheckCircle2, box: "border-success/40 bg-success-bg", iconColor: "text-success" },
  cancelled: { icon: XCircle, box: "border-danger/40 bg-danger-bg", iconColor: "text-danger" },
};

/** Pilihan status pemesanan: ikon + teks (bukan hanya warna) menunjukkan status. */
function StatusSelect({ vendor, onChange }: { vendor: Vendor; onChange: (v: Vendor, s: VendorStatus) => void }) {
  const { icon: Icon, box, iconColor } = STATUS_STYLE[vendor.status];
  return (
    <div className="relative inline-block">
      <Icon size={15} aria-hidden="true" className={`pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 ${iconColor}`} />
      <select
        aria-label={`Status pemesanan ${vendor.name}`}
        value={vendor.status}
        onChange={(e) => onChange(vendor, e.target.value as VendorStatus)}
        className={`h-9 rounded-md border py-1 pl-8 pr-2 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand ${box}`}
      >
        {VENDOR_STATUSES.map((s) => (
          <option key={s} value={s}>
            {VENDOR_STATUS_LABEL[s]}
          </option>
        ))}
      </select>
    </div>
  );
}

function ValueCell({ vendor }: { vendor: Vendor }) {
  return (
    <div className="tabular-nums">
      <p className="text-ink">{formatRupiah(vendor.price)}</p>
      <p className="text-xs text-ink-soft">{isConfirmed(vendor) ? "Nilai kontrak" : "Penawaran"}</p>
    </div>
  );
}

/** Ringkasan pembayaran dari CATATAN pembayaran (bukan dari label status). */
function PaymentCell({ vendor }: { vendor: Vendor }) {
  const state = paymentStateOf(vendor);
  if (state === "quote") return <p className="text-xs text-ink-soft">{PAYMENT_STATE_LABEL.quote}</p>;
  const noRecordButClaimed = paidOf(vendor) === 0 && (vendor.status === "dp_paid" || vendor.status === "fully_paid");
  return (
    <div className="text-xs tabular-nums">
      <p className="font-medium text-ink">{PAYMENT_STATE_LABEL[state]}</p>
      <p className="text-ink-soft">
        Terbayar {formatRupiah(paidOf(vendor))} · Sisa {formatRupiah(remainingOf(vendor))}
      </p>
      {vendor.paymentDeadline && remainingOf(vendor) > 0 ? <p className="text-ink-soft">Jatuh tempo {dateLabel(vendor.paymentDeadline)}</p> : null}
      {noRecordButClaimed ? <p className="text-[#8A6428]">Status menyebut sudah dibayar, tapi belum ada catatan pembayaran.</p> : null}
    </div>
  );
}

function NameCell({ vendor }: { vendor: Vendor }) {
  return (
    <div className="min-w-0">
      <p className="truncate font-medium text-ink">{vendor.name}</p>
      <p className="text-xs text-ink-soft">{vendor.category}</p>
      {vendor.contactPerson || vendor.phone ? (
        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-ink-soft">
          <Phone size={12} aria-hidden="true" /> {[vendor.contactPerson, vendor.phone].filter(Boolean).join(" · ")}
        </p>
      ) : null}
    </div>
  );
}

function ContractLabel({ vendor }: { vendor: Vendor }) {
  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-ink-soft">
      <FileText size={12} aria-hidden="true" /> {CONTRACT_STATUS_LABEL[vendor.contractStatus ?? "belum"]}
    </p>
  );
}

interface Handlers {
  onDetail: (v: Vendor) => void;
  onEdit: (v: Vendor) => void;
  onRemove: (v: Vendor) => void;
  onRestore: (v: Vendor) => void;
  onStatusChange: (v: Vendor, s: VendorStatus) => void;
}

function RowActions({ vendor, onDetail, onEdit, onRemove, onRestore }: Omit<Handlers, "onStatusChange"> & { vendor: Vendor }) {
  const btn = "flex h-9 w-9 items-center justify-center rounded-md text-ink-soft hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand";
  return (
    <div className="flex items-center gap-1">
      <button type="button" className={btn} onClick={() => onDetail(vendor)} aria-label={`Detail ${vendor.name}`}>
        <Eye size={16} aria-hidden="true" />
      </button>
      {isArchived(vendor) ? (
        <button type="button" className={btn} onClick={() => onRestore(vendor)} aria-label={`Pulihkan ${vendor.name}`}>
          <ArchiveRestore size={16} aria-hidden="true" />
        </button>
      ) : (
        <button type="button" className={btn} onClick={() => onEdit(vendor)} aria-label={`Ubah ${vendor.name}`}>
          <Pencil size={16} aria-hidden="true" />
        </button>
      )}
      <button type="button" className={`${btn} hover:text-danger`} onClick={() => onRemove(vendor)} aria-label={`Arsipkan atau hapus ${vendor.name}`}>
        <Trash2 size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

export function VendorList({ vendors, ...h }: { vendors: Vendor[] } & Handlers) {
  return (
    <Card>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <caption className="sr-only">Daftar vendor</caption>
          <thead>
            <tr className="border-b border-surface-border text-left text-xs text-ink-soft">
              <th scope="col" className="px-4 py-3 font-medium">Vendor</th>
              <th scope="col" className="px-3 py-3 font-medium">Nilai</th>
              <th scope="col" className="px-3 py-3 font-medium">Status pemesanan</th>
              <th scope="col" className="px-3 py-3 font-medium">Pembayaran</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((v) => (
              <tr key={v.id} className="border-b border-surface-border align-top last:border-0">
                <td className="max-w-[240px] px-4 py-3"><NameCell vendor={v} /></td>
                <td className="px-3 py-3"><ValueCell vendor={v} /></td>
                <td className="px-3 py-3">
                  {isArchived(v) ? <p className="text-sm text-ink-soft">Diarsipkan</p> : <StatusSelect vendor={v} onChange={h.onStatusChange} />}
                  <ContractLabel vendor={v} />
                </td>
                <td className="px-3 py-3"><PaymentCell vendor={v} /></td>
                <td className="px-4 py-3"><div className="flex justify-end"><RowActions vendor={v} {...h} /></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-surface-border md:hidden">
        {vendors.map((v) => (
          <li key={v.id} className="space-y-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <NameCell vendor={v} />
              <RowActions vendor={v} {...h} />
            </div>
            <ValueCell vendor={v} />
            {isArchived(v) ? <p className="text-sm text-ink-soft">Diarsipkan</p> : <StatusSelect vendor={v} onChange={h.onStatusChange} />}
            <ContractLabel vendor={v} />
            <PaymentCell vendor={v} />
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** Keadaan kosong yang ringkas, di dalam area daftar. */
export function VendorEmptyState({ kind, onAdd, onClearFilters, archivedCount = 0 }: { kind: "none" | "no-match"; onAdd: () => void; onClearFilters: () => void; archivedCount?: number }) {
  const none = kind === "none";
  const Icon = none ? Store : SearchX;
  return (
    <Card>
      <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blush-50 text-blush-600">
          <Icon size={22} aria-hidden="true" />
        </span>
        <div>
          <p className="font-medium text-ink">{none ? "Belum ada vendor" : "Tidak ada vendor yang cocok"}</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">
            {none ? "Tambahkan vendor yang sedang kamu pertimbangkan atau sudah dipilih untuk melacak kontrak dan pembayaran." : "Coba ubah kata kunci pencarian atau filter yang sedang dipakai."}
          </p>
          {none && archivedCount > 0 ? <p className="mx-auto mt-1 max-w-sm text-xs text-ink-soft">{archivedCount} vendor diarsipkan dan bisa dilihat lewat filter "Diarsipkan".</p> : null}
        </div>
        {none ? (
          <Button size="sm" onClick={onAdd}>Tambah Vendor Pertama</Button>
        ) : (
          <Button size="sm" variant="secondary" onClick={onClearFilters}>Hapus filter</Button>
        )}
      </div>
    </Card>
  );
}
