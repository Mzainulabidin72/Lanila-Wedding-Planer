-- =============================================================================
-- LANILA WEDDING PLANNER: ISOLASI DATA PER AKUN (user_id + Row Level Security)
-- =============================================================================
-- BELUM DIJALANKAN di database mana pun saat file ini dibuat (tidak ada Postgres
-- di lingkungan pembuatnya). Baca dan uji dulu seperti petunjuk di bawah.
--
-- ATURAN YANG DITERAPKAN
--   * Setiap tabel data pribadi punya user_id (default auth.uid()) -> auth.users.
--   * RLS aktif di SEMUA tabel; policy terpisah untuk SELECT/INSERT/UPDATE/DELETE,
--     semuanya hanya untuk role "authenticated" dan hanya jika user_id = auth.uid().
--   * Role "anon" dan PUBLIC dicabut aksesnya.
--   * Baris anak diikat ke proyek MILIK AKUN YANG SAMA lewat foreign key
--     komposit (project_id, user_id): tidak bisa menempelkan data ke proyek orang lain.
--   * Satu akun = satu proyek (unique user_id di wp_projects). TIDAK ada tabel
--     anggota/undangan/kolaborasi.
--
-- KEAMANAN UNTUK PROJECT BERSAMA (mis. dengan Lanila Buku Kas)
--   * Semua objek baru berprefix "wp_"; tidak ada enum baru (pakai text + CHECK).
--     Jadi tidak bisa bentrok dengan tabel/tipe lama atau milik aplikasi lain.
--   * File ini TIDAK mengubah, menghapus, atau memigrasi tabel yang sudah ada
--     (profiles, financial_transactions, dst. tidak disentuh).
--   * Idempotent: aman dijalankan ulang. Semua dalam satu transaksi (gagal = batal total).
--
-- URUTAN
--   1) Jalankan 00_audit_readonly.sql (hanya membaca) dan simpan hasilnya.
--   2) Jalankan file ini di project DEV / branch database dulu, BUKAN langsung produksi.
--   3) Jalankan 02_test_two_users.sql dengan dua akun uji.
--   4) Baru terapkan ke produksi jika semua tes lulus dan sudah ada backup.
-- =============================================================================

begin;

-- ------------------------------------------------------------------ proyek (1 per akun)
create table if not exists public.wp_projects (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name          text not null check (length(btrim(name)) > 0),
  wedding_date  timestamptz,
  wedding_type  text not null default 'Akad & Resepsi',
  venue         text,
  target_budget bigint not null default 0 check (target_budget >= 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id),          -- satu akun hanya boleh punya satu proyek pernikahan
  unique (id, user_id)       -- target foreign key komposit dari tabel anak
);

-- ------------------------------------------------------------------ wp_preparation_stages
create table if not exists public.wp_preparation_stages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id  uuid not null,
  name        text not null,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  unique (id, user_id),
  constraint wp_preparation_stages_project_fk foreign key (project_id, user_id)
    references public.wp_projects (id, user_id) on delete cascade
);

-- ------------------------------------------------------------------ wp_preparation_items
create table if not exists public.wp_preparation_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id  uuid not null,
  stage_id    uuid not null,
  title       text not null,
  status      text not null default 'belum' check (status in ('belum','diproses','selesai','tertunda')),
  deadline    date,
  responsible text,
  notes       text,
  created_at  timestamptz not null default now(),
  unique (id, user_id),
  constraint wp_preparation_items_project_fk foreign key (project_id, user_id)
    references public.wp_projects (id, user_id) on delete cascade,
  constraint wp_preparation_items_stage_fk foreign key (stage_id, user_id)
    references public.wp_preparation_stages (id, user_id) on delete cascade
);

-- ------------------------------------------------------------------ wp_tasks
create table if not exists public.wp_tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id  uuid not null,
  title       text not null,
  category    text not null default 'Lainnya',
  assignee    text,
  start_date  date,
  deadline    date,
  priority    text not null default 'medium' check (priority in ('low','medium','high','critical')),
  status      text not null default 'todo' check (status in ('todo','in_progress','completed','delayed')),
  linked_item_id uuid,  -- sengaja tanpa FK (kompatibel PG14); hanya referensi ke wp_preparation_items milik akun yang sama
  created_at  timestamptz not null default now(),
  unique (id, user_id),
  constraint wp_tasks_project_fk foreign key (project_id, user_id)
    references public.wp_projects (id, user_id) on delete cascade
);

