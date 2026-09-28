"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardBody, Modal, Button } from "@/components/ui";
import { PrepStatusBadge } from "@/components/ui/StatusBadge";
import { ProgressBar } from "@/components/ui";
import { formatDate, stageProgress } from "@/lib/derive";
import { ChevronRight } from "lucide-react";
import type { PreparationStatus } from "@/lib/types";

const STATUS_CYCLE: PreparationStatus[] = ["belum", "diproses", "selesai", "tertunda"];

export default function PetaPersiapanPage() {
  const { stages, updatePreparationStatus } = useStore();
  const [openStageId, setOpenStageId] = useState<string | null>(null);
  const openStage = stages.find((s) => s.id === openStageId) ?? null;

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <h2 className="text-base font-semibold text-ink">Peta Persiapan</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Perjalanan administratif menuju hari pernikahan — dari tingkat RT hingga resepsi.
          </p>
        </CardBody>
      </Card>

      {/* Journey visualization */}
      <div className="scroll-x">
        <div className="flex min-w-max items-stretch gap-2 pb-2">
          {stages.map((stage, i) => (
            <div key={stage.id} className="flex items-center">
              <button
                onClick={() => setOpenStageId(stage.id)}
                className="w-40 rounded-lg border border-surface-border bg-surface-card p-4 text-left shadow-soft transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
              >
                <p className="text-sm font-medium text-ink">{stage.name}</p>
                <p className="mt-1 text-xs text-ink-faint">{stage.items.length} item</p>
                <div className="mt-3">
                  <ProgressBar percent={stageProgress(stage)} size="sm" />
                </div>
                <p className="mt-2 text-xs font-medium text-blush-600">{stageProgress(stage)}%</p>
              </button>
              {i < stages.length - 1 ? <ChevronRight className="mx-1 shrink-0 text-ink-faint" size={18} /> : null}
            </div>
          ))}
        </div>
      </div>

      {/* Stage detail cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stages.map((stage) => (
          <Card key={stage.id}>
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-ink">{stage.name}</h3>
                <span className="text-sm text-ink-faint">{stageProgress(stage)}%</span>
              </div>
              <ul className="space-y-2">
                {stage.items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
                    <div>
                      <p className="text-ink">{item.title}</p>
                      {item.deadline ? <p className="text-xs text-ink-faint">Deadline {formatDate(item.deadline)}</p> : null}
                    </div>
                    <button
                      onClick={() => {
                        const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(item.status) + 1) % STATUS_CYCLE.length];
                        updatePreparationStatus(stage.id, item.id, next);
                      }}
                    >
                      <PrepStatusBadge status={item.status} />
                    </button>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        ))}
      </div>

      <Modal open={!!openStage} onClose={() => setOpenStageId(null)} title={openStage?.name ?? ""}>
        {openStage ? (
          <ul className="space-y-3">
            {openStage.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
                <div>
                  <p className="text-ink">{item.title}</p>
                  {item.responsible ? <p className="text-xs text-ink-faint">PJ: {item.responsible}</p> : null}
                  {item.deadline ? <p className="text-xs text-ink-faint">Deadline {formatDate(item.deadline)}</p> : null}
                </div>
                <PrepStatusBadge status={item.status} />
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-5 flex justify-end">
          <Button variant="secondary" size="sm" onClick={() => setOpenStageId(null)}>
            Tutup
          </Button>
        </div>
      </Modal>
    </div>
  );
}
