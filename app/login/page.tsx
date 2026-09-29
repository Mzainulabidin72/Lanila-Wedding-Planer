"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const { signIn, session, loading: authLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Already logged in → go home
  if (!authLoading && session) {
    router.replace("/");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Email dan kata sandi wajib diisi.");
      return;
    }
    setLoading(true);
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    router.replace("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md rounded-2xl border border-surface-border bg-surface-card p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2 text-brand-dark">
          <Heart size={22} className="fill-brand text-brand" />
          <div>
            <div className="text-lg font-semibold">Lanila Wedding</div>
            <div className="text-xs text-ink-muted">Masuk dengan akun Lanila</div>
          </div>
        </div>

        <p className="mb-6 text-sm text-ink-muted">
          Akun yang sama dengan <strong>Lanila Buku Kas</strong>. Sudah punya akun di Buku
          Kas? Langsung login di sini.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-surface-border bg-white px-3 py-2.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
              placeholder="nama@email.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Kata sandi</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-surface-border bg-white px-3 py-2.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Masuk…" : "Masuk"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Belum punya akun?{" "}
          <Link href="/register" className="font-medium text-brand hover:underline">
            Daftar
          </Link>
        </p>
      </div>
    </div>
  );
}