-- ------------------------------------------------------------------ wp_budget_items
create table if not exists public.wp_budget_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id  uuid not null,
  category    text not null,
  name        text not null,
  planned_amount bigint not null default 0 check (planned_amount >= 0),
  actual_amount  bigint not null default 0 check (actual_amount >= 0),
  paid_amount    bigint not null default 0 check (paid_amount >= 0),
  vendor_id   uuid,     -- sengaja tanpa FK (kompatibel PG14)
  deadline    date,
  payment_status text not null default 'belum_bayar' check (payment_status in ('belum_bayar','dp','lunas')),
  notes       text,
  created_at  timestamptz not null default now(),
  unique (id, user_id),
  constraint wp_budget_items_project_fk foreign key (project_id, user_id)
    references public.wp_projects (id, user_id) on delete cascade
);

-- ------------------------------------------------------------------ wp_vendors
create table if not exists public.wp_vendors (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id  uuid not null,
  name        text not null,
  category    text not null,
  contact_person text,
  phone       text,
  price       bigint not null default 0 check (price >= 0),
  dp_amount   bigint not null default 0 check (dp_amount >= 0),
  status      text not null default 'research'
              check (status in ('research','contacted','negotiation','booked','dp_paid','fully_paid','cancelled')),
  payment_deadline date,
  notes       text,
  created_at  timestamptz not null default now(),
  unique (id, user_id),
  constraint wp_vendors_project_fk foreign key (project_id, user_id)
    references public.wp_projects (id, user_id) on delete cascade
);

-- ------------------------------------------------------------------ wp_guests
create table if not exists public.wp_guests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id  uuid not null,
  name        text not null,
  category    text not null default 'Lainnya',
  relationship text,
  phone       text,
  pax         integer not null default 1 check (pax >= 1),
  rsvp        text not null default 'belum' check (rsvp in ('belum','hadir','tidak_hadir')),
  table_label text,
  gift_status text check (gift_status in ('belum','sudah')),
  notes       text,
  created_at  timestamptz not null default now(),
  unique (id, user_id),
  constraint wp_guests_project_fk foreign key (project_id, user_id)
    references public.wp_projects (id, user_id) on delete cascade
);

-- ------------------------------------------------------------------ wp_seserahan_items
create table if not exists public.wp_seserahan_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id  uuid not null,
  name        text not null,
  category    text not null default 'Lainnya',
  planned_budget bigint not null default 0 check (planned_budget >= 0),
  actual_cost    bigint not null default 0 check (actual_cost >= 0),
  status      text not null default 'belum' check (status in ('belum','diproses','dibeli')),
  purchase_date date,
  notes       text,
  created_at  timestamptz not null default now(),
  unique (id, user_id),
  constraint wp_seserahan_items_project_fk foreign key (project_id, user_id)
    references public.wp_projects (id, user_id) on delete cascade
);

-- ------------------------------------------------------------------ wp_gifts
create table if not exists public.wp_gifts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id  uuid not null,
  giver_name  text,
  gift_type   text not null default 'barang' check (gift_type in ('tunai','transfer','barang')),
  amount      bigint check (amount is null or amount >= 0),
  description text,
  received_at date,
  notes       text,
  created_at  timestamptz not null default now(),
  unique (id, user_id),
  constraint wp_gifts_project_fk foreign key (project_id, user_id)
    references public.wp_projects (id, user_id) on delete cascade
);

-- ------------------------------------------------------------------ wp_documents
create table if not exists public.wp_documents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id  uuid not null,
  group_name  text not null default 'Pernikahan' check (group_name in ('Administrasi','Vendor','Pernikahan')),
  title       text not null,
  file_path   text not null,  -- path objek di bucket "wp-documents": <user_id>/<nama-file>
  mime_type   text,
  size_bytes  bigint check (size_bytes is null or size_bytes >= 0),
  created_at  timestamptz not null default now(),
  unique (id, user_id),
  constraint wp_documents_project_fk foreign key (project_id, user_id)
    references public.wp_projects (id, user_id) on delete cascade
);

