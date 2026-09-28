"use client";

import { useStore } from "@/lib/store";
import { Card, CardBody, Badge, EmptyState, Button } from "@/components/ui";
import { formatDate } from "@/lib/derive";
import { WeddingTask } from "@/lib/types";
import { Plus } from "lucide-react";

const COLUMNS: { status: WeddingTask["status"]; label: string }[] = [
  { status: "todo", label: "To do" },
  { status: "in_progress", label: "Dikerjakan" },
  { status: "delayed", label: "Terlambat" },
  { status: "completed", label: "Selesai" },
];

const PRIORITY_TONE: Record<WeddingTask["priority"], "neutral" | "warning" | "danger"> = {
  low: "neutral",
  medium: "neutral",
  high: "warning",
  critical: "danger",
};

export default function TimelinePage() {
  const { tasks, updateTaskStatus } = useStore();

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon="🗓️"
        title="Belum ada tugas."
        description="Tambahkan tugas pertama untuk mulai menyusun timeline persiapan."
        actionLabel="+ Tambah Tugas"
        onAction={() => {}}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm">
          <Plus size={15} /> Tambah Tugas
        </Button>
      </div>

      <div className="scroll-x">
        <div className="grid min-w-[900px] grid-cols-4 gap-4">
          {COLUMNS.map((col) => {
            const items = tasks.filter((t) => t.status === col.status);
            return (
              <div key={col.status}>
                <p className="mb-2 flex items-center justify-between text-sm font-medium text-ink-faint">
                  {col.label} <span>{items.length}</span>
                </p>
                <div className="space-y-3">
                  {items.map((t) => (
                    <Card key={t.id}>
                      <CardBody className="space-y-2 p-4">
                        <p className="text-sm font-medium text-ink">{t.title}</p>
                        <p className="text-xs text-ink-faint">{t.category}</p>
                        <div className="flex items-center justify-between">
                          <Badge tone={PRIORITY_TONE[t.priority]}>{t.priority}</Badge>
                          {t.deadline ? <span className="text-xs text-ink-faint">{formatDate(t.deadline)}</span> : null}
                        </div>
                        {t.assignee ? <p className="text-xs text-ink-faint">PJ: {t.assignee}</p> : null}
                        <select
                          value={t.status}
                          onChange={(e) => updateTaskStatus(t.id, e.target.value as WeddingTask["status"])}
                          className="mt-1 w-full rounded-md border border-surface-border px-2 py-1 text-xs text-ink-soft"
                        >
                          {COLUMNS.map((c) => (
                            <option key={c.status} value={c.status}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </CardBody>
                    </Card>
                  ))}
                  {items.length === 0 ? <p className="text-xs text-ink-faint">Tidak ada tugas.</p> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
