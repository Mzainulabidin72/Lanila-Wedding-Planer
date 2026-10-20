/**
 * Keputusan terhadap profil akun untuk tiap event Supabase Auth.
 * Dipisah dari auth-context.tsx supaya mudah diuji.
 *
 *  - SIGNED_OUT / sesi kedaluwarsa (tanpa user) -> bersihkan profil.
 *  - TOKEN_REFRESHED                           -> akun sama, tidak perlu memuat ulang.
 *  - PASSWORD_RECOVERY                         -> tidak mengubah profil.
 *  - USER_UPDATED                              -> muat ulang (nama/email bisa berubah).
 *  - SIGNED_IN / INITIAL_SESSION / lainnya     -> muat jika profil akun ini belum termuat.
 *    (SDK memicu SIGNED_IN lagi saat tab kembali fokus; jangan muat ulang tanpa perlu.)
 */
export type ProfileAction = "load" | "clear" | "keep";

export function profileActionFor(event: string, hasUser: boolean, profileLoadedForThisUser: boolean): ProfileAction {
  if (!hasUser) return "clear";
  switch (event) {
    case "TOKEN_REFRESHED":
    case "PASSWORD_RECOVERY":
      return "keep";
    case "USER_UPDATED":
      return "load";
    default:
      return profileLoadedForThisUser ? "keep" : "load";
  }
}