-- ------------------------------------------------------------------ wp_events
create table if not exists public.wp_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id  uuid not null,
  kind        text not null check (kind in ('akad','resepsi')),
  event_date  timestamptz,
  location    text,
  details     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  unique (id, user_id),
  constraint wp_events_project_fk foreign key (project_id, user_id)
    references public.wp_projects (id, user_id) on delete cascade,
  unique (project_id, kind)
);

-- ------------------------------------------------------------------ wp_activity_log
create table if not exists public.wp_activity_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id  uuid not null,
  actor_name  text not null,
  action      text not null,
  object_label text not null,
  created_at  timestamptz not null default now(),
  unique (id, user_id),
  constraint wp_activity_log_project_fk foreign key (project_id, user_id)
    references public.wp_projects (id, user_id) on delete cascade
);

-- ------------------------------------------------------------------ index, RLS, hak akses, policy
create index if not exists wp_projects_user_id_idx on public.wp_projects (user_id);
create index if not exists wp_preparation_stages_user_id_idx on public.wp_preparation_stages (user_id);
create index if not exists wp_preparation_stages_project_id_idx on public.wp_preparation_stages (project_id);
create index if not exists wp_preparation_items_user_id_idx on public.wp_preparation_items (user_id);
create index if not exists wp_preparation_items_project_id_idx on public.wp_preparation_items (project_id);
create index if not exists wp_tasks_user_id_idx on public.wp_tasks (user_id);
create index if not exists wp_tasks_project_id_idx on public.wp_tasks (project_id);
create index if not exists wp_budget_items_user_id_idx on public.wp_budget_items (user_id);
create index if not exists wp_budget_items_project_id_idx on public.wp_budget_items (project_id);
create index if not exists wp_vendors_user_id_idx on public.wp_vendors (user_id);
create index if not exists wp_vendors_project_id_idx on public.wp_vendors (project_id);
create index if not exists wp_guests_user_id_idx on public.wp_guests (user_id);
create index if not exists wp_guests_project_id_idx on public.wp_guests (project_id);
create index if not exists wp_seserahan_items_user_id_idx on public.wp_seserahan_items (user_id);
create index if not exists wp_seserahan_items_project_id_idx on public.wp_seserahan_items (project_id);
create index if not exists wp_gifts_user_id_idx on public.wp_gifts (user_id);
create index if not exists wp_gifts_project_id_idx on public.wp_gifts (project_id);
create index if not exists wp_documents_user_id_idx on public.wp_documents (user_id);
create index if not exists wp_documents_project_id_idx on public.wp_documents (project_id);
create index if not exists wp_events_user_id_idx on public.wp_events (user_id);
create index if not exists wp_events_project_id_idx on public.wp_events (project_id);
create index if not exists wp_activity_log_user_id_idx on public.wp_activity_log (user_id);
create index if not exists wp_activity_log_project_id_idx on public.wp_activity_log (project_id);

alter table public.wp_projects enable row level security;
revoke all on table public.wp_projects from anon, public;
grant select, insert, update, delete on table public.wp_projects to authenticated;
drop policy if exists "wp_projects_select_own" on public.wp_projects;
create policy "wp_projects_select_own" on public.wp_projects
    for select to authenticated
    using (user_id = (select auth.uid()));
drop policy if exists "wp_projects_insert_own" on public.wp_projects;
create policy "wp_projects_insert_own" on public.wp_projects
    for insert to authenticated
    with check (user_id = (select auth.uid()));
drop policy if exists "wp_projects_update_own" on public.wp_projects;
create policy "wp_projects_update_own" on public.wp_projects
    for update to authenticated
    using (user_id = (select auth.uid()))
    with check (user_id = (select auth.uid()));
drop policy if exists "wp_projects_delete_own" on public.wp_projects;
create policy "wp_projects_delete_own" on public.wp_projects
    for delete to authenticated
    using (user_id = (select auth.uid()));

alter table public.wp_preparation_stages enable row level security;
revoke all on table public.wp_preparation_stages from anon, public;
grant select, insert, update, delete on table public.wp_preparation_stages to authenticated;
drop policy if exists "wp_preparation_stages_select_own" on public.wp_preparation_stages;
create policy "wp_preparation_stages_select_own" on public.wp_preparation_stages
    for select to authenticated
    using (user_id = (select auth.uid()));
