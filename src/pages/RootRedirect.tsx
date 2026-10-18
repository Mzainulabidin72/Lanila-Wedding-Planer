import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { useStore } from "@/lib/store";

/**
 * Setelah login: arahkan ke proyek pernikahan MILIK akun ini,
 * atau ke onboarding jika akun ini belum punya proyek.
 */
export default function RootPage() {
  const { session, loading } = useAuth();
  const { workspace } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate("/login", { replace: true });
      return;
    }
    navigate(workspace ? `/w/${workspace.id}/dashboard` : "/onboarding", { replace: true });
  }, [session, loading, workspace, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface text-ink-soft">
      Mengalihkan…
    </div>
  );
}
