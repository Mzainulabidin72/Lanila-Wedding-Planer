import type { ReactNode } from "react";
import { getDisplayName, useAuth } from "@/lib/auth-context";
import { StoreProvider } from "@/lib/store";

/**
 * Memasang StoreProvider KHUSUS untuk akun yang sedang login. key={user.id} membuat React
 * membuang seluruh state akun sebelumnya saat logout atau ganti akun (termasuk ganti akun
 * dari tab lain, karena sesi Supabase dibagikan antar-tab), jadi data akun lama tidak
 * pernah terlihat oleh akun baru. Tanpa sesi, tidak ada data pernikahan yang dibaca.
 */
export function UserScopedStore({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  if (!user) return <>{children}</>;
  return (
    <StoreProvider key={user.id} userId={user.id} actorName={getDisplayName(profile, user)}>
      {children}
    </StoreProvider>
  );
}
