"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { LayoutDashboard, MapPinned, Wallet, Store, Menu } from "lucide-react";

export function MobileNav({ workspaceId }: { workspaceId: string }) {
  const pathname = usePathname();
  const w = `/w/${workspaceId}`;
  const items = [
    { href: `${w}/dashboard`, label: "Home", icon: LayoutDashboard },
    { href: `${w}/peta-persiapan`, label: "Persiapan", icon: MapPinned },
    { href: `${w}/budget`, label: "Budget", icon: Wallet },
    { href: `${w}/vendor`, label: "Vendor", icon: Store },
    { href: `${w}/settings`, label: "Lainnya", icon: Menu },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-surface-border bg-surface-card md:hidden">
      {items.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px]",
              active ? "text-blush-600" : "text-ink-faint"
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={19} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
