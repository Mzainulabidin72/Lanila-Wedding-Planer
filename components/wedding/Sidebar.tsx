"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard,
  MapPinned,
  Route,
  ListChecks,
  Wallet,
  Gift,
  Store,
  Users,
  Package,
  Heart,
  FileText,
  Settings,
  UserCircle,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

function groups(workspaceId: string): NavGroup[] {
  const w = `/w/${workspaceId}`;
  return [
    { label: "Overview", items: [{ href: `${w}/dashboard`, label: "Dashboard", icon: LayoutDashboard }] },
    {
      label: "Persiapan",
      items: [
        { href: `${w}/peta-persiapan`, label: "Peta Persiapan", icon: MapPinned },
        { href: `${w}/alur-pernikahan`, label: "Alur Pernikahan", icon: Route },
        { href: `${w}/timeline`, label: "Timeline", icon: ListChecks },
      ],
    },
    {
      label: "Keuangan",
      items: [
        { href: `${w}/budget`, label: "Budget", icon: Wallet },
        { href: `${w}/hadiah`, label: "Hadiah Diterima", icon: Gift },
      ],
    },
    {
      label: "Pernikahan",
      items: [
        { href: `${w}/vendor`, label: "Vendor", icon: Store },
        { href: `${w}/tamu`, label: "Daftar Tamu", icon: Users },
        { href: `${w}/seserahan`, label: "Seserahan", icon: Package },
        { href: `${w}/acara`, label: "Akad & Resepsi", icon: Heart },
      ],
    },
    { label: "Dokumen", items: [{ href: `${w}/dokumen`, label: "Dokumen", icon: FileText }] },
    {
      label: "Pengaturan",
      items: [
        { href: `${w}/settings`, label: "Wedding Settings", icon: Settings },
        { href: `${w}/settings/account`, label: "Akun", icon: UserCircle },
      ],
    },
  ];
}

export function Sidebar({ workspaceId, workspaceName }: { workspaceId: string; workspaceName: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-surface-border bg-surface-card px-4 py-5 md:flex">
      <div className="mb-6 px-2">
        <div className="flex items-center gap-2 text-brand-dark">
          <Heart size={18} className="fill-brand text-brand" />
          <span className="text-lg font-semibold">Lanila</span>
        </div>
        <p className="mt-0.5 text-xs text-ink-faint">Wedding Planner</p>
        <p className="mt-3 truncate text-sm font-medium text-ink" title={workspaceName}>
          {workspaceName}
        </p>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto">
        {groups(workspaceId).map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-2 text-xs font-medium text-ink-faint">{group.label}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={clsx(
                        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                        active
                          ? "bg-blush-50 font-medium text-blush-600"
                          : "text-ink-soft hover:bg-surface-muted hover:text-ink"
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon size={17} className={active ? "text-blush-500" : "text-ink-faint"} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
