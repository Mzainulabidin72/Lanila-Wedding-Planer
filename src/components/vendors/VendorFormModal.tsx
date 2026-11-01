import { FormEvent, ReactNode, useId, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Button, Modal } from "@/components/ui";
import {
  CONTRACT_STATUSES,
  CONTRACT_STATUS_LABEL,
  VENDOR_LIMITS,
  VENDOR_STATUSES,
  VENDOR_STATUS_LABEL,
  validateVendorInput,
  vendorCategories,
  vendorErrorMessage,
  type RawVendorInput,
  type VendorErrors,
  type VendorField,
} from "@/lib/vendors";
import type { VendorResult } from "@/lib/store";
import type { Vendor } from "@/lib/types";

const CONTROL =
  "w-full rounded-md border bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand";

function Field({ id, label, error, hint, optional, children }: { id: string; label: string; error?: string; hint?: string; optional?: boolean; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-ink">
        {label} {optional ? <span className="font-normal text-ink-soft">(opsional)</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-msg`} className="mt-1 text-sm text-danger">{error}</p>
      ) : hint ? (
        <p id={`${id}-msg`} className="mt-1 text-xs text-ink-soft">{hint}</p>
      ) : null}
    </div>
  );
}

const ORDER: VendorField[] = ["name", "category", "contactPerson", "phone", "email", "address", "packageDescription", "status", "contractStatus", "price", "dpAmount", "paymentDeadline", "notes"];

interface Props {
  /** null = tambah vendor baru; Vendor = ubah vendor itu */
  vendor: Vendor | null;
  existing: Vendor[];
  onClose: () => void;
  /** Mengembalikan hasil penyimpanan; dialog ditutup oleh induk hanya jika ok. */
  onSubmit: (raw: RawVendorInput) => VendorResult;
}

/** Dipasang hanya saat dialog dibuka (induk memberi key), sehingga isian selalu mulai dari nilai yang benar. */
export function VendorFormModal({ vendor, existing, onClose, onSubmit }: Props) {
  const uid = useId();
  const [values, setValues] = useState<RawVendorInput>({
    name: vendor?.name ?? "",
    category: vendor?.category ?? "Venue",
    contactPerson: vendor?.contactPerson ?? "",
    phone: vendor?.phone ?? "",
    email: vendor?.email ?? "",
    address: vendor?.address ?? "",
    packageDescription: vendor?.packageDescription ?? "",
    price: vendor && vendor.price ? String(vendor.price) : "",
    dpAmount: vendor && vendor.dpAmount ? String(vendor.dpAmount) : "",
    paymentDeadline: vendor?.paymentDeadline ?? "",
    status: vendor?.status ?? "research",
    contractStatus: vendor?.contractStatus ?? "belum",
    notes: vendor?.notes ?? "",
  });
  const [errors, setErrors] = useState<VendorErrors>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false); // cegah kirim ganda

  const id = (f: VendorField) => `${uid}-${f}`;
  const set = (patch: Partial<RawVendorInput>) => setValues((v) => ({ ...v, ...patch }));
  const border = (f: VendorField) => (errors[f] ? "border-danger" : "border-surface-border");
  const aria = (f: VendorField) => ({ "aria-invalid": errors[f] ? true : undefined, "aria-describedby": errors[f] || ["price", "dpAmount", "notes"].includes(f) ? `${id(f)}-msg` : undefined });
  const categories = vendorCategories(vendor ? existing.concat([vendor]) : existing);
  const text = (f: VendorField, label: string, props: Partial<React.InputHTMLAttributes<HTMLInputElement>> = {}, optional = true, hint?: string) => (
    <Field id={id(f)} label={label} optional={optional} error={errors[f]} hint={hint}>
      <input id={id(f)} type="text" autoComplete="off" value={values[f]} onChange={(e) => set({ [f]: e.target.value } as Partial<RawVendorInput>)} className={`${CONTROL} ${border(f)}`} {...aria(f)} {...props} />
    </Field>
  );

  function focusFirstError(errs: VendorErrors) {
    const first = ORDER.find((f) => errs[f]);
    if (first) requestAnimationFrame(() => document.getElementById(id(first))?.focus());
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting.current) return;
    setFormError("");
    const check = validateVendorInput(values, existing, vendor?.id);
    setErrors(check.errors);
    if (!check.value) {
      focusFirstError(check.errors);
      return;
    }
    submitting.current = true;
    setSaving(true);
    try {
      const result = onSubmit(values);
      if (!result.ok) {
        if (result.errors) {
          setErrors(result.errors as VendorErrors);
          focusFirstError(result.errors as VendorErrors);
        }
        setFormError(vendorErrorMessage(result.error));
      }
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={vendor ? "Ubah Vendor" : "Tambah Vendor"} size="lg">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">{text("name", "Nama vendor", { placeholder: "Contoh: Studio Cahaya", maxLength: VENDOR_LIMITS.name + 20 }, false)}</div>
          <Field id={id("category")} label="Kategori" error={errors.category}>
            <select id={id("category")} value={values.category} onChange={(e) => set({ category: e.target.value })} className={`${CONTROL} ${border("category")}`} {...aria("category")}>
              {categories.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
          </Field>
          {text("contactPerson", "Nama kontak")}
          {text("phone", "Telepon", { type: "tel", inputMode: "tel", placeholder: "08xx xxxx xxxx" })}
          {text("email", "Email", { type: "email", inputMode: "email", placeholder: "nama@email.com" })}
          <div className="sm:col-span-2">{text("address", "Alamat atau area layanan")}</div>
          <div className="sm:col-span-2">
            <Field id={id("packageDescription")} label="Paket atau layanan" optional error={errors.packageDescription}>
              <textarea id={id("packageDescription")} rows={2} value={values.packageDescription} onChange={(e) => set({ packageDescription: e.target.value })} className={`${CONTROL} ${border("packageDescription")}`} {...aria("packageDescription")} />
            </Field>
          </div>
        </div>

        <fieldset className="space-y-4 rounded-md border border-surface-border p-3">
          <legend className="px-1 text-sm font-medium text-ink">Pemesanan dan kontrak</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id={id("status")} label="Status pemesanan" error={errors.status}>
              <select id={id("status")} value={values.status} onChange={(e) => set({ status: e.target.value })} className={`${CONTROL} ${border("status")}`} {...aria("status")}>
                {VENDOR_STATUSES.map((s) => (<option key={s} value={s}>{VENDOR_STATUS_LABEL[s]}</option>))}
              </select>
            </Field>
            <Field id={id("contractStatus")} label="Status kontrak" error={errors.contractStatus}>
              <select id={id("contractStatus")} value={values.contractStatus} onChange={(e) => set({ contractStatus: e.target.value })} className={`${CONTROL} ${border("contractStatus")}`} {...aria("contractStatus")}>
                {CONTRACT_STATUSES.map((s) => (<option key={s} value={s}>{CONTRACT_STATUS_LABEL[s]}</option>))}
              </select>
            </Field>
            {text("price", "Nilai penawaran atau kontrak (Rp)", { inputMode: "numeric", placeholder: "Contoh: 15.000.000" }, true, "Penawaran selama belum dipesan; menjadi nilai kontrak setelah status Dipesan.")}
            {text("dpAmount", "DP yang direncanakan (Rp)", { inputMode: "numeric" }, true, "Rencana DP, bukan pembayaran. Pembayaran dicatat di Detail vendor.")}
            <Field id={id("paymentDeadline")} label="Jatuh tempo pembayaran" optional error={errors.paymentDeadline}>
              <input id={id("paymentDeadline")} type="date" value={values.paymentDeadline} onChange={(e) => set({ paymentDeadline: e.target.value })} className={`${CONTROL} ${border("paymentDeadline")}`} {...aria("paymentDeadline")} />
            </Field>
          </div>
        </fieldset>

        <Field id={id("notes")} label="Catatan" optional error={errors.notes} hint={`${values.notes.length}/${VENDOR_LIMITS.notes} karakter`}>
          <textarea id={id("notes")} rows={2} value={values.notes} onChange={(e) => set({ notes: e.target.value })} className={`${CONTROL} ${border("notes")}`} {...aria("notes")} />
        </Field>

        {formError ? (
          <div role="alert" className="flex items-start gap-2 rounded-md bg-danger-bg px-3 py-2.5 text-sm text-[#962F27]">
            <AlertCircle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
            <span>{formError}</span>
          </div>
        ) : null}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
          <Button type="submit" loading={saving}>{vendor ? "Simpan perubahan" : "Simpan"}</Button>
        </div>
      </form>
    </Modal>
  );
}
