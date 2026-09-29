"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";

export default function RegisterPage() {
  const { signUp, session, loading: authLoading } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  if (!authLoading && session) {
    router.replace("/");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!fullName.trim() || !email.trim() || !password) {
      setError("Nama, email, dan kata sandi wajib diisi.");
      return;
    }
    if (password.length < 6) {
      setError("Kata sandi minimal 6 karakter.");
      return;
    }
    setLoading(true);
    const { error: err } = await signUp(email, password, fullName);
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    setInfo(
      "Registrasi berhasil. Cek email untuk konfirmasi jika diminta, lalu login. Akun ini juga bisa dipakai di Lanila Buku Kas."
    );
    // If email confirm is off, session may already exist
    setTimeout(() => router.replace("/"), 1500);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md rounded-2xl border border-surface-border bg-surface-card p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2 text-brand-dark">
          <Heart size={22} className="fill-brand text-brand" />
          <div>
            <div className="text-lg font-semibold">Lanila Wedding</div>
            <div className="text-xs text-ink-muted">Buat akun Lanila</div>
          </div>
        </div>

        <p className="mb-6 text-sm text-ink-muted">
          Satu akun untuk <strong>Wedding Planner</strong> dan <strong>Buku Kas</strong>.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Nama lengkap</label>
            <input
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-md border border-surface-border bg-white px-3 py-2.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
              placeholder="Nama kamu"
            />
          </div>
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-surface-border bg-white px-3 py-2.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
              placeholder="Minimal 6 karakter"
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}
          {info && (
            <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {info}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Mendaftar…" : "Daftar"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-medium text-brand hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
