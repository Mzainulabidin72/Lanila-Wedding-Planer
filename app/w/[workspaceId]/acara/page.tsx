"use client";

import { useStore } from "@/lib/store";
import { Card, CardBody } from "@/components/ui";
import { formatDate } from "@/lib/derive";

export default function AcaraPage() {
  const { workspace } = useStore();

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardBody className="space-y-3">
          <h3 className="font-medium text-ink">Akad</h3>
          <dl className="space-y-2 text-sm">
            <Row label="Tanggal" value={formatDate(workspace.weddingDate)} />
            <Row label="Waktu" value="08:00 WIB" />
            <Row label="Lokasi" value={workspace.venue ?? "-"} />
            <Row label="Penghulu" value="Belum ditentukan" />
            <Row label="Wali" value="Belum ditentukan" />
            <Row label="Saksi" value="Belum ditentukan" />
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <h3 className="font-medium text-ink">Resepsi</h3>
          <dl className="space-y-2 text-sm">
            <Row label="Tanggal" value={formatDate(workspace.weddingDate)} />
            <Row label="Waktu" value="11:00 – 15:00 WIB" />
            <Row label="Venue" value={workspace.venue ?? "-"} />
            <Row label="Catering" value="Sari Rasa Catering" />
            <Row label="Dekorasi" value="Bunga Dekor" />
            <Row label="MUA" value="Belum dikonfirmasi" />
            <Row label="MC" value="Belum ditentukan" />
            <Row label="Dokumentasi" value="Studio Kilau" />
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