drop policy if exists "wp_preparation_stages_insert_own" on public.wp_preparation_stages;
create policy "wp_preparation_stages_insert_own" on public.wp_preparation_stages
    for insert to authenticated
    with check (user_id = (select auth.uid()));
drop policy if exists "wp_preparation_stages_update_own" on public.wp_preparation_stages;
create policy "wp_preparation_stages_update_own" on public.wp_preparation_stages
    for update to authenticated
    using (user_id = (select auth.uid()))
    with check (user_id = (select auth.uid()));
drop policy if exists "wp_preparation_stages_delete_own" on public.wp_preparation_stages;
create policy "wp_preparation_stages_delete_own" on public.wp_preparation_stages
    for delete to authenticated
    using (user_id = (select auth.uid()));

alter table public.wp_preparation_items enable row level security;
revoke all on table public.wp_preparation_items from anon, public;
grant select, insert, update, delete on table public.wp_preparation_items to authenticated;
drop policy if exists "wp_preparation_items_select_own" on public.wp_preparation_items;
create policy "wp_preparation_items_select_own" on public.wp_preparation_items
    for select to authenticated
    using (user_id = (select auth.uid()));
drop policy if exists "wp_preparation_items_insert_own" on public.wp_preparation_items;
create policy "wp_preparation_items_insert_own" on public.wp_preparation_items
    for insert to authenticated
    with check (user_id = (select auth.uid()));
drop policy if exists "wp_preparation_items_update_own" on public.wp_preparation_items;
create policy "wp_preparation_items_update_own" on public.wp_preparation_items
    for update to authenticated
    using (user_id = (select auth.uid()))
    with check (user_id = (select auth.uid()));
drop policy if exists "wp_preparation_items_delete_own" on public.wp_preparation_items;
create policy "wp_preparation_items_delete_own" on public.wp_preparation_items
    for delete to authenticated
    using (user_id = (select auth.uid()));

alter table public.wp_tasks enable row level security;
revoke all on table public.wp_tasks from anon, public;
grant select, insert, update, delete on table public.wp_tasks to authenticated;
drop policy if exists "wp_tasks_select_own" on public.wp_tasks;
create policy "wp_tasks_select_own" on public.wp_tasks
    for select to authenticated
    using (user_id = (select auth.uid()));
drop policy if exists "wp_tasks_insert_own" on public.wp_tasks;
create policy "wp_tasks_insert_own" on public.wp_tasks
    for insert to authenticated
    with check (user_id = (select auth.uid()));
drop policy if exists "wp_tasks_update_own" on public.wp_tasks;
create policy "wp_tasks_update_own" on public.wp_tasks
    for update to authenticated
    using (user_id = (select auth.uid()))
    with check (user_id = (select auth.uid()));
drop policy if exists "wp_tasks_delete_own" on public.wp_tasks;
create policy "wp_tasks_delete_own" on public.wp_tasks
    for delete to authenticated
    using (user_id = (select auth.uid()));

alter table public.wp_budget_items enable row level security;
revoke all on table public.wp_budget_items from anon, public;
grant select, insert, update, delete on table public.wp_budget_items to authenticated;
drop policy if exists "wp_budget_items_select_own" on public.wp_budget_items;
create policy "wp_budget_items_select_own" on public.wp_budget_items
    for select to authenticated
    using (user_id = (select auth.uid()));
drop policy if exists "wp_budget_items_insert_own" on public.wp_budget_items;
create policy "wp_budget_items_insert_own" on public.wp_budget_items
    for insert to authenticated
    with check (user_id = (select auth.uid()));
drop policy if exists "wp_budget_items_update_own" on public.wp_budget_items;
create policy "wp_budget_items_update_own" on public.wp_budget_items
    for update to authenticated
    using (user_id = (select auth.uid()))
    with check (user_id = (select auth.uid()));
drop policy if exists "wp_budget_items_delete_own" on public.wp_budget_items;
create policy "wp_budget_items_delete_own" on public.wp_budget_items
    for delete to authenticated
    using (user_id = (select auth.uid()));

