import { FormEvent, ReactNode, useId, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Mail, MapPin, Phone, Trash2, User } from "lucide-react";
import { Button, Modal } from "@/components/ui";
import { formatRupiah } from "@/lib/derive";
import {
  CONTRACT_STATUS_LABEL,
  PAYMENT_STATE_LABEL,
  VENDOR_LIMITS,
  VENDOR_STATUS_LABEL,
  dateLabel,
  isArchived,
  isConfirmed,
  localDateString,
  paidOf,
  paymentsOf,
  paymentStateOf,
  remainingOf,
  validatePaymentInput,
  vendorErrorMessage,
  type PaymentErrors,
  type RawPaymentInput,
} from "@/lib/vendors";
import type { VendorResult } from "@/lib/store";
import type { Vendor } from "@/lib/types";

const CONTROL =
  "w-full rounded-md border bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand";

function Section({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="space-y-2 border-t border-surface-border pt-4">
      <h3 id={id} className="text-sm font-semibold text-ink">{title}</h3>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="text-right tabular-nums text-ink">{value}</dd>
    </div>
  );
}

interface Props {
  vendor: Vendor;
  onClose: () => void;
  onEdit: (v: Vendor) => void;
  onAddPayment: (raw: RawPaymentInput) => VendorResult;
  onDeletePayment: (paymentId: string) => VendorResult;
}

