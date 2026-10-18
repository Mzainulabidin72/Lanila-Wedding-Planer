import { Card, CardBody, Badge } from "@/components/ui";
import { alurLakiLaki, alurPerempuan, AlurStep } from "@/lib/content/alur-pernikahan";

function StepList({ steps }: { steps: AlurStep[] }) {
  return (
    <div className="space-y-4">
      {steps.map((step, i) => (
        <Card key={step.title}>
          <CardBody className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blush-50 text-xs font-medium text-blush-600">
                {i + 1}
              </span>
              <h4 className="font-medium text-ink">{step.title}</h4>
            </div>
            <p className="text-sm text-ink-soft">{step.objective}</p>

            {step.documents.length > 0 && (
              <div>
                <p className="text-xs font-medium text-ink-faint">Dokumen dibutuhkan</p>
                <ul className="mt-1 list-inside list-disc text-sm text-ink-soft">
                  {step.documents.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-ink-faint">Checklist</p>
              <ul className="mt-1 list-inside list-disc text-sm text-ink-soft">
                {step.checklist.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap gap-2 pt-1 text-xs text-ink-faint">
              <span>Estimasi: {step.estimatedProcess}</span>
              <span>·</span>
              <span>PJ: {step.responsible}</span>
            </div>

            {step.notes ? (
              <p className="rounded-md bg-warning-bg px-3 py-2 text-xs text-warning">{step.notes}</p>
            ) : null}
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

export default function AlurPernikahanPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="space-y-2">
          <h2 className="text-base font-semibold text-ink">Alur Pernikahan</h2>
          <p className="text-sm text-ink-soft">
            Panduan umum tahapan administrasi pernikahan di Indonesia, dari tingkat RT hingga KUA.
          </p>
          <div className="mt-2 flex items-start gap-2 rounded-md bg-brand/5 px-3 py-2.5 text-xs text-ink-soft">
            <Badge tone="brand">Panduan umum</Badge>
            <span>
              Konten ini adalah panduan umum, bukan ketentuan resmi. Persyaratan dan prosedur dapat berbeda
              tergantung wilayah dan kebijakan instansi terkait, serta dapat berubah sewaktu-waktu — selalu
              konfirmasikan langsung ke kelurahan, puskesmas, atau KUA setempat.
            </span>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-medium text-ink-faint">Calon Pengantin Laki-laki</h3>
          <StepList steps={alurLakiLaki} />
        </div>
        <div>
          <h3 className="mb-3 text-sm font-medium text-ink-faint">Calon Pengantin Perempuan</h3>
          <StepList steps={alurPerempuan} />
        </div>
      </div>
    </div>
  );
}
