import clsx from "clsx";
import { HTMLAttributes } from "react";

type Tone = "neutral" | "success" | "warning" | "danger" | "brand";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-muted text-ink-soft",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
  brand: "bg-brand/10 text-brand",
};

interface Props extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ tone = "neutral", className, ...rest }: Props) {
  return (
    <span
      className={clsx("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium", tones[tone], className)}
      {...rest}
    />
  );
}
