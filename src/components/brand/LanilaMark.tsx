import { useId } from "react";

interface LanilaMarkProps {
  /** Lebar dan tinggi dalam px (logo berbentuk persegi). */
  size?: number;
  className?: string;
  /** "gradient" = logo master biru→ungu; "white" = putih polos (untuk di atas ikon aplikasi berwarna). */
  variant?: "gradient" | "white";
}

/**
 * Logo Lanila (dua daun membentuk huruf L), digambar ulang sebagai SVG dari
 * brand guide supaya tetap tajam di ukuran berapa pun.
 * Gradien memakai id unik (useId) supaya aman dipakai berkali-kali dalam satu halaman.
 */
export function LanilaMark({ size = 40, className, variant = "gradient" }: LanilaMarkProps) {
  const white = variant === "white";
  const uid = useId().replace(/:/g, "");
  const tall = `${uid}-tall`;
  const low = `${uid}-low`;

  return (
    <svg
      viewBox="26 56 650 650"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={tall} x1="0.15" y1="0" x2="0.55" y2="1">
          <stop offset="0" stopColor="#3F8CFF" />
          <stop offset="1" stopColor="#5B4CF2" />
        </linearGradient>
        <linearGradient id={low} x1="0.05" y1="1" x2="0.95" y2="0">
          <stop offset="0" stopColor="#8A3FF7" />
          <stop offset="1" stopColor="#7A72FD" />
        </linearGradient>
      </defs>
      <path
        fill={white ? "#FFFFFF" : `url(#${tall})`}
        d="M325 75 L152 177 C104 205 80 236 80 282 L80 538 C80 600 118 642 165 665 L300 522 C318 502 325 486 325 462 Z"
      />
      <path
        fill={white ? "#FFFFFF" : `url(#${low})`}
        fillOpacity={white ? 0.82 : 1}
        d="M195 683 L318 543 C372 478 420 437 480 437 L622 437 C592 520 548 590 492 632 C446 668 400 688 346 688 Z"
      />
    </svg>
  );
}
