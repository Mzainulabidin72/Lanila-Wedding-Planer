import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Button, Modal } from "@/components/ui";
import { itemErrorMessage, quantityOf } from "@/lib/seserahan";
import type { ItemResult } from "@/lib/store";
import type { SeserahanItem } from "@/lib/types";

/** Konfirmasi hapus: menyebut item yang dihapus; fokus awal di "Batal" agar tidak terhapus tak sengaja. */
export function SeserahanDeleteDialog({ item, onCancel, onConfirm }: { item: SeserahanItem; onCancel: () => void; onConfirm: () => ItemResult }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function confirm() {
    if (busy) return;
    setBusy(true);
    const result = onConfirm();
    setBusy(false);
    if (!result.ok) setError(itemErrorMessage(result.error)); // jika ok, induk menutup dialog
  }

  return (
    <Modal open onClose={onCancel} title="Hapus item?">
      <p className="text-sm text-ink-soft">
        Item <strong className="text-ink">“{item.name}”</strong> ({item.category}, {quantityOf(item)} buah) akan dihapus dari daftar seserahan. Tindakan ini tidak dapat dibatalkan.
      </p>
      {error ? (
        <div role="alert" className="mt-3 flex items-start gap-2 rounded-md bg-danger-bg px-3 py-2.5 text-sm text-[#962F27]">
          <AlertCircle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}
      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} data-autofocus>Batal</Button>
        <Button type="button" variant="danger" onClick={confirm} loading={busy}>Hapus</Button>
      </div>
    </Modal>
  );
}
