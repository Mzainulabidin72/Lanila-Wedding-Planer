import { FormEvent, ReactNode, useId, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Button, Modal } from "@/components/ui";
import {
  SESERAHAN_LIMITS,
  SESERAHAN_STATUSES,
  SESERAHAN_STATUS_LABEL,
  itemErrorMessage,
  seserahanCategories,
  validateSeserahanInput,
  type RawSeserahanInput,
  type SeserahanErrors,
  type SeserahanField,
} from "@/lib/seserahan";
import type { ItemResult } from "@/lib/store";
import type { SeserahanItem } from "@/lib/types";

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

interface Props {
  /** null = tambah item baru; SeserahanItem = ubah item itu */
  item: SeserahanItem | null;
  existing: SeserahanItem[];
  onClose: () => void;
  /** Mengembalikan hasil penyimpanan; dialog ditutup oleh induk hanya jika ok. */
  onSubmit: (raw: RawSeserahanInput) => ItemResult;
}

/** Dipasang hanya saat dialog dibuka (induk memberi key), sehingga isian selalu mulai dari nilai yang benar. */
export function SeserahanFormModal({ item, existing, onClose, onSubmit }: Props) {
  const uid = useId();
  const [values, setValues] = useState<RawSeserahanInput>({
    name: item?.name ?? "",
    category: item?.category ?? "Lainnya",
    quantity: item?.quantity ?? 1,
    plannedBudget: item && item.plannedBudget ? String(item.plannedBudget) : "",
    status: item?.status ?? "belum",
    // Nilai biaya sebenarnya & tanggal tetap dibawa walau bidangnya disembunyikan, agar tidak hilang saat status diubah.
    actualCost: item && item.actualCost ? String(item.actualCost) : "",
    purchaseDate: item?.purchaseDate ?? "",
    notes: item?.notes ?? "",
  });
  const [errors, setErrors] = useState<SeserahanErrors>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false); // cegah kirim ganda

  const id = (f: SeserahanField) => `${uid}-${f}`;
  const set = (patch: Partial<RawSeserahanInput>) => setValues((v) => ({ ...v, ...patch }));
  const border = (f: SeserahanField) => (errors[f] ? "border-danger" : "border-surface-border");
  const aria = (f: SeserahanField) => ({ "aria-invalid": errors[f] ? true : undefined, "aria-describedby": errors[f] || ["plannedBudget", "actualCost", "notes"].includes(f) ? `${id(f)}-msg` : undefined });
  const categories = seserahanCategories(item ? existing.concat([item]) : existing);
  // Bidang biaya sebenarnya/tanggal hanya relevan jika sudah disiapkan; tetap tampil bila ada galat agar bisa diperbaiki.
  const showPurchase = values.status === "dibeli" || Boolean(errors.actualCost) || Boolean(errors.purchaseDate);

  function focusFirstError(errs: SeserahanErrors) {
    const first = (["name", "category", "quantity", "plannedBudget", "status", "actualCost", "purchaseDate", "notes"] as SeserahanField[]).find((f) => errs[f]);
    if (first) requestAnimationFrame(() => document.getElementById(id(first))?.focus());
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting.current) return;
    setFormError("");
    const check = validateSeserahanInput(values);
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
          setErrors(result.errors);
          focusFirstError(result.errors);
        }
        setFormError(itemErrorMessage(result.error));
      }
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={item ? "Ubah Item" : "Tambah Item"} size="lg">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field id={id("name")} label="Nama item" error={errors.name}>
          <input id={id("name")} type="text" autoComplete="off" value={values.name} onChange={(e) => set({ name: e.target.value })} placeholder="Contoh: Mukena" className={`${CONTROL} ${border("name")}`} {...aria("name")} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id={id("category")} label="Kategori" error={errors.category}>
            <select id={id("category")} value={values.category} onChange={(e) => set({ category: e.target.value })} className={`${CONTROL} ${border("category")}`} {...aria("category")}>
              {categories.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
          </Field>
          <Field id={id("quantity")} label="Jumlah" error={errors.quantity}>
            <input id={id("quantity")} type="number" inputMode="numeric" min={1} max={SESERAHAN_LIMITS.quantityMax} value={values.quantity} onChange={(e) => set({ quantity: e.target.value })} className={`${CONTROL} ${border("quantity")}`} {...aria("quantity")} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id={id("plannedBudget")} label="Estimasi biaya (Rp)" optional error={errors.plannedBudget} hint="Perkiraan total untuk item ini, bukan harga satuan.">
            <input id={id("plannedBudget")} type="text" inputMode="numeric" autoComplete="off" value={values.plannedBudget} onChange={(e) => set({ plannedBudget: e.target.value })} placeholder="Contoh: 350.000" className={`${CONTROL} ${border("plannedBudget")}`} {...aria("plannedBudget")} />
          </Field>
          <Field id={id("status")} label="Status persiapan" error={errors.status}>
            <select id={id("status")} value={values.status} onChange={(e) => set({ status: e.target.value })} className={`${CONTROL} ${border("status")}`} {...aria("status")}>
              {SESERAHAN_STATUSES.map((s) => (<option key={s} value={s}>{SESERAHAN_STATUS_LABEL[s]}</option>))}
            </select>
          </Field>
        </div>

        {showPurchase ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id={id("actualCost")} label="Biaya sebenarnya (Rp)" optional error={errors.actualCost} hint="Biaya yang benar-benar dikeluarkan.">
              <input id={id("actualCost")} type="text" inputMode="numeric" autoComplete="off" value={values.actualCost} onChange={(e) => set({ actualCost: e.target.value })} className={`${CONTROL} ${border("actualCost")}`} {...aria("actualCost")} />
            </Field>
            <Field id={id("purchaseDate")} label="Tanggal pembelian" optional error={errors.purchaseDate}>
              <input id={id("purchaseDate")} type="date" value={values.purchaseDate} onChange={(e) => set({ purchaseDate: e.target.value })} className={`${CONTROL} ${border("purchaseDate")}`} {...aria("purchaseDate")} />
            </Field>
          </div>
        ) : null}

        <Field id={id("notes")} label="Catatan" optional error={errors.notes} hint={`${values.notes.length}/${SESERAHAN_LIMITS.notes} karakter`}>
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
          <Button type="submit" loading={saving}>{item ? "Simpan perubahan" : "Simpan"}</Button>
        </div>
      </form>
    </Modal>
  );
}
