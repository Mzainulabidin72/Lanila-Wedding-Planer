# Tahap 1: Catatan Perubahan

## Perbaikan bug
- `components/wedding/Sidebar.tsx`: tipe `icon` diganti ke `LucideIcon` (13 error TypeScript hilang, build tidak gagal lagi).
- `lib/auth-context.tsx`: pesan error login/daftar dipetakan per kode error Supabase.
  "Email not confirmed" kini punya pesan sendiri, tidak lagi dibilang "Email atau kata sandi salah".
- `app/login/page.tsx` dan `app/register/page.tsx`: `router.replace` dipindah dari saat render ke `useEffect`.
- Password minimal 8 karakter di form daftar.

## Tampilan baru
- Halaman login dan daftar didesain ulang mengikuti brand guide Lanila.
- Komponen baru: `components/brand/` (LanilaMark, LanilaLogo) dan `components/auth/` (AuthShell, AuthField, AuthSubmit).
- `tailwind.config.ts`: palet `lanila` ditambahkan. `app/layout.tsx`: bobot font 800 ditambahkan.

## PENTING: aturan password juga di Supabase
Batas 8 karakter di form hanya cek sisi browser. Di dashboard Supabase buka
Authentication > Sign In / Providers (atau Policies) > Password, lalu set minimum length ke 8.
