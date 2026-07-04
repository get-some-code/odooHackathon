import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border transition-colors",
  {
    variants: {
      variant: {
        default:     "bg-[var(--surface-raised)] text-[var(--text-secondary)] border-[var(--border)]",
        primary:     "bg-[var(--accent-subtle)] text-[var(--accent)] border-[var(--accent-subtle-border)]",
        success:     "bg-[var(--success-subtle)] text-[var(--success)] border-[var(--success-border)]",
        warning:     "bg-[var(--warning-subtle)] text-[var(--warning)] border-[var(--warning-border)]",
        danger:      "bg-[var(--danger-subtle)] text-[var(--danger)] border-[var(--danger-border)]",
        outline:     "bg-transparent text-[var(--text-secondary)] border-[var(--border)]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  const dotColors: Record<string, string> = {
    default: "bg-[var(--text-muted)]",
    primary: "bg-[var(--accent)]",
    success: "bg-[var(--success)]",
    warning: "bg-[var(--warning)]",
    danger:  "bg-[var(--danger)]",
    outline: "bg-[var(--text-muted)]",
  };

  return (
    <span className={cn(badgeVariants({ variant, className }))} {...props}>
      {dot && (
        <span
          className={cn(
            "inline-block h-1.5 w-1.5 rounded-full shrink-0",
            dotColors[variant ?? "default"]
          )}
        />
      )}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
