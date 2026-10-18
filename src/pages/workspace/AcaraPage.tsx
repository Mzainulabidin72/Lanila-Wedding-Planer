import { useStore, useWorkspace } from "@/lib/store";
import { Card, CardBody } from "@/components/ui";
import { formatDate } from "@/lib/derive";
import type { Vendor } from "@/lib/types";

const UNSET = "Belum ditentukan";

/** Nama vendor milik akun ini untuk satu kategori (yang belum dibatalkan), atau "Belum ditentukan". */
function vendorFor(vendors: Vendor[], category: string): string {
  return vendors.find((v) => v.category === category && v.status !== "cancelled")?.name ?? UNSET;
}

export default function AcaraPage() {
  const workspace = useWorkspace();
  const { vendors } = useStore();
  const date = workspace.weddingDate ? formatDate(workspace.weddingDate) : UNSET;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardBody className="space-y-3">
          <h3 className="font-medium text-ink">Akad</h3>
          <dl className="space-y-2 text-sm">
            <Row label="Tanggal" value={date} />
            <Row label="Waktu" value={UNSET} />
            <Row label="Lokasi" value={workspace.venue ?? UNSET} />
            <Row label="Penghulu" value={UNSET} />
            <Row label="Wali" value={UNSET} />
            <Row label="Saksi" value={UNSET} />
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <h3 className="font-medium text-ink">Resepsi</h3>
          <dl className="space-y-2 text-sm">
            <Row label="Tanggal" value={date} />
            <Row label="Waktu" value={UNSET} />
            <Row label="Venue" value={workspace.venue ?? vendorFor(vendors, "Venue")} />
            <Row label="Catering" value={vendorFor(vendors, "Catering")} />
            <Row label="Dekorasi" value={vendorFor(vendors, "Dekorasi")} />
            <Row label="MUA" value={vendorFor(vendors, "MUA")} />
            <Row label="MC" value={UNSET} />
            <Row label="Dokumentasi" value={vendorFor(vendors, "Dokumentasi")} />
          </dl>
        </CardBody>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-surface-border pb-2 last:border-0">
      <dt className="text-ink-faint">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}
