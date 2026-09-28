"use client";

import { Card, CardBody, EmptyState } from "@/components/ui";

const GROUPS = [
  { name: "Administrasi", examples: "KTP, KK, N1, N4, surat sehat" },
  { name: "Vendor", examples: "Invoice, kontrak, kwitansi" },
  { name: "Pernikahan", examples: "Dokumen acara, berkas lain" },
];

export default function DokumenPage() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        {GROUPS.map((g) => (
          <Card key={g.name}>
            <CardBody>
              <p className="font-medium text-ink">{g.name}</p>
              <p className="mt-1 text-xs text-ink-faint">{g.examples}</p>
            </CardBody>
          </Card>
        ))}
      </div>
      <EmptyState
        icon="📄"
        title="Belum ada dokumen diunggah."
        description="Unggah PDF, JPG, atau PNG — file hanya dapat diakses oleh anggota wedding workspace ini."
        actionLabel="+ Unggah Dokumen"
        onAction={() => {}}
      />
    </div>
  );
}
