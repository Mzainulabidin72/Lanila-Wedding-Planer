# Integrasi Akun — Lanila Wedding ↔ Buku Kas

## Goal
Satu akun Supabase untuk **Wedding Planner** dan **Buku Kas**.  
Bukan merge UI — hanya shared Auth + `profiles`.

## Yang ditambahkan

| File | Fungsi |
|------|--------|
| `lib/supabase.ts` | Client Supabase (URL/key sama dengan Buku Kas) |
| `lib/auth-context.tsx` | AuthProvider: session, profile, signIn/signUp/signOut |
| `components/AuthGate.tsx` | Redirect ke `/login` jika belum login |
| `app/login/page.tsx` | Halaman login |
| `app/register/page.tsx` | Halaman register |
| `app/layout.tsx` | Wrap AuthProvider + AuthGate |
| `app/page.tsx` | Setelah login → workspace demo |
| `components/wedding/Topbar.tsx` | Tombol Keluar + nama user |

## Setup

1. Copy env:
   ```bash
   cp .env.example .env.local
   ```
   Isi dengan **project Supabase Buku Kas** yang sama:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://....supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

2. Install & run:
   ```bash
   npm install
   npm run dev
   ```

3. Buka `http://localhost:3000` → akan redirect ke `/login`.

## Cara kerja

- Register di Wedding → user masuk `auth.users` + di-upsert ke `profiles` (tabel yang sama dengan Buku Kas).
- Login di Wedding dengan email/password yang sama seperti Buku Kas → session valid.
- Login di Buku Kas dulu, lalu buka Wedding (browser yang sama, localStorage Supabase) → biasanya sudah auto-login (same origin policy: **hanya jika domain sama**; kalau beda domain, user login sekali di tiap domain, tapi **akun-nya tetap satu**).

## Catatan domain

- Kalau Wedding di `wedding.lanila.id` dan Buku Kas di `kas.lanila.id`, session cookie/localStorage **tidak otomatis share** antar subdomain tanpa setup tambahan (cookie domain / SSO).
- Yang dishare: **identitas di database** (satu `auth.users` + `profiles`). User login pakai email/password yang sama di kedua app.

## Profiles schema

Wedding mengasumsikan tabel `profiles` sudah ada (dari Buku Kas), minimal:

```sql
id uuid PK → auth.users
full_name text
```

Kalau Buku Kas punya kolom tambahan (`role`, `email`, dll), upsert di `ensureProfile` hanya set field yang aman.

## Next (opsional)

- [ ] Setelah login, query `wedding_members` → redirect ke workspace milik user
- [ ] Kalau belum punya workspace → `/onboarding`
- [ ] Invite partner via email (insert `wedding_members`)
