import { FormEvent, ReactNode, useId, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Button, Modal } from "@/components/ui";
import {
  GUEST_LIMITS,
  RSVP_LABEL,
  RSVP_STATUSES,
  guestCategories,
  guestErrorMessage,
  validateGuestInput,
  type GuestErrors,
  type GuestField,
  type RawGuestInput,
} from "@/lib/guests";
import type { GuestResult } from "@/lib/store";
import type { Guest } from "@/lib/types";

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
        <p id={`${id}-msg`} className="mt-1 text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-msg`} className="mt-1 text-xs text-ink-soft">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

interface Props {
  /** null = tambah tamu baru; Guest = ubah tamu itu */
  guest: Guest | null;
  existing: Guest[];
  onClose: () => void;
  /** Mengembalikan hasil penyimpanan; form hanya menutup (lewat induk) jika ok. */
  onSubmit: (raw: RawGuestInput) => GuestResult;
}

/** Dipasang hanya saat dialog dibuka (induk memberi key), sehingga isian selalu mulai dari nilai yang benar. */
export function GuestFormModal({ guest, existing, onClose, onSubmit }: Props) {
  const uid = useId();
  const [values, setValues] = useState<RawGuestInput>({
    name: guest?.name ?? "",
    category: guest?.category ?? "Keluarga",
    pax: guest?.pax ?? 1,
    phone: guest?.phone ?? "",
    rsvp: guest?.rsvp ?? "belum",
    notes: guest?.notes ?? "",
  });
  const [errors, setErrors] = useState<GuestErrors>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false); // cegah kirim ganda (klik cepat / Enter berulang)

  const id = (f: GuestField) => `${uid}-${f}`;
  const set = (patch: Partial<RawGuestInput>) => setValues((v) => ({ ...v, ...patch }));
  const aria = (f: GuestField) => ({
    "aria-invalid": errors[f] ? true : undefined,
    "aria-describedby": errors[f] || f === "pax" || f === "notes" ? `${id(f)}-msg` : undefined,
  });
  const border = (f: GuestField) => (errors[f] ? "border-danger" : "border-surface-border");
  const categories = guestCategories(existing.concat(guest ? [guest] : []));

  function focusFirstError(errs: GuestErrors) {
    const first = (["name", "category", "pax", "phone", "rsvp", "notes"] as GuestField[]).find((f) => errs[f]);
    if (first) requestAnimationFrame(() => document.getElementById(id(first))?.focus());
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting.current) return;
    setFormError("");
    const check = validateGuestInput(values, existing, guest?.id);
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
        setFormError(guestErrorMessage(result.error));
      }
      // jika ok, induk menutup dialog
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={guest ? "Ubah Tamu" : "Tambah Tamu"} size="lg">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field id={id("name")} label="Nama tamu" error={errors.name}>
          <input id={id("name")} type="text" autoComplete="off" maxLength={GUEST_LIMITS.name + 20} value={values.name} onChange={(e) => set({ name: e.target.value })} placeholder="Contoh: Budi Santoso" className={`${CONTROL} ${border("name")}`} {...aria("name")} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id={id("category")} label="Kelompok" error={errors.category}>
            <select id={id("category")} value={values.category} onChange={(e) => set({ category: e.target.value })} className={`${CONTROL} ${border("category")}`} {...aria("category")}>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field id={id("pax")} label="Jumlah orang" error={errors.pax} hint="Berapa orang yang diwakili undangan ini.">
            <input id={id("pax")} type="number" inputMode="numeric" min={1} max={GUEST_LIMITS.paxMax} value={values.pax} onChange={(e) => set({ pax: e.target.value })} className={`${CONTROL} ${border("pax")}`} {...aria("pax")} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id={id("phone")} label="Telepon" optional error={errors.phone}>
            <input id={id("phone")} type="tel" inputMode="tel" autoComplete="off" value={values.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="08xx xxxx xxxx" className={`${CONTROL} ${border("phone")}`} {...aria("phone")} />
          </Field>
          <Field id={id("rsvp")} label="Status konfirmasi" error={errors.rsvp}>
            <select id={id("rsvp")} value={values.rsvp} onChange={(e) => set({ rsvp: e.target.value })} className={`${CONTROL} ${border("rsvp")}`} {...aria("rsvp")}>
              {RSVP_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {RSVP_LABEL[s]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field id={id("notes")} label="Catatan" optional error={errors.notes} hint={`${values.notes.length}/${GUEST_LIMITS.notes} karakter`}>
          <textarea id={id("notes")} rows={2} value={values.notes} onChange={(e) => set({ notes: e.target.value })} className={`${CONTROL} ${border("notes")}`} {...aria("notes")} />
        </Field>

        {formError ? (
          <div role="alert" className="flex items-start gap-2 rounded-md bg-danger-bg px-3 py-2.5 text-sm text-[#962F27]">
            <AlertCircle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
            <span>{formError}</span>
          </div>
        ) : null}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" loading={saving}>
            {guest ? "Simpan perubahan" : "Simpan"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
