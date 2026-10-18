import { Sidebar } from "@/components/wedding/Sidebar";
import { MobileNav } from "@/components/wedding/MobileNav";
import { Topbar } from "@/components/wedding/Topbar";
import { Suspense } from "react";
import { Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import { useStore } from "@/lib/store";

const TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  "peta-persiapan": "Peta Persiapan",
  "alur-pernikahan": "Alur Pernikahan",
  timeline: "Timeline",
  budget: "Budget",
  hadiah: "Hadiah Diterima",
  vendor: "Vendor",
  tamu: "Daftar Tamu",
  seserahan: "Seserahan",
  acara: "Akad & Resepsi",
  dokumen: "Dokumen",
  settings: "Wedding Settings",
};

export default function WorkspaceLayout() {
  const { workspaceId = "" } = useParams<{ workspaceId: string }>();
  const { workspace } = useStore();
  const { pathname } = useLocation();

  // Akun ini belum punya proyek pernikahan: buat dulu lewat onboarding.
  if (!workspace) return <Navigate to="/onboarding" replace />;

  // URL menunjuk workspace yang bukan milik akun ini: arahkan ke milik sendiri (bagian halaman dipertahankan).
  // Data akun lain tidak pernah dimuat di sini; di database akses lintas akun juga ditolak oleh RLS.
  if (workspaceId !== workspace.id) {
    const rest = pathname.split("/").filter(Boolean).slice(2).join("/") || "dashboard";
    return <Navigate to={`/w/${workspace.id}/${rest}`} replace />;
  }

  const segment = pathname.split("/").filter(Boolean).pop() ?? "dashboard";
  const title = TITLES[segment] ?? "Wedding Planner";

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar workspaceId={workspaceId} workspaceName={workspace.name} />
      <div className="flex min-h-screen flex-1 flex-col pb-16 md:pb-0">
        <Topbar title={title} />
        <main className="flex-1 p-4 sm:p-6">
          <Suspense fallback={<p className="text-sm text-ink-soft">Memuat…</p>}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <MobileNav workspaceId={workspaceId} />
    </div>
  );
}
