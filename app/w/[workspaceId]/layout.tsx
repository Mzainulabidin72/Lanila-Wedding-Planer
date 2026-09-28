"use client";

import { Sidebar } from "@/components/wedding/Sidebar";
import { MobileNav } from "@/components/wedding/MobileNav";
import { Topbar } from "@/components/wedding/Topbar";
import { useStore } from "@/lib/store";
import { usePathname } from "next/navigation";

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

export default function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { workspaceId: string };
}) {
  const { workspace, members } = useStore();
  const pathname = usePathname();
  const segment = pathname.split("/").filter(Boolean).pop() ?? "dashboard";
  const title = TITLES[segment] ?? "Wedding Planner";

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar workspaceId={params.workspaceId} workspaceName={workspace.name} />
      <div className="flex min-h-screen flex-1 flex-col pb-16 md:pb-0">
        <Topbar title={title} members={members} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
      <MobileNav workspaceId={params.workspaceId} />
    </div>
  );
}
