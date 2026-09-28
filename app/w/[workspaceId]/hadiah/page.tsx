"use client";

import { Card, CardBody, EmptyState, Badge } from "@/components/ui";

// No seed data on purpose: gift records are the most privacy-sensitive
// module in the product (section 16), so the prototype starts empty rather
// than inventing donor names/amounts.

export default function HadiahPage() {
  return (
    <div className="space-y-4">
      <Card>
        <CardBody className="flex items-start gap-2">
          <Badge tone="brand">Privat</Badge>
          <p className="text-sm text-ink-soft">
            Data hadiah hanya terlihat oleh anggota wedding workspace ini (Owner &amp; Partner). Kamu bisa memilih
            sendiri seberapa detail informasi yang dicatat untuk setiap hadiah.
          </p>
        </CardBody>
      </Card>

      <EmptyState
        icon="🎁"
        title="Belum ada hadiah tercatat."
        description="Catat hadiah yang diterima — tunai, transfer, atau barang — sesuai kebutuhanmu."
        actionLabel="+ Catat Hadiah"
        onAction={() => {}}
      />
    </div>
  );
}
