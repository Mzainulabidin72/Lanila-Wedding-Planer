import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Card, CardBody, Button, ProgressBar } from "@/components/ui";
import { useStore } from "@/lib/store";

const STEPS = ["Nama pasangan", "Tanggal pernikahan", "Target budget", "Jenis acara"];

/** Unduh teks sebagai file (cadangan data lama). */
function downloadTextFile(filename: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const IMPORT_ERRORS: Record<string, string> = {
  "already-has-data": "Akun ini sudah punya proyek, jadi data lama tidak diimpor agar tidak menimpa.",
  "verification-failed": "Impor dibatalkan karena hasilnya gagal diverifikasi. Data kamu tidak diubah.",
  "source-invalid": "Data lama tidak dapat dibaca, jadi tidak diimpor.",
  "source-missing": "Data lama sudah tidak ada di browser ini.",
};

const INPUT_CLASS =
  "w-full rounded-md border border-surface-border px-3 py-2.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { workspace, createWorkspace, legacyEntries, importLegacyData, dismissLegacyData, getLegacyBackup } = useStore();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [legacyMessage, setLegacyMessage] = useState("");
  const [form, setForm] = useState({ names: "", date: "", budget: "", type: "Akad & Resepsi" });

  // Satu akun hanya punya satu proyek: jika sudah ada, jangan buat lagi (dan jangan menimpanya).
  if (workspace) return <Navigate to={`/w/${workspace.id}/dashboard`} replace />;

  const percent = Math.round(((step + 1) / (STEPS.length + 1)) * 100);
  const legacyEntry = legacyEntries[0];

  function backupLegacy() {
    const file = getLegacyBackup();
    if (file) downloadTextFile(file.filename, file.content);
  }

  function importLegacy() {
    if (!legacyEntry) return;
    const ok = window.confirm(
      `Impor data lama "${legacyEntry.workspaceName}" ke akun kamu?\n\nData lama tetap disimpan sebagai cadangan dan tidak dihapus.`
    );
    if (!ok) return;
    const result = importLegacyData(legacyEntry.sourceKey);
    if (!result.ok) setLegacyMessage(IMPORT_ERRORS[result.reason] ?? "Data lama tidak dapat diimpor.");
    // jika berhasil, akun ini sudah punya proyek dan halaman otomatis dialihkan ke dashboard
  }

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

          {step === 0 && legacyEntry ? (
            <div role="region" aria-label="Data lama terdeteksi" className="space-y-2 rounded-md border border-surface-border bg-surface-muted p-3 text-sm">
              <p className="font-medium text-ink">Ada data dari versi lama aplikasi di browser ini</p>
              <p className="text-ink-soft">
                Proyek “{legacyEntry.workspaceName}” ({legacyEntry.counts.vendors} vendor, {legacyEntry.counts.guests} tamu,{" "}
                {legacyEntry.counts.tasks} tugas). Data ini tidak terhubung ke akun mana pun, jadi{" "}
                <strong>tidak otomatis menjadi milik akunmu</strong> dan tidak dipakai kecuali kamu memilih
                mengimpornya. Bisa jadi ini hanya data contoh.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={backupLegacy}>
                  Unduh cadangan
                </Button>
                <Button variant="secondary" size="sm" onClick={importLegacy}>
                  Impor ke akun ini
                </Button>
                <Button variant="ghost" size="sm" onClick={dismissLegacyData}>
                  Jangan impor
                </Button>
              </div>
              {legacyMessage ? (
                <p role="alert" className="text-danger">
                  {legacyMessage}
                </p>
              ) : null}
            </div>
          ) : null}

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
