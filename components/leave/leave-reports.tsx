"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface LeaveReportsProps {
  className?: string;
}

export function LeaveReports({ className }: LeaveReportsProps) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-6", className)}>
      {/* 1. Leave Distribution by Type */}
      <Card className="glass border-[var(--border)]">
        <CardHeader>
          <CardTitle className="text-sm">Leave Distribution</CardTitle>
          <CardDescription>Breakdown by category</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-4 py-4">
          <div className="relative h-28 w-28">
            <svg viewBox="0 0 36 36" className="h-full w-full transform -rotate-90">
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--border-subtle)" strokeWidth="3" />
              {/* Paid: 60% */}
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--accent)" strokeWidth="3" strokeDasharray="60 100" strokeDashoffset="0" />
              {/* Sick: 30% */}
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--warning)" strokeWidth="3" strokeDasharray="30 100" strokeDashoffset="-60" />
              {/* Unpaid: 10% */}
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--danger)" strokeWidth="3" strokeDasharray="10 100" strokeDashoffset="-90" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[var(--text-primary)]">
              Ratio
            </div>
          </div>
          <div className="flex gap-4 text-xs font-semibold text-[var(--text-secondary)] mt-2">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" /> Paid</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[var(--warning)]" /> Sick</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[var(--danger)]" /> Unpaid</span>
          </div>
        </CardContent>
      </Card>

      {/* 2. Monthly Leave Trend (SVG Line) */}
      <Card className="glass border-[var(--border)]">
        <CardHeader>
          <CardTitle className="text-sm">Leave Allocation Trend</CardTitle>
          <CardDescription>Average leaves per month</CardDescription>
        </CardHeader>
        <CardContent className="py-4">
          <div className="h-28 w-full">
            <svg viewBox="0 0 100 30" className="h-full w-full overflow-visible" preserveAspectRatio="none">
              <path d="M 0 25 L 20 20 L 40 28 L 60 15 L 80 10 L 100 18" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="0" cy="25" r="1.2" fill="var(--accent)" />
              <circle cx="20" cy="20" r="1.2" fill="var(--accent)" />
              <circle cx="40" cy="28" r="1.2" fill="var(--accent)" />
              <circle cx="60" cy="15" r="1.2" fill="var(--accent)" />
              <circle cx="80" cy="10" r="1.2" fill="var(--accent)" />
              <circle cx="100" cy="18" r="1.2" fill="var(--accent)" />
            </svg>
          </div>
          <div className="flex justify-between text-[9px] text-[var(--text-muted)] font-bold mt-2">
            <span>Jan</span>
            <span>Mar</span>
            <span>May</span>
            <span>Jul</span>
            <span>Sep</span>
            <span>Nov</span>
          </div>
        </CardContent>
      </Card>

      {/* 3. Approval Rate (Gauge) */}
      <Card className="glass border-[var(--border)]">
        <CardHeader>
          <CardTitle className="text-sm">Approval Metrics</CardTitle>
          <CardDescription>Rate of accepted request batches</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-2 py-4">
          <div className="relative h-20 w-32 shrink-0 overflow-hidden">
            <svg viewBox="0 0 32 16" className="h-full w-full">
              {/* Semi circle background */}
              <path d="M 2 16 A 14 14 0 0 1 30 16" fill="none" stroke="var(--border-subtle)" strokeWidth="3" strokeLinecap="round" />
              {/* Filled slice (92%) */}
              <path d="M 2 16 A 14 14 0 0 1 27.6 10" fill="none" stroke="var(--success)" strokeWidth="3" strokeLinecap="round" strokeDasharray="38 44" />
            </svg>
            <div className="absolute bottom-0 inset-x-0 text-center">
              <span className="text-lg font-black text-[var(--text-primary)]">92%</span>
              <span className="text-[9px] text-[var(--text-muted)] font-semibold uppercase block">Approved</span>
            </div>
          </div>
          <p className="text-[10px] text-[var(--text-muted)] font-medium text-center mt-2">
            Average approval turnaround is 18.5 hours.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
