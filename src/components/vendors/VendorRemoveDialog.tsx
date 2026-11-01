import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Button, Modal } from "@/components/ui";
import { formatRupiah } from "@/lib/derive";
import { isArchived, paidOf, paymentsOf, vendorErrorMessage } from "@/lib/vendors";
import type { VendorResult } from "@/lib/store";
import type { Vendor } from "@/lib/types";

interface Props {
  vendor: Vendor;
  onCancel: () => void;
  onArchive: () => VendorResult;
  onDelete: () => VendorResult;
}

/**
 * Arsipkan (aman) atau hapus permanen. Jika vendor punya catatan pembayaran, hapus permanen
 * baru bisa dipilih setelah pengguna menyatakan mengerti catatannya ikut hilang.
 */
export function VendorRemoveDialog({ vendor, onCancel, onArchive, onDelete }: Props) {
  const [error, setError] = useState("");
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const payments = paymentsOf(vendor);
  const hasPayments = payments.length > 0;
  const archived = isArchived(vendor);

  function run(action: () => VendorResult) {
    if (busy) return;
    setBusy(true);
    const result = action();
    setBusy(false);
    if (!result.ok) setError(vendorErrorMessage(result.error)); // jika ok, induk menutup dialog
  }

  return (
    <Modal open onClose={onCancel} title={archived ? "Hapus permanen?" : "Arsipkan atau hapus vendor?"}>
      <div className="space-y-3 text-sm text-ink-soft">
        <p>
          Vendor <strong className="text-ink">“{vendor.name}”</strong> ({vendor.category}).
        </p>
        {!archived ? <p><strong className="text-ink">Arsipkan</strong> menyembunyikan vendor dari daftar dan ringkasan, tetapi semua datanya tetap tersimpan dan bisa dipulihkan.</p> : null}
        {hasPayments ? (
          <p className="rounded-md bg-warning-bg px-3 py-2 text-ink">
            Vendor ini punya {payments.length} catatan pembayaran ({formatRupiah(paidOf(vendor))}). Jika dihapus permanen, catatan itu ikut hilang dan tidak bisa dikembalikan.
          </p>
        ) : null}
        {hasPayments ? (
          <label className="flex items-start gap-2 text-ink">
            <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-0.5" />
            <span>Saya mengerti catatan pembayaran akan terhapus jika saya memilih hapus permanen.</span>
          </label>
        ) : null}
      </div>
      {error ? (
        <div role="alert" className="mt-3 flex items-start gap-2 rounded-md bg-danger-bg px-3 py-2.5 text-sm text-[#962F27]">
          <AlertCircle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} data-autofocus>Batal</Button>
        {!archived ? <Button type="button" onClick={() => run(onArchive)} loading={busy}>Arsipkan</Button> : null}
        <Button type="button" variant="danger" disabled={hasPayments && !ack} onClick={() => run(onDelete)} loading={busy}>Hapus permanen</Button>
      </div>
    </Modal>
  );
}
