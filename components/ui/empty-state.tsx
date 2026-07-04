import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
}

function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-6",
        "rounded-[var(--radius-2xl)] border border-dashed border-[var(--border)]",
        "bg-[var(--surface)]",
        className
      )}
    >
      {icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-xl)] bg-[var(--surface-raised)] border border-[var(--border)] mb-5 text-[var(--text-muted)]">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-[var(--text-muted)] max-w-sm leading-relaxed">{description}</p>
      )}
      {action && (
        <div className="mt-6">
          <Button
            variant="primary"
            size="sm"
            onClick={action.onClick}
            {...(action.href ? { as: "a", href: action.href } : {})}
          >
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}

export { EmptyState };
