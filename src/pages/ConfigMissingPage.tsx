/**
 * Ditampilkan saat variabel Supabase belum diisi, supaya pengguna melihat petunjuk
 * yang jelas dan bukan layar putih kosong.
 */
export default function ConfigMissingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-6 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold text-lanila-coral-deep">Konfigurasi belum lengkap</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-lanila-navy">
          File .env.local belum dibuat
        </h1>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-slate-600">
          Aplikasi butuh dua variabel untuk terhubung ke Supabase. Buat file bernama{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">.env.local</code> di folder
          utama project (sejajar dengan <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">package.json</code>),
          lalu isi seperti ini:
        </p>

        <pre className="mt-4 overflow-x-auto rounded-xl bg-lanila-night p-4 text-sm leading-relaxed text-slate-200">
{`VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...`}
        </pre>

        <ol className="mt-5 list-decimal space-y-2 pl-5 text-[0.95rem] text-slate-600">
          <li>Nilainya ada di Supabase: Project Settings → API (pakai anon/public key).</li>
          <li>Simpan file, lalu hentikan server (Ctrl+C) dan jalankan ulang <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">npm run dev</code>.</li>
          <li>Refresh halaman ini.</li>
        </ol>

        <p className="mt-5 text-sm text-slate-500">
          Server harus dijalankan ulang karena Vite hanya membaca file .env saat pertama dinyalakan.
        </p>
      </div>
    </div>
  );
}
