"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  /** Pass a pre-rendered icon element, e.g. <CalendarCheck className="h-5 w-5" /> */
  icon: React.ReactNode;
  trend?: {
    value: number;
    label?: string;
  };
  iconColor?: "indigo" | "emerald" | "amber" | "rose" | "violet";
  className?: string;
}

const iconBg = {
  indigo:  "bg-[var(--accent-subtle)]",
  emerald: "bg-[var(--success-subtle)]",
  amber:   "bg-[var(--warning-subtle)]",
  rose:    "bg-[var(--danger-subtle)]",
  violet:  "bg-purple-500/10",
};

const iconText = {
  indigo:  "[&_svg]:text-[var(--accent)]",
  emerald: "[&_svg]:text-[var(--success)]",
  amber:   "[&_svg]:text-[var(--warning)]",
  rose:    "[&_svg]:text-[var(--danger)]",
  violet:  "[&_svg]:text-purple-400",
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  iconColor = "indigo",
  className,
}: StatCardProps) {
  const isPositive = (trend?.value ?? 0) >= 0;

  return (
    <motion.div
      role="region"
      aria-label={title}
      className={cn(
        "rounded-[var(--radius-xl)] bg-[var(--surface)] border border-[var(--border)]",
        "p-5 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]",
        "transition-shadow duration-200 cursor-default",
        className
      )}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, borderColor: "var(--accent)" }}
      whileTap={{ scale: 0.98, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
            {title}
          </p>
          <motion.p
            className="text-2xl font-bold text-[var(--text-primary)] leading-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            {value}
          </motion.p>
          {subtitle && (
            <p className="text-xs text-[var(--text-muted)] mt-1.5 truncate">{subtitle}</p>
          )}
        </div>

        {/* Icon box — color applied via CSS child selector */}
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-xl)]",
            "[&_svg]:h-5 [&_svg]:w-5",
            iconBg[iconColor],
            iconText[iconColor]
          )}
        >
          {icon}
        </div>
      </div>

      {trend !== undefined && (
        <div className="mt-4 flex items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center text-xs font-semibold px-1.5 py-0.5 rounded-full",
              isPositive
                ? "bg-[var(--success-subtle)] text-[var(--success)]"
                : "bg-[var(--danger-subtle)] text-[var(--danger)]"
            )}
          >
            {isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            {trend.label ?? "vs last month"}
          </span>
        </div>
      )}
    </motion.div>
  );
}