alter table public.wp_vendors enable row level security;
revoke all on table public.wp_vendors from anon, public;
grant select, insert, update, delete on table public.wp_vendors to authenticated;
drop policy if exists "wp_vendors_select_own" on public.wp_vendors;
create policy "wp_vendors_select_own" on public.wp_vendors
    for select to authenticated
    using (user_id = (select auth.uid()));
drop policy if exists "wp_vendors_insert_own" on public.wp_vendors;
create policy "wp_vendors_insert_own" on public.wp_vendors
    for insert to authenticated
    with check (user_id = (select auth.uid()));
drop policy if exists "wp_vendors_update_own" on public.wp_vendors;
create policy "wp_vendors_update_own" on public.wp_vendors
    for update to authenticated
    using (user_id = (select auth.uid()))
    with check (user_id = (select auth.uid()));
drop policy if exists "wp_vendors_delete_own" on public.wp_vendors;
create policy "wp_vendors_delete_own" on public.wp_vendors
    for delete to authenticated
    using (user_id = (select auth.uid()));

alter table public.wp_guests enable row level security;
revoke all on table public.wp_guests from anon, public;
grant select, insert, update, delete on table public.wp_guests to authenticated;
drop policy if exists "wp_guests_select_own" on public.wp_guests;
create policy "wp_guests_select_own" on public.wp_guests
    for select to authenticated
    using (user_id = (select auth.uid()));
drop policy if exists "wp_guests_insert_own" on public.wp_guests;
create policy "wp_guests_insert_own" on public.wp_guests
    for insert to authenticated
    with check (user_id = (select auth.uid()));
drop policy if exists "wp_guests_update_own" on public.wp_guests;
create policy "wp_guests_update_own" on public.wp_guests
    for update to authenticated
    using (user_id = (select auth.uid()))
    with check (user_id = (select auth.uid()));
drop policy if exists "wp_guests_delete_own" on public.wp_guests;
create policy "wp_guests_delete_own" on public.wp_guests
    for delete to authenticated
    using (user_id = (select auth.uid()));

alter table public.wp_seserahan_items enable row level security;
revoke all on table public.wp_seserahan_items from anon, public;
grant select, insert, update, delete on table public.wp_seserahan_items to authenticated;
drop policy if exists "wp_seserahan_items_select_own" on public.wp_seserahan_items;
create policy "wp_seserahan_items_select_own" on public.wp_seserahan_items
    for select to authenticated
    using (user_id = (select auth.uid()));
drop policy if exists "wp_seserahan_items_insert_own" on public.wp_seserahan_items;
create policy "wp_seserahan_items_insert_own" on public.wp_seserahan_items
    for insert to authenticated
    with check (user_id = (select auth.uid()));
drop policy if exists "wp_seserahan_items_update_own" on public.wp_seserahan_items;
create policy "wp_seserahan_items_update_own" on public.wp_seserahan_items
    for update to authenticated
    using (user_id = (select auth.uid()))
    with check (user_id = (select auth.uid()));
drop policy if exists "wp_seserahan_items_delete_own" on public.wp_seserahan_items;
create policy "wp_seserahan_items_delete_own" on public.wp_seserahan_items
    for delete to authenticated
    using (user_id = (select auth.uid()));

alter table public.wp_gifts enable row level security;
revoke all on table public.wp_gifts from anon, public;
grant select, insert, update, delete on table public.wp_gifts to authenticated;
drop policy if exists "wp_gifts_select_own" on public.wp_gifts;
create policy "wp_gifts_select_own" on public.wp_gifts
    for select to authenticated
    using (user_id = (select auth.uid()));
drop policy if exists "wp_gifts_insert_own" on public.wp_gifts;
create policy "wp_gifts_insert_own" on public.wp_gifts
    for insert to authenticated
    with check (user_id = (select auth.uid()));
drop policy if exists "wp_gifts_update_own" on public.wp_gifts;
create policy "wp_gifts_update_own" on public.wp_gifts
    for update to authenticated
    using (user_id = (select auth.uid()))
    with check (user_id = (select auth.uid()));
drop policy if exists "wp_gifts_delete_own" on public.wp_gifts;
create policy "wp_gifts_delete_own" on public.wp_gifts
    for delete to authenticated
    using (user_id = (select auth.uid()));

