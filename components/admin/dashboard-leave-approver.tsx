"use client";

import * as React from "react";
import { useState, useTransition, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusChip } from "@/components/ui/status-chip";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2, Calendar, MessageSquare, CheckCircle2, XCircle } from "lucide-react";
import { updateLeaveStatusAction } from "@/actions/leave";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

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

interface PendingAction {
  id: string;
  action: "APPROVED" | "REJECTED";
  name: string;
}

export function DashboardLeaveApprover({
  initialLeaves,
  openLeavesCount,
}: DashboardLeaveApproverProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [leaves, setLeaves] = useState<LeaveItem[]>(initialLeaves);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Modal state
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [remarks, setRemarks] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea when modal opens
  useEffect(() => {
    if (pendingAction) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [pendingAction]);

  const openModal = (id: string, action: "APPROVED" | "REJECTED", name: string) => {
    setRemarks("");
    setPendingAction({ id, action, name });
  };

  const closeModal = () => {
    setPendingAction(null);
    setRemarks("");
  };

  const confirmAction = () => {
    if (!pendingAction) return;
    const { id, action } = pendingAction;
    closeModal();

    setProcessingId(id);
    startTransition(async () => {
      try {
        const res = await updateLeaveStatusAction(id, action, remarks || "");
        if (res.success) {
          toast.success(`Leave request ${action.toLowerCase()} successfully!`);
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

  const isApproving = pendingAction?.action === "APPROVED";

  return (
    <>
      {/* ── Remarks Modal ── */}
      {pendingAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="remarks-modal-title"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Panel */}
          <div className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">

            {/* Colour accent strip */}
            <div className={cn(
              "h-1 w-full",
              isApproving ? "bg-emerald-500" : "bg-rose-500"
            )} />

            <div className="p-6">
              {/* Icon + heading */}
              <div className="flex items-start gap-4 mb-5">
                <div className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                  isApproving
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "bg-rose-500/10 text-rose-500"
                )}>
                  {isApproving
                    ? <CheckCircle2 className="h-5 w-5" />
                    : <XCircle className="h-5 w-5" />
                  }
                </div>
                <div>
                  <h2
                    id="remarks-modal-title"
                    className="text-base font-bold text-[var(--text-primary)]"
                  >
                    {isApproving ? "Approve" : "Reject"} Leave Request
                  </h2>
                  <p className="text-sm text-[var(--text-muted)] mt-0.5">
                    For <span className="font-semibold text-[var(--text-secondary)]">{pendingAction.name}</span>
                  </p>
                </div>
              </div>

              {/* Remarks textarea */}
              <div className="space-y-2">
                <label
                  htmlFor="leave-remarks"
                  className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Remarks{" "}
                  <span className="normal-case font-normal text-[var(--text-muted)] tracking-normal">
                    (optional)
                  </span>
                </label>
                <textarea
                  id="leave-remarks"
                  ref={textareaRef}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) confirmAction();
                    if (e.key === "Escape") closeModal();
                  }}
                  placeholder={
                    isApproving
                      ? "Add an optional note for the employee..."
                      : "Provide a reason for rejection..."
                  }
                  rows={3}
                  className={cn(
                    "w-full resize-none rounded-xl px-3.5 py-3 text-sm",
                    "bg-[var(--surface-raised)] border border-[var(--border)]",
                    "text-[var(--text-primary)] placeholder-[var(--text-muted)]",
                    "outline-none transition-all",
                    "focus:ring-2",
                    isApproving
                      ? "focus:border-emerald-500 focus:ring-emerald-500/20"
                      : "focus:border-rose-500 focus:ring-rose-500/20"
                  )}
                />
                <p className="text-[10px] text-[var(--text-muted)]">
                  Press <kbd className="px-1 py-0.5 rounded bg-[var(--border)] text-[var(--text-secondary)] font-mono text-[10px]">Ctrl+Enter</kbd> to confirm · <kbd className="px-1 py-0.5 rounded bg-[var(--border)] text-[var(--text-secondary)] font-mono text-[10px]">Esc</kbd> to cancel
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  onClick={closeModal}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                    "border border-[var(--border)] text-[var(--text-secondary)]",
                    "hover:bg-[var(--surface-raised)] hover:text-[var(--text-primary)]",
                    "active:scale-[0.98]"
                  )}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction}
                  className={cn(
                    "px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all",
                    "shadow-lg active:scale-[0.98]",
                    isApproving
                      ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
                      : "bg-rose-600 hover:bg-rose-500 shadow-rose-600/20"
                  )}
                >
                  {isApproving ? "Approve Request" : "Reject Request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Leave list card ── */}
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
                            onClick={() => openModal(r.id, "APPROVED", r.name)}
                            className="h-8 w-8 p-0 rounded-full border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-400 active:scale-95 transition-all"
                            title="Approve Leave"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => openModal(r.id, "REJECTED", r.name)}
                            className="h-8 w-8 p-0 rounded-full border-rose-500/30 text-rose-500 hover:bg-rose-500/10 hover:text-rose-400 active:scale-95 transition-all"
                            title="Reject Leave"
                          >
                            <X className="h-4 w-4" />
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
    </>
  );
}
