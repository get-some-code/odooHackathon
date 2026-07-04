"use client";

import * as React from "react";
import { useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Database, RefreshCw } from "lucide-react";
import { seedDemoDataAction, resetDemoDataAction } from "@/actions/demo";

export function DemoPanel() {
  const [isPendingSeed, startSeedTransition] = useTransition();
  const [isPendingReset, startResetTransition] = useTransition();

  const handleSeed = () => {
    startSeedTransition(async () => {
      const res = await seedDemoDataAction();
      if (res.success) {
        toast.success("Demo HR data seeded successfully! Try refreshing dashboard views.");
        window.location.reload();
      } else {
        toast.error(res.error || "Failed to seed demo data");
      }
    });
  };

  const handleReset = () => {
    if (!window.confirm("Are you sure you want to delete all seeded employee files? This action is permanent!")) return;
    startResetTransition(async () => {
      const res = await resetDemoDataAction();
      if (res.success) {
        toast.success("Demo database reset successfully! All mock directory entries cleared.");
        window.location.reload();
      } else {
        toast.error(res.error || "Failed to reset demo data");
      }
    });
  };

  return (
    <Card className="glass border-[var(--accent-subtle-border)] bg-[var(--accent-subtle)] text-[var(--text-primary)] select-none">
      <CardContent className="p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex gap-3">
          <div className="h-10 w-10 shrink-0 rounded-[var(--radius-xl)] bg-[var(--accent)] text-white flex items-center justify-center shadow-sm">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold flex items-center gap-1.5 text-[var(--accent)]">
              Interactive Demo Sandbox Mode <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[var(--accent)] text-white">Active</span>
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-relaxed max-w-xl">
              Quickly seed realistic employee directories, 14-day attendance logs, leave balances, pending verification documents, and payroll structures to preview full analytics dashboards.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
          <Button
            variant="outline"
            className="text-[var(--danger)] hover:bg-[var(--danger-subtle)] border-[var(--danger-border)] hover:text-[var(--danger)] h-9 text-xs"
            disabled={isPendingSeed || isPendingReset}
            onClick={handleReset}
          >
            {isPendingReset ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Resetting...
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Reset Sandbox
              </>
            )}
          </Button>

          <Button
            variant="primary"
            className="h-9 text-xs"
            disabled={isPendingSeed || isPendingReset}
            onClick={handleSeed}
          >
            {isPendingSeed ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Seeding...
              </>
            ) : (
              <>
                <Database className="h-3.5 w-3.5 mr-1.5" />
                Seed Demo Data
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
