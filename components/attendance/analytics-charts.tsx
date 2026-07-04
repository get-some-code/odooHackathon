"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ChartProps {
  className?: string;
}

export function AnalyticsCharts({ className }: ChartProps) {
  // We will display 4 beautiful custom SVG charts
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-6", className)}>
      {/* 1. Present vs Leave Donut Chart */}
      <Card className="glass border-[var(--border)]">
        <CardHeader>
          <CardTitle className="text-base">Present vs Leave Ratio</CardTitle>
          <CardDescription>Overall breakdown for this month</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-center justify-center gap-8 py-6">
          <div className="relative h-32 w-32 shrink-0">
            <svg viewBox="0 0 36 36" className="h-full w-full transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="18"
                cy="18"
                r="15.915"
                fill="none"
                stroke="var(--border-subtle)"
                strokeWidth="3.5"
              />
              {/* Present slice (85%) */}
              <circle
                cx="18"
                cy="18"
                r="15.915"
                fill="none"
                stroke="var(--success)"
                strokeWidth="3.5"
                strokeDasharray="80 100"
                strokeDashoffset="0"
              />
              {/* Leave slice (15%) */}
              <circle
                cx="18"
                cy="18"
                r="15.915"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="3.5"
                strokeDasharray="15 100"
                strokeDashoffset="-80"
              />
              {/* Absent slice (5%) */}
              <circle
                cx="18"
                cy="18"
                r="15.915"
                fill="none"
                stroke="var(--danger)"
                strokeWidth="3.5"
                strokeDasharray="5 100"
                strokeDashoffset="-95"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-[var(--text-primary)]">80%</span>
              <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase">Rate</span>
            </div>
          </div>

          <div className="space-y-2 text-sm w-full max-w-[140px]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium text-[var(--text-secondary)]">
                <span className="h-2 w-2 rounded-full bg-[var(--success)]" /> Present
              </span>
              <span className="font-bold text-[var(--text-primary)]">80%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium text-[var(--text-secondary)]">
                <span className="h-2 w-2 rounded-full bg-[var(--accent)]" /> Leaves
              </span>
              <span className="font-bold text-[var(--text-primary)]">15%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium text-[var(--text-secondary)]">
                <span className="h-2 w-2 rounded-full bg-[var(--danger)]" /> Absent
              </span>
              <span className="font-bold text-[var(--text-primary)]">5%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Working Hours Trend Area Chart */}
      <Card className="glass border-[var(--border)]">
        <CardHeader>
          <CardTitle className="text-base">Working Hours Trend</CardTitle>
          <CardDescription>Average active hours over last 5 days</CardDescription>
        </CardHeader>
        <CardContent className="py-4">
          <div className="h-32 w-full relative">
            <svg viewBox="0 0 100 35" className="h-full w-full overflow-visible" preserveAspectRatio="none">
              {/* Gradients */}
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="0" y1="10" x2="100" y2="10" stroke="var(--border-subtle)" strokeWidth="0.25" strokeDasharray="1 1" />
              <line x1="0" y1="20" x2="100" y2="20" stroke="var(--border-subtle)" strokeWidth="0.25" strokeDasharray="1 1" />
              <line x1="0" y1="30" x2="100" y2="30" stroke="var(--border-subtle)" strokeWidth="0.25" strokeDasharray="1 1" />
              {/* Area path */}
              <path
                d="M 0 35 L 0 12 L 25 15 L 50 8 L 75 10 L 100 13 L 100 35 Z"
                fill="url(#areaGrad)"
              />
              {/* Line path */}
              <path
                d="M 0 12 L 25 15 L 50 8 L 75 10 L 100 13"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Circles */}
              <circle cx="0" cy="12" r="1.5" fill="var(--accent)" stroke="var(--surface)" strokeWidth="0.5" />
              <circle cx="25" cy="15" r="1.5" fill="var(--accent)" stroke="var(--surface)" strokeWidth="0.5" />
              <circle cx="50" cy="8" r="1.5" fill="var(--accent)" stroke="var(--surface)" strokeWidth="0.5" />
              <circle cx="75" cy="10" r="1.5" fill="var(--accent)" stroke="var(--surface)" strokeWidth="0.5" />
              <circle cx="100" cy="13" r="1.5" fill="var(--accent)" stroke="var(--surface)" strokeWidth="0.5" />
            </svg>
          </div>
          <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-semibold mt-3">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
          </div>
        </CardContent>
      </Card>

      {/* 3. Late Arrivals Bar Chart */}
      <Card className="glass border-[var(--border)]">
        <CardHeader>
          <CardTitle className="text-base">Late Check-ins count</CardTitle>
          <CardDescription>Incidents by department this month</CardDescription>
        </CardHeader>
        <CardContent className="py-4">
          <div className="h-32 flex items-end justify-between gap-4 px-2">
            {[
              { label: "Eng", value: 12, max: 15 },
              { label: "Des", value: 4, max: 15 },
              { label: "Mkt", value: 8, max: 15 },
              { label: "Ops", value: 10, max: 15 },
              { label: "HR", value: 2, max: 15 },
            ].map((bar, idx) => {
              const percent = (bar.value / bar.max) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[10px] font-bold text-[var(--text-primary)]">{bar.value}</span>
                  <div className="w-full bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-t-md h-20 relative overflow-hidden">
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-amber-500 to-amber-600 rounded-t-sm transition-all duration-500"
                      style={{ height: `${percent}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)] font-semibold">{bar.label}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 4. Attendance Activity Heatmap */}
      <Card className="glass border-[var(--border)]">
        <CardHeader>
          <CardTitle className="text-base">Monthly Activity Heatmap</CardTitle>
          <CardDescription>Daily check-in distribution grid</CardDescription>
        </CardHeader>
        <CardContent className="py-4 flex justify-center">
          <div className="grid grid-cols-7 gap-1.5 w-fit">
            {/* Render 28 squares representing calendar days with random shading of present rate */}
            {Array.from({ length: 28 }).map((_, idx) => {
              // Shading categories
              const shades = [
                "bg-[var(--success-subtle)] opacity-40",
                "bg-[var(--success-subtle)] opacity-70",
                "bg-[var(--success)] opacity-90",
                "bg-[var(--success)]",
              ];
              const shadeClass = shades[idx % 4];

              return (
                <div
                  key={idx}
                  className={cn("h-6 w-6 rounded-md hover:scale-110 transition-transform cursor-pointer", shadeClass)}
                  title={`Day ${idx + 1}: Present`}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
