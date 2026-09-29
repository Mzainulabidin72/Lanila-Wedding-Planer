"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { WeddingMember } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Topbar({ title, members }: { title: string; members: WeddingMember[] }) {
  const { profile, user, signOut } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await signOut();
    router.replace("/login");
  }

  const displayName =
    profile?.full_name || user?.email?.split("@")[0] || "User";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-surface-border bg-surface/95 px-5 py-4 backdrop-blur">
      <h1 className="text-lg font-semibold text-ink">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2">
          {members.map((m) => (
            <div
              key={m.profileId}
              title={`${m.fullName} · ${m.role}`}
              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface-card bg-brand/10 text-xs font-medium text-brand"
            >
              {initials(m.fullName)}
            </div>
          ))}
        </div>
        <span className="hidden text-sm text-ink-muted sm:inline">{displayName}</span>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 rounded-md border border-surface-border px-2.5 py-1.5 text-xs text-ink-muted hover:bg-surface hover:text-ink"
          title="Keluar"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>
    </header>
  );
}
