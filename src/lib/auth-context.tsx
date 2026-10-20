import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { AuthError, Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { profileActionFor } from "./auth-events";
import { getDisplayName } from "./display-name";

export interface Profile {
  id: string;
  full_name?: string | null;
  email?: string | null;
  role?: string | null;
  avatar_url?: string | null;
  [key: string]: unknown;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

/** Terjemahkan error Supabase Auth ke pesan Indonesia yang jelas untuk pengguna. */
function toLoginMessage(error: AuthError): string {
  const text = error.message.toLowerCase();
  if (error.code === "email_not_confirmed" || text.includes("email not confirmed")) {
    return "Email belum dikonfirmasi. Cek kotak masuk kamu, klik tautan konfirmasi, lalu masuk lagi.";
  }
  if (error.code === "invalid_credentials" || text.includes("invalid login credentials")) {
    return "Email atau kata sandi salah.";
  }
  if (error.status === 429 || error.code === "over_request_rate_limit") {
    return "Terlalu banyak percobaan. Tunggu sebentar, lalu coba lagi.";
  }
  if (error.name === "AuthRetryableFetchError") {
    return "Tidak bisa terhubung ke server. Periksa koneksi internet kamu.";
  }
  console.error("[auth] signIn:", error.message);
  return "Gagal masuk. Coba lagi beberapa saat lagi.";
}

function toSignUpMessage(error: AuthError): string {
  const text = error.message.toLowerCase();
  if (error.code === "user_already_exists" || text.includes("already registered")) {
    return "Email ini sudah terdaftar. Coba masuk, atau pakai email lain.";
  }
  if (error.code === "weak_password" || text.includes("password")) {
    return "Kata sandi terlalu lemah. Pakai minimal 8 karakter dengan kombinasi huruf dan angka.";
  }
  if (error.status === 429 || error.code === "over_request_rate_limit") {
    return "Terlalu banyak percobaan. Tunggu sebentar, lalu coba lagi.";
  }
  if (error.name === "AuthRetryableFetchError") {
    return "Tidak bisa terhubung ke server. Periksa koneksi internet kamu.";
  }
  console.error("[auth] signUp:", error.message);
  return "Gagal mendaftar. Coba lagi beberapa saat lagi.";
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export { getDisplayName };

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[auth] fetch profile:", error.message);
    return null;
  }
  return data as Profile | null;
}

/**
 * Ensure a profiles row exists after sign-up / first login.
 * Buku Kas may already create this via trigger; we upsert defensively.
 */
async function ensureProfile(user: User, fullName?: string) {
  const name =
    fullName ||
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split("@")[0] ||
    "User";

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      full_name: name,
      // email column may or may not exist depending on Buku Kas schema
    },
    { onConflict: "id" }
  );

  if (error) {
    // Non-fatal: profile might already exist with stricter columns
    console.warn("[auth] ensureProfile:", error.message);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  // Nomor permintaan profil terbaru: hasil permintaan lama (akun sebelumnya) diabaikan.
  const profileTicket = useRef(0);
  // id akun yang profilnya sudah termuat (untuk memutuskan perlu muat ulang atau tidak)
  const profileLoadedFor = useRef<string | null>(null);

  const loadProfile = useCallback(async (userId: string) => {
    const ticket = ++profileTicket.current;
    const p = await fetchProfile(userId);
    if (ticket !== profileTicket.current) return; // sudah ada permintaan lebih baru / akun berganti
    profileLoadedFor.current = p ? userId : null;
    setProfile(p);
  }, []);

  const clearProfile = useCallback(() => {
    profileTicket.current++; // batalkan permintaan yang masih berjalan
    profileLoadedFor.current = null;
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const uid = (await supabase.auth.getUser()).data.user?.id;
    if (!uid) {
      clearProfile();
      return;
    }
    await loadProfile(uid);
  }, [loadProfile, clearProfile]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      if (s?.user) await loadProfile(s.user.id);
      if (mounted) setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setLoading(false);
      // SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED, INITIAL_SESSION, dst.:
      // lihat auth-events.ts untuk aturan tiap event.
      const uid = s?.user?.id ?? null;
      const action = profileActionFor(event, uid !== null, uid !== null && profileLoadedFor.current === uid);
      if (action === "clear") {
        clearProfile();
        return;
      }
      if (action === "keep" || !uid) return;
      // JANGAN memanggil Supabase (await) langsung di dalam callback ini: bisa deadlock
      // dan membuat login menggantung. Tunda ke tick berikutnya.
      setTimeout(() => {
        if (mounted) void loadProfile(uid);
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile, clearProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) return { error: toLoginMessage(error) };
    return { error: null };
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, fullName: string) => {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim() },
        },
      });
      if (error) return { error: toSignUpMessage(error) };

      if (data.user) {
        await ensureProfile(data.user, fullName.trim());
      }
      return { error: null };
    },
    []
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    clearProfile();
  }, [clearProfile]);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      // Profil hanya dipakai jika benar milik akun yang sedang login (cegah profil akun lama muncul sesaat).
      profile: profile && profile.id === session?.user?.id ? profile : null,
      loading,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [session, profile, loading, signIn, signUp, signOut, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
