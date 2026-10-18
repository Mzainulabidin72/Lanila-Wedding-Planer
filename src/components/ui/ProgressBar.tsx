import clsx from "clsx";

interface Props {
  percent: number;
  tone?: "blush" | "brand" | "success" | "warning" | "danger";
  size?: "sm" | "md";
  className?: string;
}

const tones = {
  blush: "bg-blush-500",
  brand: "bg-brand",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

export function ProgressBar({ percent, tone = "blush", size = "md", className }: Props) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div
      className={clsx("w-full overflow-hidden rounded-full bg-surface-muted", size === "sm" ? "h-1.5" : "h-2.5", className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={clsx("h-full rounded-full transition-all", tones[tone])} style={{ width: `${clamped}%` }} />
    </div>
  );
}
