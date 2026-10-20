import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/lib/auth-context";
import { isSupabaseConfigured } from "@/lib/supabase";
import { AuthGate } from "@/components/AuthGate";
import { UserScopedStore } from "@/components/UserScopedStore";
import WorkspaceLayout from "@/layouts/WorkspaceLayout";
import ConfigMissingPage from "@/pages/ConfigMissingPage";

// Setiap halaman dimuat hanya saat dibuka (code splitting per halaman, seperti di Next.js).
const RootRedirect = lazy(() => import("@/pages/RootRedirect"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/RegisterPage"));
const OnboardingPage = lazy(() => import("@/pages/OnboardingPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

const DashboardPage = lazy(() => import("@/pages/workspace/DashboardPage"));
const PetaPersiapanPage = lazy(() => import("@/pages/workspace/PetaPersiapanPage"));
const AlurPernikahanPage = lazy(() => import("@/pages/workspace/AlurPernikahanPage"));
const TimelinePage = lazy(() => import("@/pages/workspace/TimelinePage"));
const BudgetPage = lazy(() => import("@/pages/workspace/BudgetPage"));
const VendorPage = lazy(() => import("@/pages/workspace/VendorPage"));
const TamuPage = lazy(() => import("@/pages/workspace/TamuPage"));
const SeserahanPage = lazy(() => import("@/pages/workspace/SeserahanPage"));
const HadiahPage = lazy(() => import("@/pages/workspace/HadiahPage"));
const AcaraPage = lazy(() => import("@/pages/workspace/AcaraPage"));
const DokumenPage = lazy(() => import("@/pages/workspace/DokumenPage"));
const SettingsPage = lazy(() => import("@/pages/workspace/SettingsPage"));
const AccountSettingsPage = lazy(() => import("@/pages/workspace/AccountSettingsPage"));

function PageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface text-ink-soft">
      Memuat…
    </div>
  );
}

export default function App() {
  // Env Supabase belum diisi: tampilkan petunjuk, jangan render aplikasinya (hindari layar putih).
  if (!isSupabaseConfigured) return <ConfigMissingPage />;

  return (
    <AuthProvider>
      <AuthGate>
        <UserScopedStore>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<RootRedirect />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />

              <Route path="/w/:workspaceId" element={<WorkspaceLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="peta-persiapan" element={<PetaPersiapanPage />} />
                <Route path="alur-pernikahan" element={<AlurPernikahanPage />} />
                <Route path="timeline" element={<TimelinePage />} />
                <Route path="budget" element={<BudgetPage />} />
                <Route path="vendor" element={<VendorPage />} />
                <Route path="tamu" element={<TamuPage />} />
                <Route path="seserahan" element={<SeserahanPage />} />
                <Route path="hadiah" element={<HadiahPage />} />
                <Route path="acara" element={<AcaraPage />} />
                <Route path="dokumen" element={<DokumenPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="settings/account" element={<AccountSettingsPage />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </UserScopedStore>
      </AuthGate>
    </AuthProvider>
  );
}
