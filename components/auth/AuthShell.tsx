import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { LanilaLogo } from "@/components/brand/LanilaLogo";
import { LanilaMark } from "@/components/brand/LanilaMark";

const HIGHLIGHTS = [
  "Peta persiapan dari administrasi sampai hari-H",
  "Budget, vendor, dan seserahan tercatat rapi",
  "Daftar tamu dan RSVP dalam satu tempat",
];

interface AuthShellProps {
  title: string;
  description: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Kerangka halaman masuk/daftar: panel merek gelap di kiri (desktop saja)
 * dan kolom form di kanan. Dipakai bersama oleh /login dan /register.
 */
export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      {/* Panel merek (hanya desktop) */}
      <aside className="relative hidden overflow-hidden bg-lanila-night text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        {/* Cahaya koral di belakang logo daun */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -right-32 h-[34rem] w-[34rem] rounded-full bg-lanila-coral/20 blur-3xl"
        />
        {/* Logo daun besar sebagai elemen utama, memudar ke arah teks */}
        <LanilaMark
          size={520}
          className="pointer-events-none absolute -bottom-24 -right-20 [mask-image:linear-gradient(135deg,transparent_8%,#000_58%)]"
        />

        <LanilaLogo tone="dark" product="Wedding Planner" className="relative z-10" />

        <div className="relative z-10 max-w-md">
          <h2 className="text-[2.1rem] font-extrabold leading-[1.15] tracking-tight xl:text-4xl">
            Persiapan pernikahan yang rapi, dari lamaran sampai hari-H.
          </h2>
          <ul className="mt-8 space-y-3.5">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-[0.95rem] text-slate-300">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-lanila-coral/20 text-lanila-coral">
                  <Check size={13} strokeWidth={3} aria-hidden="true" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-sm text-slate-400">
          Satu akun untuk semua aplikasi Lanila.
        </p>
      </aside>

      {/* Kolom form */}
      <main className="flex min-h-screen flex-col justify-center px-6 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <LanilaLogo product="Wedding Planner" size={36} className="mb-10 lg:hidden" />

          <h1 className="text-[1.75rem] font-extrabold tracking-tight text-lanila-navy">{title}</h1>
          <p className="mt-2 text-[0.95rem] leading-relaxed text-slate-600">{description}</p>

          <div className="mt-8">{children}</div>

          {footer ? <div className="mt-8 text-center text-sm text-slate-600">{footer}</div> : null}
        </div>
      </main>
    </div>
  );
}