/** Detail vendor: ringkasan, kontak, paket, pemesanan/kontrak, pembayaran (catatan nyata), dan catatan. */
export function VendorDetailModal({ vendor, onClose, onEdit, onAddPayment, onDeletePayment }: Props) {
  const uid = useId();
  const today = localDateString(new Date());
  const [pay, setPay] = useState<RawPaymentInput>({ amount: "", paidAt: today, note: "" });
  const [errors, setErrors] = useState<PaymentErrors>({});
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false); // satu pembayaran hanya dikirim sekali

  const confirmed = isConfirmed(vendor);
  const archived = isArchived(vendor);
  const payments = [...paymentsOf(vendor)].sort((a, b) => b.paidAt.localeCompare(a.paidAt));
  const canRecord = confirmed && !archived && vendor.price > 0;
  const state = paymentStateOf(vendor);
  const id = (f: string) => `${uid}-${f}`;
  const border = (f: keyof PaymentErrors) => (errors[f] ? "border-danger" : "border-surface-border");

  function submitPayment(e: FormEvent) {
    e.preventDefault();
    if (submitting.current) return;
    setNotice(null);
    const check = validatePaymentInput(pay, vendor, today);
    setErrors(check.errors);
    if (!check.value) {
      const first = (["amount", "paidAt", "note"] as const).find((f) => check.errors[f]);
      if (first) requestAnimationFrame(() => document.getElementById(id(first))?.focus());
      return;
    }
    submitting.current = true;
    setSaving(true);
    try {
      const result = onAddPayment(pay);
      if (result.ok) {
        setNotice({ type: "success", text: `Pembayaran ${formatRupiah(check.value.amount)} tanggal ${dateLabel(check.value.paidAt)} dicatat.` });
        setPay({ amount: "", paidAt: today, note: "" });
        setErrors({});
      } else {
        setErrors((result.errors ?? {}) as PaymentErrors);
        setNotice({ type: "error", text: vendorErrorMessage(result.error) });
      }
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  function removePayment(paymentId: string) {
    const result = onDeletePayment(paymentId);
    setConfirmId(null);
    setNotice(result.ok ? { type: "success", text: "Catatan pembayaran dihapus." } : { type: "error", text: vendorErrorMessage(result.error) });
  }

  return (
    <Modal open onClose={onClose} title="Detail Vendor" size="lg">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-ink">{vendor.name}</h3>
          <p className="text-sm text-ink-soft">
            {vendor.category} · {archived ? "Diarsipkan" : VENDOR_STATUS_LABEL[vendor.status]} · {CONTRACT_STATUS_LABEL[vendor.contractStatus ?? "belum"]}
          </p>
        </div>

        <Section title="Kontak">
          {vendor.contactPerson || vendor.phone || vendor.email || vendor.address ? (
            <ul className="space-y-1.5 text-sm text-ink">
              {vendor.contactPerson ? <li className="flex items-center gap-2"><User size={14} aria-hidden="true" className="text-ink-soft" /> {vendor.contactPerson}</li> : null}
              {vendor.phone ? <li className="flex items-center gap-2"><Phone size={14} aria-hidden="true" className="text-ink-soft" /> {vendor.phone}</li> : null}
              {vendor.email ? <li className="flex items-center gap-2"><Mail size={14} aria-hidden="true" className="text-ink-soft" /> {vendor.email}</li> : null}
              {vendor.address ? <li className="flex items-center gap-2"><MapPin size={14} aria-hidden="true" className="text-ink-soft" /> {vendor.address}</li> : null}
            </ul>
          ) : (
            <p className="text-sm text-ink-soft">Belum ada data kontak.</p>
          )}
        </Section>

        <Section title="Paket dan layanan">
          <p className="text-sm text-ink">{vendor.packageDescription ?? <span className="text-ink-soft">Belum ada deskripsi paket.</span>}</p>
        </Section>

        <Section title="Pemesanan dan kontrak">
          <dl className="space-y-1.5">
            <Row label="Status pemesanan" value={VENDOR_STATUS_LABEL[vendor.status]} />
            <Row label="Status kontrak" value={CONTRACT_STATUS_LABEL[vendor.contractStatus ?? "belum"]} />
            <Row label={confirmed ? "Nilai kontrak" : "Nilai penawaran (belum menjadi kontrak)"} value={formatRupiah(vendor.price)} />
            <Row label="DP yang direncanakan" value={formatRupiah(vendor.dpAmount)} />
            <Row label="Jatuh tempo pembayaran" value={dateLabel(vendor.paymentDeadline)} />
          </dl>
        </Section>

        <Section title="Pembayaran">
          <dl className="space-y-1.5">
            <Row label="Status pembayaran" value={PAYMENT_STATE_LABEL[state]} />
            <Row label="Terbayar (tercatat)" value={formatRupiah(paidOf(vendor))} />
            <Row label="Sisa pembayaran" value={confirmed ? formatRupiah(remainingOf(vendor)) : "-"} />
          </dl>

          {payments.length > 0 ? (
            <ul className="divide-y divide-surface-border rounded-md border border-surface-border">
              {payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="tabular-nums text-ink">{formatRupiah(p.amount)}</p>
                    <p className="truncate text-xs text-ink-soft">{dateLabel(p.paidAt)}{p.note ? ` · ${p.note}` : ""}</p>
                  </div>
                  {confirmId === p.id ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-ink-soft">Hapus catatan ini?</span>
                      <Button type="button" size="sm" variant="danger" onClick={() => removePayment(p.id)}>Ya, hapus</Button>
                      <Button type="button" size="sm" variant="secondary" onClick={() => setConfirmId(null)}>Batal</Button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setConfirmId(p.id)} aria-label={`Hapus pembayaran ${formatRupiah(p.amount)} tanggal ${dateLabel(p.paidAt)}`} className="flex h-9 w-9 items-center justify-center rounded-md text-ink-soft hover:bg-surface-muted hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand">
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-soft">Belum ada pembayaran tercatat.</p>
          )}

          <div role={notice?.type === "error" ? "alert" : "status"} aria-live="polite">
            {notice ? (
              <p className={`flex items-start gap-2 rounded-md px-3 py-2 text-sm ${notice.type === "success" ? "bg-success-bg text-[#2F6B47]" : "bg-danger-bg text-[#962F27]"}`}>
                {notice.type === "success" ? <CheckCircle2 size={16} aria-hidden="true" className="mt-0.5 shrink-0" /> : <AlertCircle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />}
                <span>{notice.text}</span>
              </p>
            ) : null}
          </div>

          {canRecord ? (
            <form onSubmit={submitPayment} noValidate className="space-y-3 rounded-md bg-surface-muted p-3">
              <p className="text-sm font-medium text-ink">Catat pembayaran</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label htmlFor={id("amount")} className="mb-1 block text-xs font-medium text-ink">Jumlah (Rp)</label>
                  <input id={id("amount")} type="text" inputMode="numeric" autoComplete="off" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} aria-invalid={errors.amount ? true : undefined} aria-describedby={errors.amount ? `${id("amount")}-msg` : undefined} className={`${CONTROL} ${border("amount")}`} />
                  {errors.amount ? <p id={`${id("amount")}-msg`} className="mt-1 text-xs text-danger">{errors.amount}</p> : null}
                </div>
                <div>
                  <label htmlFor={id("paidAt")} className="mb-1 block text-xs font-medium text-ink">Tanggal dibayar</label>
                  <input id={id("paidAt")} type="date" max={today} value={pay.paidAt} onChange={(e) => setPay({ ...pay, paidAt: e.target.value })} aria-invalid={errors.paidAt ? true : undefined} aria-describedby={errors.paidAt ? `${id("paidAt")}-msg` : undefined} className={`${CONTROL} ${border("paidAt")}`} />
                  {errors.paidAt ? <p id={`${id("paidAt")}-msg`} className="mt-1 text-xs text-danger">{errors.paidAt}</p> : null}
                </div>
                <div>
                  <label htmlFor={id("note")} className="mb-1 block text-xs font-medium text-ink">Catatan <span className="font-normal text-ink-soft">(opsional)</span></label>
                  <input id={id("note")} type="text" autoComplete="off" maxLength={VENDOR_LIMITS.paymentNote + 20} value={pay.note} onChange={(e) => setPay({ ...pay, note: e.target.value })} aria-invalid={errors.note ? true : undefined} className={`${CONTROL} ${border("note")}`} />
                  {errors.note ? <p className="mt-1 text-xs text-danger">{errors.note}</p> : null}
                </div>
              </div>
              {errors.general ? <p role="alert" className="text-sm text-danger">{errors.general}</p> : null}
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-ink-soft">Dicatat sekali dan tidak mengubah Budget. Hanya catat yang sudah benar-benar dibayar.</p>
                <Button type="submit" size="sm" loading={saving}>Catat Pembayaran</Button>
              </div>
            </form>
          ) : (
            <p className="rounded-md bg-surface-muted px-3 py-2 text-sm text-ink-soft">
              {archived
                ? "Vendor ini diarsipkan. Pulihkan dulu untuk mencatat pembayaran."
                : !confirmed
                  ? "Ubah status pemesanan menjadi Dipesan untuk mencatat pembayaran. Penawaran belum dihitung sebagai biaya."
                  : "Isi nilai kontrak vendor lebih dulu untuk mencatat pembayaran."}
            </p>
          )}
        </Section>

        <Section title="Catatan">
          <p className="whitespace-pre-line text-sm text-ink">{vendor.notes ?? <span className="text-ink-soft">Belum ada catatan.</span>}</p>
        </Section>

        <div className="flex justify-end gap-2 border-t border-surface-border pt-4">
          {!archived ? <Button type="button" variant="secondary" onClick={() => onEdit(vendor)}>Ubah Vendor</Button> : null}
          <Button type="button" onClick={onClose}>Tutup</Button>
        </div>
      </div>
    </Modal>
  );
}
