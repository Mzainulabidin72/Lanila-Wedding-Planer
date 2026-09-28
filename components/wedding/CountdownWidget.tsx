"use client";

import { useEffect, useState } from "react";
import { getCountdown, formatDate } from "@/lib/derive";

export function CountdownWidget({ weddingDate }: { weddingDate: string }) {
  const [now, setNow] = useState(() => getCountdown(weddingDate));

  useEffect(() => {
    const id = setInterval(() => setNow(getCountdown(weddingDate)), 1000);
    return () => clearInterval(id);
  }, [weddingDate]);

  const units = [
    { value: now.days, label: "Hari" },
    { value: now.hours, label: "Jam" },
    { value: now.minutes, label: "Menit" },
    { value: now.seconds, label: "Detik" },
  ];

  return (
    <div className="flex items-center gap-4">
      {units.map((u, i) => (
        <div key={u.label} className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-2xl font-semibold tabular-nums text-ink">{String(u.value).padStart(2, "0")}</p>
            <p className="text-[11px] text-ink-faint">{u.label}</p>
          </div>
          {i < units.length - 1 ? <span className="text-lg text-surface-border">:</span> : null}
        </div>
      ))}
      <p className="ml-2 hidden text-sm text-ink-soft sm:block">menuju {formatDate(weddingDate)}</p>
    </div>
  );
}
