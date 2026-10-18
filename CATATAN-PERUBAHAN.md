# Catatan Perubahan: Tahap 1 + Migrasi ke Vite

## Tahap 1 (sudah dikirim sebelumnya, ikut di zip ini)
- Fix tipe icon di `Sidebar.tsx` (13 error TypeScript hilang).
- Pesan error login/daftar dipetakan per kode error Supabase
  ("Email not confirmed" tidak lagi dibilang "Email atau kata sandi salah").
- Redirect di login/register dipindah ke `useEffect`; password minimal 8 karakter.
- Tampilan login dan daftar baru sesuai brand guide Lanila.

## Migrasi Next.js -> Vite + React Router
Tampilan, store, auth, dan URL halaman TIDAK berubah. Yang berubah hanya "mesin"-nya.

### Lokasi file lama -> baru
| Lama (Next.js) | Baru (Vite) |
|---|---|
| `app/layout.tsx` (font, metadata) | `index.html` + `src/main.tsx` |
| `app/globals.css` | `src/index.css` |
| `app/page.tsx` | `src/pages/RootRedirect.tsx` |
| `app/login/page.tsx` | `src/pages/LoginPage.tsx` |
| `app/register/page.tsx` | `src/pages/RegisterPage.tsx` |
| `app/onboarding/page.tsx` | `src/pages/OnboardingPage.tsx` |
| `app/w/[workspaceId]/layout.tsx` | `src/layouts/WorkspaceLayout.tsx` |
| `app/w/[workspaceId]/<nama>/page.tsx` | `src/pages/workspace/<Nama>Page.tsx` |
| (folder routing otomatis) | `src/App.tsx` (daftar route ditulis manual) |
| `components/`, `lib/` | `src/components/`, `src/lib/` |
| `next.config.js`, `next-env.d.ts` | dihapus; diganti `vite.config.ts` |
| `NEXT_PUBLIC_SUPABASE_*` | `VITE_SUPABASE_*` |

### Padanan kode
| Next.js | React Router |
|---|---|
| `next/link` `<Link href>` | `<Link to>` |
| `useRouter().replace(x)` / `.push(x)` | `useNavigate()` -> `navigate(x, { replace: true })` / `navigate(x)` |
| `usePathname()` | `useLocation().pathname` |
| `params.workspaceId` (prop layout) | `useParams()` |
| `{children}` di layout | `<Outlet />` |

### Perubahan perilaku kecil
- `/w/<id>` (tanpa halaman) sekarang diarahkan ke dashboard (dulu 404).
- Alamat yang tidak dikenal menampilkan halaman 404 buatan sendiri.
- Port dev tetap 3000 (sama seperti Next.js).
- Masalah hydration mismatch di store (baca localStorage saat render pertama)
  otomatis hilang, karena tidak ada lagi render di server.

## Cara pindah di komputer kamu
1. Ekstrak zip ke FOLDER BARU (jangan ditimpa ke folder lama).
2. Salin `.env.local` dari folder lama ke folder baru, lalu ganti nama dua variabelnya:
   `NEXT_PUBLIC_SUPABASE_URL` -> `VITE_SUPABASE_URL`
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` -> `VITE_SUPABASE_ANON_KEY`
3. `npm install`
4. `npm run dev` lalu buka http://localhost:3000
5. `npm run build` (harus sukses), lalu `npm run preview` untuk mencoba hasil build.

Tidak perlu membawa `node_modules`, `.next`, atau `package-lock.json` lama.

## Checklist pengujian
- [ ] `/login` tampil, login berhasil, masuk ke dashboard demo
- [ ] Buka langsung `/w/wk_ayu_angga/budget` lalu refresh: halaman tetap tampil
- [ ] Menu sidebar dan navigasi bawah (HP) berpindah halaman, menu aktif ikut berubah
- [ ] Tombol "Lihat semua" di dashboard menuju budget/timeline
- [ ] Tombol Keluar mengembalikan ke `/login`
- [ ] Buka `/w/wk_ayu_angga/dashboard` saat belum login: diarahkan ke `/login`
- [ ] Buka alamat ngawur (`/abc`): muncul halaman 404

## Deploy ke Vercel
1. Settings > Environment Variables: tambahkan `VITE_SUPABASE_URL` dan
   `VITE_SUPABASE_ANON_KEY` (nilai sama seperti sebelumnya), hapus yang `NEXT_PUBLIC_*`.
2. `vercel.json` sudah mengatur preset Vite, folder `dist`, dan rewrite SPA
   (supaya refresh di `/w/.../budget` tidak 404). Jika build masih dibaca sebagai Next.js,
   ubah Framework Preset ke "Vite" di Settings > Build & Development.
3. Redeploy (variabel lingkungan baru hanya berlaku setelah build ulang).

## Yang BELUM terverifikasi (tidak bisa dijalankan di lingkungan pembuatan)
`npm install`, `vite build`, dan jalan di browser belum diuji karena tidak ada internet.
Sudah diuji: `tsc` 0 error (dengan tiruan tipe React Router), semua kelas Tailwind terbentuk,
dan tidak ada sisa import/hook Next.js. Jika `npm run build` memberi error, kirim ke saya.
