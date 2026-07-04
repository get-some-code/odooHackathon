import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusChipVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
  {
    variants: {
      status: {
        // Attendance
        present:   "bg-[var(--success-subtle)] text-[var(--success)] border border-[var(--success-border)]",
        absent:    "bg-[var(--danger-subtle)]  text-[var(--danger)]  border border-[var(--danger-border)]",
        half_day:  "bg-[var(--warning-subtle)] text-[var(--warning)] border border-[var(--warning-border)]",
        leave:     "bg-[var(--accent-subtle)]  text-[var(--accent)]  border border-[var(--accent-subtle-border)]",
        // Leave
        pending:   "bg-[var(--warning-subtle)] text-[var(--warning)] border border-[var(--warning-border)]",
        approved:  "bg-[var(--success-subtle)] text-[var(--success)] border border-[var(--success-border)]",
        rejected:  "bg-[var(--danger-subtle)]  text-[var(--danger)]  border border-[var(--danger-border)]",
        // Generic
        active:    "bg-[var(--success-subtle)] text-[var(--success)] border border-[var(--success-border)]",
        inactive:  "bg-[var(--surface-raised)] text-[var(--text-muted)] border border-[var(--border)]",
        // Role
        admin:     "bg-[var(--accent-subtle)]  text-[var(--accent)]  border border-[var(--accent-subtle-border)]",
        employee:  "bg-[var(--surface-raised)] text-[var(--text-secondary)] border border-[var(--border)]",
      },
    },
    defaultVariants: { status: "inactive" },
  }
);

const statusDotColors: Record<string, string> = {
  present: "bg-[var(--success)]",
  absent: "bg-[var(--danger)]",
  half_day: "bg-[var(--warning)]",
  leave: "bg-[var(--accent)]",
  pending: "bg-[var(--warning)]",
  approved: "bg-[var(--success)]",
  rejected: "bg-[var(--danger)]",
  active: "bg-[var(--success)]",
  inactive: "bg-[var(--text-muted)]",
  admin: "bg-[var(--accent)]",
  employee: "bg-[var(--text-muted)]",
};

const statusLabels: Record<string, string> = {
  present: "Present", absent: "Absent", half_day: "Half Day", leave: "On Leave",
  pending: "Pending", approved: "Approved", rejected: "Rejected",
  active: "Active", inactive: "Inactive", admin: "Admin", employee: "Employee",
};

interface StatusChipProps extends VariantProps<typeof statusChipVariants> {
  className?: string;
  label?: string;
  showDot?: boolean;
}

function StatusChip({ status, label, showDot = true, className }: StatusChipProps) {
  const key = status ?? "inactive";
  return (
    <span className={cn(statusChipVariants({ status, className }))}>
      {showDot && (
        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", statusDotColors[key])} />
      )}
      {label ?? statusLabels[key] ?? key}
    </span>
  );
}

export { StatusChip, statusChipVariants };
