"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { WORKSPACE_ID } from "@/lib/mock-data";

/**
 * After auth, send user to demo workspace dashboard.
 * Later: look up wedding_members for this user and redirect to their workspace,
 * or /onboarding if none.
 */
export default function RootPage() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    // TODO: query wedding_members where user_id = session.user.id
    router.replace(`/w/${WORKSPACE_ID}/dashboard`);
  }, [session, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface text-ink-muted">
      Mengalihkan…
    </div>
  );
}