alter table public.wp_documents enable row level security;
revoke all on table public.wp_documents from anon, public;
grant select, insert, update, delete on table public.wp_documents to authenticated;
drop policy if exists "wp_documents_select_own" on public.wp_documents;
create policy "wp_documents_select_own" on public.wp_documents
    for select to authenticated
    using (user_id = (select auth.uid()));
drop policy if exists "wp_documents_insert_own" on public.wp_documents;
create policy "wp_documents_insert_own" on public.wp_documents
    for insert to authenticated
    with check (user_id = (select auth.uid()));
drop policy if exists "wp_documents_update_own" on public.wp_documents;
create policy "wp_documents_update_own" on public.wp_documents
    for update to authenticated
    using (user_id = (select auth.uid()))
    with check (user_id = (select auth.uid()));
drop policy if exists "wp_documents_delete_own" on public.wp_documents;
create policy "wp_documents_delete_own" on public.wp_documents
    for delete to authenticated
    using (user_id = (select auth.uid()));

alter table public.wp_events enable row level security;
revoke all on table public.wp_events from anon, public;
grant select, insert, update, delete on table public.wp_events to authenticated;
drop policy if exists "wp_events_select_own" on public.wp_events;
create policy "wp_events_select_own" on public.wp_events
    for select to authenticated
    using (user_id = (select auth.uid()));
drop policy if exists "wp_events_insert_own" on public.wp_events;
create policy "wp_events_insert_own" on public.wp_events
    for insert to authenticated
    with check (user_id = (select auth.uid()));
drop policy if exists "wp_events_update_own" on public.wp_events;
create policy "wp_events_update_own" on public.wp_events
    for update to authenticated
    using (user_id = (select auth.uid()))
    with check (user_id = (select auth.uid()));
drop policy if exists "wp_events_delete_own" on public.wp_events;
create policy "wp_events_delete_own" on public.wp_events
    for delete to authenticated
    using (user_id = (select auth.uid()));

alter table public.wp_activity_log enable row level security;
revoke all on table public.wp_activity_log from anon, public;
grant select, insert, update, delete on table public.wp_activity_log to authenticated;
drop policy if exists "wp_activity_log_select_own" on public.wp_activity_log;
create policy "wp_activity_log_select_own" on public.wp_activity_log
    for select to authenticated
    using (user_id = (select auth.uid()));
drop policy if exists "wp_activity_log_insert_own" on public.wp_activity_log;
create policy "wp_activity_log_insert_own" on public.wp_activity_log
    for insert to authenticated
    with check (user_id = (select auth.uid()));
drop policy if exists "wp_activity_log_update_own" on public.wp_activity_log;
create policy "wp_activity_log_update_own" on public.wp_activity_log
    for update to authenticated
    using (user_id = (select auth.uid()))
    with check (user_id = (select auth.uid()));
drop policy if exists "wp_activity_log_delete_own" on public.wp_activity_log;
create policy "wp_activity_log_delete_own" on public.wp_activity_log
    for delete to authenticated
    using (user_id = (select auth.uid()));

commit;

-- =============================================================================
-- STORAGE (dokumen). Dipisah dari transaksi di atas: jika bagian ini ditolak karena
-- hak akses, tabel di atas sudah aman tersimpan. Bucket PRIVAT; file hanya boleh
-- dibaca/ditulis di folder bernama user_id sendiri: <user_id>/<nama-file>.
-- =============================================================================
begin;

insert into storage.buckets (id, name, public)
values ('wp-documents', 'wp-documents', false)
on conflict (id) do nothing;

drop policy if exists "wp_storage_documents_select_own" on storage.objects;
create policy "wp_storage_documents_select_own" on storage.objects
    for select to authenticated
    using (bucket_id = 'wp-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "wp_storage_documents_insert_own" on storage.objects;
create policy "wp_storage_documents_insert_own" on storage.objects
    for insert to authenticated
    with check (bucket_id = 'wp-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "wp_storage_documents_update_own" on storage.objects;
create policy "wp_storage_documents_update_own" on storage.objects
    for update to authenticated
    using (bucket_id = 'wp-documents' and (storage.foldername(name))[1] = (select auth.uid())::text)
    with check (bucket_id = 'wp-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "wp_storage_documents_delete_own" on storage.objects;
create policy "wp_storage_documents_delete_own" on storage.objects
    for delete to authenticated
    using (bucket_id = 'wp-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);

commit;
