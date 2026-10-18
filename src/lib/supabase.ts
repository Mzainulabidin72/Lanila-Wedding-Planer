import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** false jika file .env.local belum dibuat / variabelnya kosong. Dipakai App.tsx untuk menampilkan petunjuk. */
export const isSupabaseConfigured = Boolean(url && anon);

if (!isSupabaseConfigured) {
  console.error(
    "[Lanila Wedding] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY (cek file .env.local)"
  );
}

/**
 * Browser Supabase client — same project as Lanila Buku Kas.
 * Auth users + profiles are shared across both apps.
 *
 * Catatan: createClient() melempar error kalau URL kosong, dan itu membuat seluruh
 * aplikasi gagal tampil (layar putih). Karena itu dipakai nilai placeholder; aplikasi
 * tidak akan memakainya karena App.tsx menampilkan halaman petunjuk lebih dulu.
 */
export const supabase = createClient(url || "http://localhost", anon || "missing-anon-key", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
