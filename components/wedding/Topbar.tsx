"use client";

import { WeddingMember } from "@/lib/types";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Topbar({ title, members }: { title: string; members: WeddingMember[] }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-surface-border bg-surface/95 px-5 py-4 backdrop-blur">
      <h1 className="text-lg font-semibold text-ink">{title}</h1>
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
    </header>
  );
}
