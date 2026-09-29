"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const PUBLIC_PATHS = ["/login", "/register"];

/**
 * Redirects unauthenticated users to /login.
 * Renders children only when session exists (or on public routes).
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  useEffect(() => {
    if (loading) return;
    if (!session && !isPublic) {
      router.replace("/login");
    }
  }, [session, loading, isPublic, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-ink-muted">
        Memuat…
      </div>
    );
  }

  if (!session && !isPublic) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-ink-muted">
        Mengalihkan ke login…
      </div>
    );
  }

  return <>{children}</>;
}
