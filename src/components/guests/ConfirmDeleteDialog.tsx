import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Button, Modal } from "@/components/ui";
import { guestErrorMessage } from "@/lib/guests";
import type { GuestResult } from "@/lib/store";
import type { Guest } from "@/lib/types";

/** Konfirmasi hapus: menyebut tamu yang dihapus; fokus awal di "Batal" agar tidak terhapus tak sengaja. */
export function ConfirmDeleteDialog({ guest, onCancel, onConfirm }: { guest: Guest; onCancel: () => void; onConfirm: () => GuestResult }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function confirm() {
    if (busy) return;
    setBusy(true);
    const result = onConfirm();
    setBusy(false);
    if (!result.ok) setError(guestErrorMessage(result.error)); // jika ok, induk menutup dialog
  }

  return (
    <Modal open onClose={onCancel} title="Hapus tamu?">
      <p className="text-sm text-ink-soft">
        Tamu <strong className="text-ink">“{guest.name}”</strong> ({guest.pax} orang, {guest.category}) akan dihapus dari daftar. Tindakan ini tidak dapat dibatalkan.
      </p>
      {error ? (
        <div role="alert" className="mt-3 flex items-start gap-2 rounded-md bg-danger-bg px-3 py-2.5 text-sm text-[#962F27]">
          <AlertCircle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}
      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} data-autofocus>
          Batal
        </Button>
        <Button type="button" variant="danger" onClick={confirm} loading={busy}>
          Hapus
        </Button>
      </div>
    </Modal>
  );
}
