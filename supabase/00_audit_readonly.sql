-- =============================================================================
-- AUDIT READ-ONLY: jalankan SEBELUM 01_wedding_user_isolation.sql
-- =============================================================================
-- Skrip ini HANYA membaca (select). Tidak mengubah apa pun.
-- Tujuannya: mengetahui isi database yang sebenarnya (project ini dipakai bersama
-- aplikasi Lanila lain), jangan berasumsi.
--
-- CARA PAKAI di Supabase SQL Editor: tiap blok di bawah dipisah garis. Blok-blok
-- sebaiknya dijalankan SATU PER SATU (sorot satu blok, lalu "Run selected"), karena
-- editor hanya menampilkan hasil pernyataan terakhir. Simpan/salin hasil tiap blok.
-- =============================================================================

-- [1] Versi Postgres
select version();

-- [2] Semua tabel di schema public: RLS aktif atau tidak, dan perkiraan jumlah baris
select c.relname                as table_name,
       c.relrowsecurity         as rls_enabled,
       c.relforcerowsecurity    as rls_forced,
       s.n_live_tup             as approx_rows
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_stat_user_tables s on s.relid = c.oid
where n.nspname = 'public' and c.relkind in ('r', 'p')
order by c.relrowsecurity, c.relname;
-- Perhatikan baris dengan rls_enabled = false: tabel itu terbuka untuk siapa pun
-- yang memegang anon key (kunci ini publik di aplikasi web).

-- [3] Semua policy yang ada sekarang
select tablename, policyname, cmd, roles, qual as using_expr, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- [4] Tabel dari schema.sql LAMA yang ternyata sudah ada, beserta jumlah baris sebenarnya
select t.table_name,
       (xpath('/row/c/text()',
              query_to_xml(format('select count(*) as c from public.%I', t.table_name), false, true, '')))[1]::text::int
         as exact_rows
from information_schema.tables t
where t.table_schema = 'public' and t.table_type = 'BASE TABLE'
  and t.table_name in ('profiles', 'wedding_workspaces', 'wedding_members', 'preparation_stages',
                       'preparation_items', 'wedding_tasks', 'wedding_budgets', 'vendors',
                       'wedding_budget_items', 'financial_transactions', 'guests', 'gift_records',
                       'seserahan_items', 'wedding_events', 'documents', 'activity_logs', 'notifications')
order by t.table_name;
-- Jika tabel wedding_* lama berisi baris: itu data yang HARUS diperiksa pemiliknya
-- sebelum diputuskan nasibnya. Skrip 01 tidak menyentuhnya.

-- [5] Tabel lama tadi: apakah punya kolom pemilik (user_id) atau hanya workspace_id?
select table_name,
       bool_or(column_name = 'user_id')      as punya_user_id,
       bool_or(column_name = 'workspace_id') as punya_workspace_id,
       bool_or(column_name = 'profile_id')   as punya_profile_id
from information_schema.columns
where table_schema = 'public'
  and table_name in ('wedding_workspaces', 'wedding_members', 'preparation_stages', 'preparation_items',
                     'wedding_tasks', 'wedding_budgets', 'vendors', 'wedding_budget_items',
                     'financial_transactions', 'guests', 'gift_records', 'seserahan_items',
                     'wedding_events', 'documents', 'activity_logs', 'notifications')
group by table_name
order by table_name;

-- [6] Hak akses role "anon" (publik) pada tabel public: idealnya kosong untuk data pribadi
select table_name, string_agg(privilege_type, ', ' order by privilege_type) as hak_anon
from information_schema.role_table_grants
where table_schema = 'public' and grantee = 'anon'
group by table_name
order by table_name;

-- [7] View dan fungsi (RPC) yang bisa melewati RLS
select 'view' as jenis, table_name as nama, '' as keterangan
from information_schema.views where table_schema = 'public'
union all
select 'function', p.proname, case when p.prosecdef then 'SECURITY DEFINER (melewati RLS!)' else 'security invoker' end
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by 1, 2;

-- [8] Storage: bucket dan policy-nya
select id, name, public as bucket_publik from storage.buckets order by name;
select policyname, cmd, roles from pg_policies where schemaname = 'storage' order by policyname;

-- [9] Pastikan nama baru "wp_*" belum dipakai (hasil diharapkan: kosong sebelum skrip 01 dijalankan)
select table_name from information_schema.tables
where table_schema = 'public' and table_name like 'wp\_%';

-- [10] FOKUS tabel `profiles`: satu-satunya tabel data pengguna yang dipakai aplikasi ini sekarang
--      (dipakai bersama Lanila Buku Kas). Jalankan satu per satu.
-- 10a. Kolom
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'profiles'
order by ordinal_position;

-- 10b. RLS aktif? (rls_enabled = false berarti SIAPA PUN dengan anon key bisa membaca/menulis semua profil)
select c.relname, c.relrowsecurity as rls_enabled, c.relforcerowsecurity as rls_forced
from pg_class c where c.oid = to_regclass('public.profiles');

-- 10c. Policy yang ada. PERHATIAN: policy bersifat PERMISSIVE secara bawaan dan saling di-OR;
--      satu policy longgar (mis. using (true)) membuat policy ketat lain tidak berguna.
select policyname, cmd, roles, permissive, qual as using_expr, with_check
from pg_policies where schemaname = 'public' and tablename = 'profiles'
order by cmd, policyname;

-- 10d. Hak akses langsung untuk anon / authenticated
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'profiles' and grantee in ('anon', 'authenticated')
order by grantee, privilege_type;

-- 10e. Trigger / fungsi yang membuat baris profiles saat user mendaftar (jika ada)
select t.tgname as trigger_name, c.relname as on_table, p.proname as function_name, p.prosecdef as security_definer
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_proc p on p.oid = t.tgfoid
where not t.tgisinternal and (c.relname = 'profiles' or (c.relnamespace = 'auth'::regnamespace and c.relname = 'users'));
