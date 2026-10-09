"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AuthError, Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

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

const AuthContext = createContext<AuthContextValue | null>(null);

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

  const refreshProfile = useCallback(async () => {
    const uid = (await supabase.auth.getUser()).data.user?.id;
    if (!uid) {
      setProfile(null);
      return;
    }
    const p = await fetchProfile(uid);
    setProfile(p);
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      if (s?.user) {
        const p = await fetchProfile(s.user.id);
        if (mounted) setProfile(p);
      }
      if (mounted) setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      if (s?.user) {
        const p = await fetchProfile(s.user.id);
        setProfile(p);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

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
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
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
