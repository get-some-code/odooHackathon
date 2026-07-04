"use client";

import * as React from "react";
import { useState, useEffect, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Gift,
  Award,
  Users,
  AlertCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import {
  getDashboardExtendedWidgetsAction,
  type DashboardWidgetsData,
} from "@/actions/dashboard";
import Link from "next/link";

interface DashboardWidgetsProps {
  isAdmin?: boolean;
}

export function DashboardWidgets({ isAdmin = false }: DashboardWidgetsProps) {
  const [, startTransition] = useTransition();
  const [widgets, setWidgets] = useState<DashboardWidgetsData | null>(null);

  useEffect(() => {
    startTransition(async () => {
      const res = await getDashboardExtendedWidgetsAction();
      if (res.success && res.data) {
        setWidgets(res.data);
      }
    });
  }, []);

  if (!widgets) {
    return <div className="text-center text-[10px] text-[var(--text-muted)] py-4">Loading stats widgets...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 text-xs select-none">
      {/* 1. Upcoming Holidays */}
      <Card className="glass border-[var(--border)]">
        <CardContent className="p-5 space-y-3">
          <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-1.5 border-b border-[var(--border-subtle)] pb-2 text-[10px] uppercase tracking-wider">
            <Calendar className="h-4 w-4 text-[var(--accent)]" /> Upcoming Holidays
          </h3>
          <div className="space-y-2">
            {widgets.upcomingHolidays.length > 0 ? (
              widgets.upcomingHolidays.map((h) => (
                <div key={h.id} className="flex justify-between items-center bg-[var(--surface-raised)] p-2 rounded-lg border border-[var(--border-subtle)]">
                  <div>
                    <p className="font-bold text-[var(--text-primary)]">{h.title}</p>
                    <p className="text-[9px] text-[var(--text-muted)]">{h.category} {h.isOptional && "· Optional"}</p>
                  </div>
                  <span className="font-bold text-[var(--text-secondary)]">
                    {new Date(h.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-[10px] text-[var(--text-muted)] py-4 text-center">No upcoming holidays scheduled.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. Birthdays */}
      <Card className="glass border-[var(--border)]">
        <CardContent className="p-5 space-y-3">
          <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-1.5 border-b border-[var(--border-subtle)] pb-2 text-[10px] uppercase tracking-wider">
            <Gift className="h-4 w-4 text-pink-500" /> Birthdays This Month
          </h3>
          <div className="space-y-2">
            {widgets.birthdays.length > 0 ? (
              widgets.birthdays.map((b, idx) => (
                <div key={`bd-${idx}`} className="flex justify-between items-center bg-[var(--surface-raised)] p-2 rounded-lg border border-[var(--border-subtle)]">
                  <div>
                    <p className="font-bold text-[var(--text-primary)]">{b.name}</p>
                    <p className="text-[9px] text-[var(--text-muted)]">{b.department}</p>
                  </div>
                  <span className="text-[9px] font-bold text-pink-500 bg-pink-500/10 px-2 py-0.5 rounded-full">
                    {b.date}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-[10px] text-[var(--text-muted)] py-4 text-center">No birthdays this month.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 3. Work Anniversaries */}
      <Card className="glass border-[var(--border)]">
        <CardContent className="p-5 space-y-3">
          <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-1.5 border-b border-[var(--border-subtle)] pb-2 text-[10px] uppercase tracking-wider">
            <Award className="h-4 w-4 text-amber-500" /> Work Anniversaries
          </h3>
          <div className="space-y-2">
            {widgets.anniversaries.length > 0 ? (
              widgets.anniversaries.map((a, idx) => (
                <div key={`ann-${idx}`} className="flex justify-between items-center bg-[var(--surface-raised)] p-2 rounded-lg border border-[var(--border-subtle)]">
                  <div>
                    <p className="font-bold text-[var(--text-primary)]">{a.name}</p>
                    <p className="text-[9px] text-[var(--text-muted)]">{a.department} · Joining Date: {a.date}</p>
                  </div>
                  <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                    {a.years} {a.years === 1 ? "Year" : "Years"}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-[10px] text-[var(--text-muted)] py-4 text-center">No anniversaries this month.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 4. Recent Joinees */}
      <Card className="glass border-[var(--border)]">
        <CardContent className="p-5 space-y-3">
          <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-1.5 border-b border-[var(--border-subtle)] pb-2 text-[10px] uppercase tracking-wider">
            <Users className="h-4 w-4 text-emerald-500" /> Recent Joinees
          </h3>
          <div className="space-y-2">
            {widgets.recentJoinees.length > 0 ? (
              widgets.recentJoinees.map((j, idx) => (
                <div key={`rj-${idx}`} className="flex justify-between items-center bg-[var(--surface-raised)] p-2 rounded-lg border border-[var(--border-subtle)]">
                  <div>
                    <p className="font-bold text-[var(--text-primary)]">{j.name}</p>
                    <p className="text-[9px] text-[var(--text-muted)]">{j.designation} · {j.department}</p>
                  </div>
                  <span className="text-[9px] font-semibold text-[var(--text-muted)]">
                    {j.date}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-[10px] text-[var(--text-muted)] py-4 text-center">No new joinees recorded.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 5. Employees on Leave */}
      <Card className="glass border-[var(--border)]">
        <CardContent className="p-5 space-y-3">
          <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-1.5 border-b border-[var(--border-subtle)] pb-2 text-[10px] uppercase tracking-wider">
            <Clock className="h-4 w-4 text-indigo-500" /> Employees on Leave Today
          </h3>
          <div className="space-y-2">
            {widgets.employeesOnLeave.length > 0 ? (
              widgets.employeesOnLeave.map((l, idx) => (
                <div key={`eol-${idx}`} className="flex justify-between items-center bg-[var(--surface-raised)] p-2 rounded-lg border border-[var(--border-subtle)]">
                  <div>
                    <p className="font-bold text-[var(--text-primary)]">{l.name}</p>
                    <p className="text-[9px] text-[var(--text-muted)]">{l.department}</p>
                  </div>
                  <span className="text-[9px] text-[var(--text-muted)] font-mono">
                    {l.duration}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-[10px] text-[var(--text-muted)] py-4 text-center">No employees on leave today.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 6. Pending Verification Alerts (Admin Only) */}
      {isAdmin && (
        <Card className="glass border-[var(--border)]">
          <CardContent className="p-5 space-y-3 flex flex-col justify-between h-full">
            <div className="space-y-3">
              <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-1.5 border-b border-[var(--border-subtle)] pb-2 text-[10px] uppercase tracking-wider">
                <AlertCircle className="h-4 w-4 text-red-500" /> Pending Operations Alerts
              </h3>
              <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-xl flex items-start gap-2.5">
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[var(--text-primary)]">Document Verifications</p>
                  <p className="text-[9px] text-[var(--text-muted)] mt-0.5">
                    There are currently <span className="font-black text-red-500">{widgets.pendingDocsCount}</span> employee documents awaiting verification.
                  </p>
                </div>
              </div>
            </div>

            <Button variant="outline" size="xs" className="w-full mt-4" asChild>
              <Link href="/admin/documents">
                View Verification Board <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
