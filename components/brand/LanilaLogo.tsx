import clsx from "clsx";
import { LanilaMark } from "./LanilaMark";

interface LanilaLogoProps {
  /** Nama produk di bawah wordmark, contoh: "Wedding Planner". */
  product?: string;
  /** "light" = untuk background terang, "dark" = untuk background gelap. */
  tone?: "light" | "dark";
  /** Ukuran logo daun dalam px. */
  size?: number;
  className?: string;
}

export function LanilaLogo({ product, tone = "light", size = 40, className }: LanilaLogoProps) {
  const onDark = tone === "dark";
  return (
    <span className={clsx("inline-flex items-center gap-3", className)}>
      <LanilaMark size={size} />
      <span className="flex flex-col leading-none">
        <span
          className={clsx(
            "text-[1.65rem] font-extrabold tracking-tight",
            onDark ? "text-white" : "text-lanila-navy"
          )}
        >
          Lanila
        </span>
        {product ? (
          <span
            className={clsx(
              "mt-1 text-[0.8rem] font-semibold",
              onDark ? "text-lanila-coral" : "text-lanila-coral-deep"
            )}
          >
            {product}
          </span>
        ) : null}
      </span>
    </span>
  );
}
