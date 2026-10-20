/**
 * Nama yang ditampilkan untuk akun aktif. Urutan: profil akun -> metadata pendaftaran ->
 * bagian depan email. Tidak pernah memakai nama akun lain atau nama contoh.
 * (Ini nama AKUN, bukan nama pasangan / nama proyek pernikahan.)
 */
export function getDisplayName(
  profile: { full_name?: string | null } | null,
  user: { email?: string | null; user_metadata?: Record<string, unknown> | null } | null
): string {
  const fromProfile = typeof profile?.full_name === "string" ? profile.full_name.trim() : "";
  if (fromProfile) return fromProfile;
  const meta = user?.user_metadata?.full_name;
  const fromMeta = typeof meta === "string" ? meta.trim() : "";
  if (fromMeta) return fromMeta;
  return user?.email?.split("@")[0] || "Pengguna";
}
