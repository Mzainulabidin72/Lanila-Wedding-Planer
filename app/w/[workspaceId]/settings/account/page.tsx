import { Card, CardBody, Badge } from "@/components/ui";

export default function AccountSettingsPage() {
  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-ink">Akun Lanila</h3>
          <Badge tone="brand">Shared account</Badge>
        </div>
        <p className="text-sm text-ink-soft">
          Akun ini dibagikan ke seluruh aplikasi Lanila (Buku Kas, Wedding Planner, Habit, Time Blocking).
          Perubahan nama, email, atau kata sandi di sini akan berlaku di semua aplikasi Lanila.
        </p>
        <p className="text-sm text-ink-faint">
          Halaman ini menjadi titik integrasi dengan sistem autentikasi Lanila yang sudah ada — lihat{" "}
          <code className="rounded bg-surface-muted px-1 py-0.5 text-xs">README.md</code> bagian &ldquo;Auth
          Integration&rdquo; untuk detail teknis.
        </p>
      </CardBody>
    </Card>
  );
}
