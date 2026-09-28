"use client";

import { useStore } from "@/lib/store";
import { Card, CardBody, Badge, Button } from "@/components/ui";
import { formatDate, formatRupiah } from "@/lib/derive";

const ROLE_TONE = { owner: "brand", partner: "success", viewer: "neutral" } as const;

export default function WeddingSettingsPage() {
  const { workspace, members } = useStore();

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="space-y-3">
          <h3 className="font-medium text-ink">Informasi Pernikahan</h3>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <Info label="Nama Workspace" value={workspace.name} />
            <Info label="Tanggal Pernikahan" value={formatDate(workspace.weddingDate)} />
            <Info label="Jenis Acara" value={workspace.weddingType} />
            <Info label="Venue" value={workspace.venue ?? "-"} />
            <Info label="Target Budget" value={formatRupiah(workspace.targetBudget)} />
          </div>
          <Button variant="secondary" size="sm">
            Edit Informasi
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <h3 className="font-medium text-ink">Anggota Workspace</h3>
          <ul className="divide-y divide-surface-border">
            {members.map((m) => (
              <li key={m.profileId} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-ink">{m.fullName}</span>
                <Badge tone={ROLE_TONE[m.role]}>{m.role}</Badge>
              </li>
            ))}
          </ul>
          <Button variant="secondary" size="sm">
            + Undang Pasangan
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-ink-faint">{label}</p>
      <p className="text-ink">{value}</p>
    </div>
  );
}
