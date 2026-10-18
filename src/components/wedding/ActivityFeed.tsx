import { Card, CardBody } from "@/components/ui";
import { ActivityLogEntry } from "@/lib/types";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "baru saja";
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

export function ActivityFeed({ entries }: { entries: ActivityLogEntry[] }) {
  return (
    <Card>
      <CardBody className="space-y-3">
        <h3 className="text-base font-semibold text-ink">Aktivitas Terbaru</h3>
        {entries.length === 0 ? (
          <p className="text-sm text-ink-faint">Belum ada aktivitas.</p>
        ) : (
          <ul className="space-y-3">
            {entries.map((e) => (
              <li key={e.id} className="text-sm">
                <p className="text-ink">
                  <span className="font-medium">{e.actorName}</span> {e.action}{" "}
                  <span className="font-medium">{e.objectLabel}</span>
                </p>
                <p className="text-xs text-ink-faint">{timeAgo(e.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
