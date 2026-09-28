"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, Button, ProgressBar } from "@/components/ui";
import { WORKSPACE_ID } from "@/lib/mock-data";

const STEPS = ["Nama pasangan", "Tanggal pernikahan", "Target budget", "Jenis acara"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ names: "", date: "", budget: "", type: "Akad & Resepsi" });

  const percent = Math.round(((step + 1) / (STEPS.length + 1)) * 100);

  function next() {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      // In production: create the wedding_workspace + wedding_members rows,
      // seed the default preparation template (section 38), then redirect.
      router.push(`/w/${WORKSPACE_ID}/dashboard`);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <Card className="w-full max-w-md">
        <CardBody className="space-y-5">
          <div>
            <p className="text-xs text-ink-faint">
              Langkah {step + 1} dari {STEPS.length}
            </p>
            <ProgressBar percent={percent} className="mt-2" />
          </div>

          <h2 className="text-lg font-semibold text-ink">{STEPS[step]}</h2>

          {step === 0 && (
            <input
              autoFocus
              placeholder="Contoh: Ayu & Angga"
              value={form.names}
              onChange={(e) => setForm({ ...form, names: e.target.value })}
              className="w-full rounded-md border border-surface-border px-3 py-2.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
            />
          )}
          {step === 1 && (
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full rounded-md border border-surface-border px-3 py-2.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
            />
          )}
          {step === 2 && (
            <input
              placeholder="Contoh: 85.000.000"
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
              className="w-full rounded-md border border-surface-border px-3 py-2.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
            />
          )}
          {step === 3 && (
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full rounded-md border border-surface-border px-3 py-2.5 text-sm"
            >
              <option>Akad & Resepsi</option>
              <option>Akad saja</option>
              <option>Resepsi saja</option>
              <option>Pernikahan adat</option>
            </select>
          )}

          <div className="flex justify-between pt-2">
            <Button variant="ghost" size="sm" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              Kembali
            </Button>
            <Button size="sm" onClick={next}>
              {step === STEPS.length - 1 ? "Buat Workspace" : "Lanjut"}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
