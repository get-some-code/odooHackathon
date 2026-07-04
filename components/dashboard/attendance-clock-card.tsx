"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Clock, Play, Square, Loader2 } from "lucide-react";
import {
  checkInAction,
  checkOutAction,
  getTodayAttendanceStatusAction,
} from "@/actions/attendance";

export function AttendanceClockCard() {
  const [time, setTime] = useState<Date | null>(null);
  const [isPending, startTransition] = useTransition();
  const [todayRecord, setTodayRecord] = useState<{
    checkIn: Date | string | null;
    checkOut: Date | string | null;
    status: string;
  } | null>(null);

  // Update clock every second
  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchTodayStatus = useCallback(async () => {
    const res = await getTodayAttendanceStatusAction();
    if (res.success && res.data) {
      setTodayRecord(res.data as { checkIn: Date | string | null; checkOut: Date | string | null; status: string });
    } else {
      setTodayRecord(null);
    }
  }, []);

  useEffect(() => {
    fetchTodayStatus();
  }, [fetchTodayStatus]);

  const handleCheckIn = () => {
    startTransition(async () => {
      const res = await checkInAction();
      if (res.success) {
        toast.success("Successfully checked in for today!");
        fetchTodayStatus();
      } else {
        toast.error(res.error || "Failed to check in");
      }
    });
  };

  const handleCheckOut = () => {
    const confirmOut = window.confirm("Are you sure you want to check out?");
    if (!confirmOut) return;

    startTransition(async () => {
      const res = await checkOutAction();
      if (res.success) {
        toast.success("Successfully checked out for today!");
        fetchTodayStatus();
      } else {
        toast.error(res.error || "Failed to check out");
      }
    });
  };

  const formattedTime = time
    ? time.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })
    : "--:--:--";

  const formattedDate = time
    ? time.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "----------";

  const isCheckedIn = !!todayRecord?.checkIn;
  const isCheckedOut = !!todayRecord?.checkOut;

  return (
    <Card className="glass border-[var(--border)] h-full flex flex-col justify-between overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-[var(--accent)]" /> Time Tracker
        </CardTitle>
        <CardDescription className="text-[10px]">Track your working hours today</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col items-center justify-center py-6 text-center space-y-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-[var(--text-primary)] font-mono">
            {formattedTime}
          </h2>
          <p className="text-xs font-semibold text-[var(--text-muted)] mt-1">
            {formattedDate}
          </p>
        </div>

        <div className="w-full pt-2">
          {isCheckedOut ? (
            <div className="p-3 bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-xl text-center">
              <p className="text-xs font-bold text-[var(--text-secondary)]">Workday Completed</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">See you tomorrow!</p>
            </div>
          ) : isCheckedIn ? (
            <Button
              variant="destructive"
              className="w-full flex items-center justify-center gap-2 rounded-xl h-10 shadow-lg active:scale-[0.98] transition-all"
              onClick={handleCheckOut}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Square className="h-4 w-4 fill-white" /> Clock Out
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="primary"
              className="w-full flex items-center justify-center gap-2 rounded-xl h-10 shadow-lg active:scale-[0.98] transition-all"
              onClick={handleCheckIn}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Play className="h-4 w-4 fill-[var(--accent-fg)]" /> Clock In
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
