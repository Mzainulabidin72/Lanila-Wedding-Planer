import { ReactNode } from "react";
import { Button } from "./Button";

interface Props {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-surface-border py-14 text-center">
      {icon ? <div className="text-3xl">{icon}</div> : null}
      <div>
        <p className="font-medium text-ink">{title}</p>
        <p className="mt-1 text-sm text-ink-soft">{description}</p>
      </div>
      {actionLabel && onAction ? (
        <Button size="sm" onClick={onAction} className="mt-1">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
