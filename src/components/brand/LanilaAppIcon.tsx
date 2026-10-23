import { LanilaMark } from "./LanilaMark";

/**
 * Ikon aplikasi Lanila Wedding Planner: tile koral dengan logo daun putih,
 * mengikuti varian "Wedding Planner" pada brand guide Lanila. Inline SVG, jadi tidak ada
 * file gambar yang bisa gagal dimuat.
 */
export function LanilaAppIcon({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <span
      role="img"
      aria-label="Lanila Wedding Planner"
      className={`inline-flex shrink-0 items-center justify-center shadow-sm ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: "linear-gradient(145deg, #F8808B 0%, #E8505F 100%)",
      }}
    >
      <LanilaMark variant="white" size={Math.round(size * 0.58)} />
    </span>
  );
}
