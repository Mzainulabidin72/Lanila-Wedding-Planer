-- =============================================================================
-- UJI ISOLASI DUA AKUN di database (jalankan SETELAH 01_wedding_user_isolation.sql)
-- =============================================================================
-- BELUM DIJALANKAN saat file ini dibuat (tidak ada Postgres di lingkungan pembuatnya).
-- Skrip ini meniru request dari Akun A, Akun B, role anon, dan request tanpa login,
-- persis seperti yang dialami API Supabase. Semua perubahan dibatalkan di akhir (ROLLBACK).
--
-- PERSIAPAN
--   1. Daftarkan DUA akun uji lewat aplikasi (Akun A dan Akun B).
--   2. Buka Supabase > Authentication > Users, salin id (UUID) kedua akun.
--   3. Ganti dua UUID pada baris "GANTI" di bawah.
--   4. Jalankan seluruh file ini sekaligus.
--
-- HASIL
--   * Berhasil : muncul NOTICE "SEMUA TES ISOLASI LULUS".
--   * Gagal    : muncul error berawalan "GAGAL:" yang menyebut tes mana. Jalankan
--                "rollback;" lalu JANGAN dipakai di produksi sebelum diperbaiki.
-- =============================================================================

begin;

do $$
declare
  a  uuid := '00000000-0000-0000-0000-00000000000a';  -- GANTI: id Akun A
  b  uuid := '00000000-0000-0000-0000-00000000000b';  -- GANTI: id Akun B
  pa uuid;  -- proyek A
  pb uuid;  -- proyek B
  va uuid;  -- vendor A
  vb uuid;  -- vendor B
  n  integer;
  blocked boolean;
