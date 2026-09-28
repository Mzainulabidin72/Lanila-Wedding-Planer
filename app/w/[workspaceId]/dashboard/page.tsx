"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { Card, CardBody } from "@/components/ui";
import { ProgressBar } from "@/components/ui";
import { CountdownWidget } from "@/components/wedding/CountdownWidget";
import { WeddingHealthPanel } from "@/components/wedding/WeddingHealthPanel";
import { ActivityFeed } from "@/components/wedding/ActivityFeed";
import { TaskStatusBadge } from "@/components/ui/StatusBadge";
import {
  budgetTotals,
  formatDate,
  formatRupiah,
  overallPreparationProgress,
  stageProgress,
  upcomingTasks,
} from "@/lib/derive";

export default function DashboardPage() {
  const { workspace, stages, tasks, budgetItems, vendors, activityLog, members } = useStore();
  const overall = overallPreparationProgress(stages);
  const budget = budgetTotals(budgetItems);
  const nextTasks = upcomingTasks(tasks, 5);

  const owner = members.find((m) => m.role === "owner");
  const partner = members.find((m) => m.role === "partner");
  const greetingNames = [owner?.fullName, partner?.fullName].filter(Boolean).join(" & ");

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-ink">Halo, {greetingNames || workspace.name} 👋</h2>
            <p className="mt-1 text-sm text-ink-soft">Semoga persiapan pernikahan kalian berjalan lancar.</p>
          </div>
          <CountdownWidget weddingDate={workspace.weddingDate} />
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Overall progress + category summary */}
        <Card className="lg:col-span-2">
          <CardBody className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-ink">Progres Persiapan Keseluruhan</h3>
              <span className="text-2xl font-semibold text-blush-600">{overall.percent}%</span>
            </div>
            <ProgressBar percent={overall.percent} />
            <p className="text-sm text-ink-soft">
              {overall.done} dari {overall.total} item persiapan selesai.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2 sm:grid-cols-3">
              {stages.map((stage) => (
                <div key={stage.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-ink">{stage.name}</span>
                    <span className="text-ink-faint">{stageProgress(stage)}%</span>
                  </div>
                  <ProgressBar percent={stageProgress(stage)} size="sm" tone="brand" />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <WeddingHealthPanel stages={stages} budgetItems={budgetItems} vendors={vendors} tasks={tasks} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Budget summary */}
        <Card>
          <CardBody className="space-y-4">
            <h3 className="text-base font-semibold text-ink">Ringkasan Budget</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-soft">Total Budget</span>
                <span className="font-medium text-ink">{formatRupiah(budget.actual)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-soft">Sudah Dibayar</span>
                <span className="font-medium text-ink">{formatRupiah(budget.paid)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-soft">Sisa</span>
                <span className="font-medium text-ink">{formatRupiah(budget.remaining)}</span>
              </div>
            </div>
            <ProgressBar percent={budget.utilization} tone="success" />
            <p className="text-xs text-ink-faint">{budget.utilization}% dari total biaya sudah dibayarkan.</p>
            <Link href="../budget" className="inline-block text-sm font-medium text-blush-600 hover:underline">
              Lihat detail budget →
            </Link>
          </CardBody>
        </Card>

        {/* Upcoming tasks */}
        <Card>
          <CardBody className="space-y-3">
            <h3 className="text-base font-semibold text-ink">Tugas Mendatang</h3>
            {nextTasks.length === 0 ? (
              <p className="text-sm text-ink-faint">Tidak ada tugas mendatang. Semua terkendali!</p>
            ) : (
              <ul className="space-y-3">
                {nextTasks.map((t) => (
                  <li key={t.id} className="flex items-start justify-between gap-2 text-sm">
                    <div>
                      <p className="text-ink">{t.title}</p>
                      <p className="text-xs text-ink-faint">{formatDate(t.deadline)}</p>
                    </div>
                    <TaskStatusBadge status={t.status} />
                  </li>
                ))}
              </ul>
            )}
            <Link href="../timeline" className="inline-block text-sm font-medium text-blush-600 hover:underline">
              Lihat semua timeline →
            </Link>
          </CardBody>
        </Card>

        <ActivityFeed entries={activityLog} />
      </div>
    </div>
  );
}
