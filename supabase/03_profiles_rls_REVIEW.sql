-- =============================================================================
-- USULAN RLS UNTUK TABEL `profiles`: HANYA UNTUK DITINJAU, TIDAK UNTUK LANGSUNG DIJALANKAN
-- =============================================================================
-- `profiles` dipakai bersama Lanila Buku Kas. Mengubah policy-nya bisa merusak aplikasi
-- lain, dan saya tidak bisa melihat isi database Anda dari sini. Karena itu:
--
--   1. Jalankan 00_audit_readonly.sql blok [10] dan kirim hasilnya untuk ditinjau.
--   2. Pastikan Buku Kas TIDAK membutuhkan membaca profil pengguna lain
--      (jika butuh, policy "select own" di bawah akan merusaknya).
--   3. Cari policy lama yang longgar di hasil [10c] (mis. using (true), atau untuk anon).
--      Policy permissive saling di-OR, jadi policy longgar harus DIHAPUS secara sadar
--      (DROP POLICY ... ) setelah ditinjau; skrip ini sengaja tidak menghapus apa pun.
--   4. Uji di project DEV, lalu uji login Wedding Planner dan Buku Kas.
--   5. Baru hapus baris pengaman (DO $$ ... $$) di bawah dan jalankan.
--
-- Yang dicapai bila diterapkan: pengguna hanya dapat membaca dan mengubah baris profilnya
-- sendiri (id = auth.uid()); tidak ada akses untuk anon; tidak ada DELETE lewat API.
-- =============================================================================

-- PENGAMAN: skrip ini berhenti di sini sampai baris ini dihapus secara sengaja.
do $$ begin
  raise exception 'REVIEW ONLY: tinjau hasil audit [10] dan koordinasikan dengan Lanila Buku Kas sebelum menjalankan skrip ini.';
end $$;

begin;

alter table public.profiles enable row level security;

-- Dibuat hanya jika belum ada (nama baru agar tidak menimpa policy lama).
drop policy if exists "profiles_select_own_v1" on public.profiles;
create policy "profiles_select_own_v1" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

drop policy if exists "profiles_insert_own_v1" on public.profiles;
create policy "profiles_insert_own_v1" on public.profiles
  for insert to authenticated
  with check (id = (select auth.uid()));

-- UPDATE: baris lama dan hasil perubahan harus tetap milik pengguna (id tidak bisa dialihkan).
drop policy if exists "profiles_update_own_v1" on public.profiles;
create policy "profiles_update_own_v1" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Tidak ada policy DELETE: penghapusan profil tidak boleh lewat API publik.

-- Pengguna belum login (anon) tidak boleh menyentuh data profil.
revoke all on table public.profiles from anon;

commit;

-- Setelah menjalankan: ulangi blok [10c] audit dan pastikan TIDAK ada lagi policy longgar
-- yang membuat profil pengguna lain tetap terbaca.
