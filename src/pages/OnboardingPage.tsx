import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Card, CardBody, Button, ProgressBar } from "@/components/ui";
import { useStore } from "@/lib/store";

const STEPS = ["Nama pasangan", "Tanggal pernikahan", "Target budget", "Jenis acara"];

const INPUT_CLASS =
  "w-full rounded-md border border-surface-border px-3 py-2.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { workspace, createWorkspace } = useStore();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ names: "", date: "", budget: "", type: "Akad & Resepsi" });

  // Satu akun hanya punya satu proyek: jika sudah ada, jangan buat lagi (dan jangan menimpanya).
  if (workspace) return <Navigate to={`/w/${workspace.id}/dashboard`} replace />;

  const percent = Math.round(((step + 1) / (STEPS.length + 1)) * 100);

  function next() {
    if (step === 0 && !form.names.trim()) {
      setError("Isi nama proyek pernikahan dulu, misalnya nama kamu dan pasangan.");
      return;
    }
    setError("");
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    const created = createWorkspace({
      name: form.names,
      // tanggal dipilih pengguna dalam zona waktu perangkatnya (tengah malam lokal)
      weddingDate: form.date ? new Date(`${form.date}T00:00:00`).toISOString() : undefined,
      targetBudget: Number(form.budget.replace(/\D/g, "")) || 0,
      weddingType: form.type,
    });
    if (created) navigate(`/w/${created.id}/dashboard`, { replace: true });
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
              aria-label="Nama proyek pernikahan"
              placeholder="Contoh: Nama Kamu & Nama Pasangan"
              value={form.names}
              onChange={(e) => setForm({ ...form, names: e.target.value })}
              className={INPUT_CLASS}
            />
          )}
          {step === 1 && (
            <div className="space-y-1.5">
              <input
                type="date"
                aria-label="Tanggal pernikahan"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className={INPUT_CLASS}
              />
              <p className="text-xs text-ink-faint">Boleh dikosongkan dulu jika tanggalnya belum pasti.</p>
            </div>
          )}
          {step === 2 && (
            <input
              inputMode="numeric"
              aria-label="Target budget"
              placeholder="Contoh: 85.000.000"
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
              className={INPUT_CLASS}
            />
          )}
          {step === 3 && (
            <select
              aria-label="Jenis acara"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className={INPUT_CLASS}
            >
              <option>Akad &amp; Resepsi</option>
              <option>Akad saja</option>
              <option>Resepsi saja</option>
              <option>Pernikahan adat</option>
            </select>
          )}

          {error ? (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          ) : null}

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
