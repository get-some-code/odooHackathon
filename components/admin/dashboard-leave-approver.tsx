"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusChip } from "@/components/ui/status-chip";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2, Calendar } from "lucide-react";
import { updateLeaveStatusAction } from "@/actions/leave";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface LeaveItem {
  id: string;
  name: string;
  type: string;
  days: number;
  status: string;
}

interface DashboardLeaveApproverProps {
  initialLeaves: LeaveItem[];
  openLeavesCount: number;
}

export function DashboardLeaveApprover({
  initialLeaves,
  openLeavesCount,
}: DashboardLeaveApproverProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [leaves, setLeaves] = useState<LeaveItem[]>(initialLeaves);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAction = async (id: string, action: "APPROVED" | "REJECTED") => {
    const comment = window.prompt(`Enter remarks for this ${action.toLowerCase()} request (optional):`);
    if (comment === null) return; // cancelled

    setProcessingId(id);
    startTransition(async () => {
      try {
        const res = await updateLeaveStatusAction(id, action, comment || "");
        if (res.success) {
          toast.success(`Leave request was successfully ${action.toLowerCase()}!`);
          // Update local state status
          setLeaves((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, status: action.toLowerCase() } : item
            )
          );
          router.refresh();
        } else {
          toast.error(res.error || "Failed to update leave request");
        }
      } catch (err) {
        console.error(err);
        toast.error("An unexpected error occurred.");
      } finally {
        setProcessingId(null);
      }
    });
  };

  return (
    <Card className="glass border-[var(--border)] h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-lg font-bold">Leave Requests Approvals</CardTitle>
          <p className="text-xs text-[var(--text-muted)]">Recent time-off requests needing review</p>
        </div>
        <Badge variant={openLeavesCount > 0 ? "warning" : "success"}>
          {openLeavesCount} pending
        </Badge>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto max-h-[380px] pr-1">
        {leaves.length > 0 ? (
          <div className="space-y-3.5">
            {leaves.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--border)] hover:bg-[var(--surface-raised-hover)] transition-all"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-[var(--text-primary)] truncate">
                      {r.name}
                    </p>
                    <span className="text-[10px] font-semibold bg-[var(--accent-subtle)] text-[var(--accent)] px-2 py-0.5 rounded-full uppercase">
                      {r.type}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 font-medium">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    {r.days} {r.days === 1 ? "day" : "days"} requested
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {r.status === "pending" ? (
                    processingId === r.id && isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin text-[var(--text-muted)]" />
                    ) : (
                      <>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handleAction(r.id, "APPROVED")}
                          className="h-8 w-8 p-0 rounded-full border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-400 active:scale-95 transition-all"
                          title="Approve Leave"
                        >
                          <Check className="h-4.5 w-4.5" />
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handleAction(r.id, "REJECTED")}
                          className="h-8 w-8 p-0 rounded-full border-rose-500/30 text-rose-500 hover:bg-rose-500/10 hover:text-rose-405 active:scale-95 transition-all"
                          title="Reject Leave"
                        >
                          <X className="h-4.5 w-4.5" />
                        </Button>
                      </>
                    )
                  ) : (
                    <StatusChip status={r.status as "pending" | "approved" | "rejected"} />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-32 flex flex-col items-center justify-center text-center p-4">
            <p className="text-xs text-[var(--text-muted)] font-semibold">No recent leave requests found.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
