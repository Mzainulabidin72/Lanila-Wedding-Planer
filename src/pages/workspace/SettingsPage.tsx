import { useStore, useWorkspace } from "@/lib/store";
import { getDisplayName, useAuth } from "@/lib/auth-context";
import { Card, CardBody, Button } from "@/components/ui";
import { formatDate, formatRupiah } from "@/lib/derive";

export default function WeddingSettingsPage() {
  const workspace = useWorkspace();
  const { profile, user } = useAuth();
  useStore(); // memastikan halaman ini berada di dalam StoreProvider

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="space-y-3">
          <h3 className="font-medium text-ink">Informasi Pernikahan</h3>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <Info label="Nama Proyek" value={workspace.name} />
            <Info label="Tanggal Pernikahan" value={workspace.weddingDate ? formatDate(workspace.weddingDate) : "Belum diatur"} />
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
          <h3 className="font-medium text-ink">Akun Pemilik</h3>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <Info label="Nama" value={getDisplayName(profile, user)} />
            <Info label="Email" value={user?.email ?? "-"} />
          </div>
          <p className="text-xs text-ink-faint">Data pernikahan ini hanya dapat diakses oleh akun ini.</p>
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