begin
  if a = '00000000-0000-0000-0000-00000000000a' or b = '00000000-0000-0000-0000-00000000000b' then
    raise exception 'Ganti dulu UUID Akun A dan Akun B (baris bertanda GANTI) dengan id user sungguhan.';
  end if;
  if a = b then
    raise exception 'Akun A dan Akun B harus berbeda.';
  end if;

  ---------------------------------------------------------------- sebagai Akun A
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', a::text, true);
  perform set_config('role', 'authenticated', true);

  insert into public.wp_projects (name) values ('Proyek Uji A') returning id into pa;
  insert into public.wp_vendors (project_id, name, category) values (pa, 'Vendor Uji A', 'Catering') returning id into va;

  -- A tidak boleh punya dua proyek (satu akun = satu proyek)
  blocked := false;
  begin
    insert into public.wp_projects (name) values ('Proyek Kedua A');
  exception when others then
    blocked := true;
  end;
  if not blocked then raise exception 'GAGAL: Akun A berhasil membuat proyek kedua'; end if;

  execute 'reset role';

  ---------------------------------------------------------------- sebagai Akun B
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', b::text, true);
  perform set_config('role', 'authenticated', true);

  insert into public.wp_projects (name) values ('Proyek Uji B') returning id into pb;
  insert into public.wp_vendors (project_id, name, category) values (pb, 'Vendor Uji B', 'Catering') returning id into vb;

  -- B hanya melihat datanya sendiri
  select count(*) into n from public.wp_projects;
  if n <> 1 then raise exception 'GAGAL: Akun B melihat % proyek (seharusnya 1)', n; end if;
  select count(*) into n from public.wp_vendors;
  if n <> 1 then raise exception 'GAGAL: Akun B melihat % vendor (seharusnya 1, miliknya sendiri)', n; end if;
  select count(*) into n from public.wp_vendors where id = va;
  if n <> 0 then raise exception 'GAGAL: Akun B bisa MEMBACA vendor milik Akun A lewat id-nya'; end if;
  select count(*) into n from public.wp_projects where id = pa;
  if n <> 0 then raise exception 'GAGAL: Akun B bisa MEMBACA proyek milik Akun A lewat id-nya'; end if;

  -- B tidak boleh MENGUBAH data A
  update public.wp_vendors set name = 'DIRETAS' where id = va;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'GAGAL: Akun B berhasil MENGUBAH vendor Akun A'; end if;
  update public.wp_projects set name = 'DIRETAS' where id = pa;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'GAGAL: Akun B berhasil MENGUBAH proyek Akun A'; end if;

  -- B tidak boleh MENGHAPUS data A
  delete from public.wp_vendors where id = va;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'GAGAL: Akun B berhasil MENGHAPUS vendor Akun A'; end if;
  delete from public.wp_projects where id = pa;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'GAGAL: Akun B berhasil MENGHAPUS proyek Akun A'; end if;

  -- B tidak boleh menyisipkan baris atas nama A (memalsukan user_id)
  blocked := false;
  begin
    insert into public.wp_vendors (user_id, project_id, name, category) values (a, pa, 'Palsu', 'x');
  exception when others then
    blocked := true;
  end;
  if not blocked then raise exception 'GAGAL: Akun B berhasil menyisipkan baris dengan user_id Akun A'; end if;

  -- B tidak boleh menempelkan data miliknya ke PROYEK milik A
  blocked := false;
  begin
    insert into public.wp_vendors (project_id, name, category) values (pa, 'Menempel ke proyek A', 'x');
  exception when others then
    blocked := true;
  end;
  if not blocked then raise exception 'GAGAL: Akun B berhasil menempelkan vendor ke proyek Akun A'; end if;

  -- B tidak boleh memindahkan barisnya sendiri menjadi milik A
  blocked := false;
  begin
    update public.wp_vendors set user_id = a where id = vb;
  exception when others then
    blocked := true;
  end;
  if not blocked then raise exception 'GAGAL: Akun B berhasil mengganti user_id barisnya menjadi Akun A'; end if;

  execute 'reset role';

  ---------------------------------------------------------------- sebagai anon (tanpa login, hanya anon key)
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('role', 'anon', true);

  blocked := false;
  begin
    select count(*) into n from public.wp_projects;
    if n = 0 then blocked := true; end if;  -- 0 baris juga dianggap aman (tidak ada data bocor)
  exception when others then
    blocked := true;                        -- permission denied juga aman
  end;
  if not blocked then raise exception 'GAGAL: anon bisa membaca % proyek', n; end if;

  blocked := false;
  begin
    insert into public.wp_projects (user_id, name) values (a, 'Dari anon');
  exception when others then
    blocked := true;
  end;
  if not blocked then raise exception 'GAGAL: anon berhasil menyisipkan data'; end if;

  execute 'reset role';

  ---------------------------------------------------------------- authenticated tetapi tanpa identitas (sub kosong)
  perform set_config('request.jwt.claims', json_build_object('role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('role', 'authenticated', true);

  blocked := false;
  begin
    insert into public.wp_projects (name) values ('Tanpa identitas');
  exception when others then
    blocked := true;
  end;
  if not blocked then raise exception 'GAGAL: request tanpa identitas berhasil menyisipkan data'; end if;

  execute 'reset role';

  ---------------------------------------------------------------- A kembali: datanya utuh dan tidak berubah
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', a::text, true);
  perform set_config('role', 'authenticated', true);

  select count(*) into n from public.wp_projects where id = pa and name = 'Proyek Uji A';
  if n <> 1 then raise exception 'GAGAL: proyek Akun A berubah/hilang setelah diserang Akun B'; end if;
  select count(*) into n from public.wp_vendors where id = va and name = 'Vendor Uji A';
  if n <> 1 then raise exception 'GAGAL: vendor Akun A berubah/hilang setelah diserang Akun B'; end if;
  select count(*) into n from public.wp_projects;
  if n <> 1 then raise exception 'GAGAL: Akun A melihat % proyek (seharusnya 1)', n; end if;

  execute 'reset role';
  raise notice 'SEMUA TES ISOLASI LULUS (Akun A dan Akun B terpisah penuh; anon dan request tanpa identitas ditolak)';
end
$$;

-- Batalkan semua data uji (tidak ada yang tersisa di database)
rollback;
