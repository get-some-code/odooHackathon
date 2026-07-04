"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { StatusChip } from "@/components/ui/status-chip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import {
  checkInAction,
  checkOutAction,
  getTodayAttendanceStatusAction,
  getMonthlyAttendanceAction,
  getAttendanceHistoryAction,
  type AttendanceHistoryItem,
} from "@/actions/attendance";

export function AttendanceClientView() {
  const [time, setTime] = useState<Date | null>(null);
  const [isPending, startTransition] = useTransition();

  // Current day status
  const [todayRecord, setTodayRecord] = useState<{ checkIn: Date | string | null; checkOut: Date | string | null; status: string } | null>(null);

  // Calendar parameters
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarRecords, setCalendarRecords] = useState<Array<{ date: Date | string; status: string }>>([]);

  // History table filters & results
  const [historyItems, setHistoryItems] = useState<AttendanceHistoryItem[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Update clock every second
  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch today status, calendar logs, and history list
  const fetchTodayStatus = useCallback(async () => {
    const res = await getTodayAttendanceStatusAction();
    if (res.success && res.data) {
      setTodayRecord(res.data as { checkIn: Date | string | null; checkOut: Date | string | null; status: string });
    } else {
      setTodayRecord(null);
    }
  }, []);

  const fetchCalendarRecords = useCallback(async () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const res = await getMonthlyAttendanceAction(year, month);
    if (res.success && res.data) {
      setCalendarRecords(res.data as Array<{ date: Date | string; status: string }>);
    }
  }, [currentDate]);

  const fetchHistoryList = useCallback(async () => {
    const res = await getAttendanceHistoryAction({
      page: currentPage,
      limit: 7,
      status: statusFilter,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
    if (res.success && res.data) {
      setHistoryItems(res.data.items);
      setHistoryTotal(res.data.total);
    }
  }, [currentPage, statusFilter, startDate, endDate]);

  useEffect(() => {
    fetchTodayStatus();
    fetchCalendarRecords();
  }, [currentDate, fetchTodayStatus, fetchCalendarRecords]);

  useEffect(() => {
    fetchHistoryList();
  }, [fetchHistoryList]);

  const handleCheckIn = () => {
    startTransition(async () => {
      const res = await checkInAction();
      if (res.success) {
        toast.success("Successfully checked in for today!");
        fetchTodayStatus();
        fetchCalendarRecords();
        fetchHistoryList();
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
        fetchCalendarRecords();
        fetchHistoryList();
      } else {
        toast.error(res.error || "Failed to check out");
      }
    });
  };

  // Calendar rendering helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay(); // 0 is Sunday, 1 is Monday...
  };

  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);

  // Pad start of month
  const calendarCells = [];
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
  }

  const formatClockTime = (date: Date) => {
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const formatDateLabel = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatLogTime = (date: Date | string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Live Check In / Check Out Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass border-[var(--border)] md:col-span-1 flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-[var(--accent)] animate-pulse" /> Daily Punch
            </CardTitle>
            <CardDescription>Record check-in and check-out logs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4 bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)]">
              <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                Current local time
              </p>
              <p className="text-2xl font-bold text-[var(--text-primary)] mt-1 select-none font-mono">
                {time ? formatClockTime(time) : "00:00:00 AM"}
              </p>
              <p className="text-xs text-[var(--text-muted)] font-semibold mt-1">
                {time ? time.toDateString() : "—"}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {!todayRecord?.checkIn ? (
                <Button
                  onClick={handleCheckIn}
                  variant="primary"
                  className="w-full h-11"
                  loading={isPending}
                >
                  Punch In / Check In
                </Button>
              ) : !todayRecord?.checkOut ? (
                <Button
                  onClick={handleCheckOut}
                  variant="destructive"
                  className="w-full h-11"
                  loading={isPending}
                >
                  Punch Out / Check Out
                </Button>
              ) : (
                <div className="p-3 text-center rounded-[var(--radius-lg)] bg-[var(--success-subtle)] border border-[var(--success-border)] text-[var(--success)] font-semibold text-xs flex items-center justify-center gap-1.5">
                  <AlertCircle className="h-4 w-4" /> Finished for today.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 2. Today's status panel */}
        <Card className="glass border-[var(--border)] md:col-span-2">
          <CardHeader>
            <CardTitle>Today&apos;s Status</CardTitle>
            <CardDescription>Status summary for your shift logs today.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)]">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase block">
                Check In
              </span>
              <span className="text-lg font-bold text-[var(--text-primary)] mt-1.5 block">
                {formatLogTime(todayRecord?.checkIn ?? null)}
              </span>
            </div>
            <div className="p-4 bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)]">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase block">
                Check Out
              </span>
              <span className="text-lg font-bold text-[var(--text-primary)] mt-1.5 block">
                {formatLogTime(todayRecord?.checkOut ?? null)}
              </span>
            </div>
            <div className="p-4 bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)]">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase block">
                Status
              </span>
              <span className="inline-block mt-2">
                <StatusChip status={(todayRecord?.status || "PENDING").toLowerCase() as "present" | "absent" | "half_day" | "leave" | "pending"} />
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Monthly Calendar card */}
      <Card className="glass border-[var(--border)]">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Attendance Calendar</CardTitle>
            <CardDescription>Visual calendar log for {currentDate.toLocaleString("en-IN", { month: "long", year: "numeric" })}</CardDescription>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="icon-sm" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon-sm" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 border-b border-[var(--border-subtle)] pb-2">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarCells.map((cell, idx) => {
              if (!cell) {
                return <div key={`empty-${idx}`} className="h-14 bg-transparent" />;
              }

              const dayNum = cell.getDate();
              const isToday = cell.toDateString() === new Date().toDateString();

              // Find if cell date has matching attendance status
              const record = calendarRecords.find((r) => {
                const rDate = new Date(r.date);
                return rDate.toDateString() === cell.toDateString();
              });

              let colorClass = "bg-[var(--surface-raised)] border-[var(--border-subtle)]";
              if (record) {
                if (record.status === "PRESENT") {
                  colorClass = "bg-[var(--success-subtle)] border-[var(--success-border)] text-[var(--success)]";
                } else if (record.status === "HALF_DAY") {
                  colorClass = "bg-[var(--warning-subtle)] border-[var(--warning-border)] text-[var(--warning)]";
                } else if (record.status === "LEAVE") {
                  colorClass = "bg-[var(--accent-subtle)] border-[var(--accent-subtle-border)] text-[var(--accent)]";
                } else if (record.status === "ABSENT") {
                  colorClass = "bg-[var(--danger-subtle)] border-[var(--danger-border)] text-[var(--danger)]";
                }
              }

              return (
                <div
                  key={`day-${dayNum}`}
                  className={cn(
                    "h-14 flex flex-col justify-between p-1.5 rounded-[var(--radius-lg)] border transition-all text-xs font-semibold",
                    colorClass,
                    isToday && "ring-2 ring-[var(--accent)] ring-offset-2",
                    "hover:scale-[1.02] cursor-pointer"
                  )}
                >
                  <span className="text-[10px] text-[var(--text-secondary)] font-bold">{dayNum}</span>
                  {record && (
                    <span className="text-[9px] font-bold uppercase truncate tracking-wider block">
                      {record.status === "HALF_DAY" ? "Half" : record.status.toLowerCase()}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 4. History logs table */}
      <Card className="glass border-[var(--border)]">
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
          <CardDescription>Search and filter your historical punch records.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-end gap-3 p-3 bg-[var(--surface-raised)] rounded-[var(--radius-xl)] border border-[var(--border-subtle)]">
            <div className="flex flex-col gap-1 w-full">
              <label className="text-[10px] font-bold uppercase text-[var(--text-muted)]">
                Start Date
              </label>
              <input
                type="date"
                className="h-9 px-3 rounded-[var(--radius-lg)] border border-[var(--border)] text-xs bg-[var(--surface)] text-[var(--text-primary)]"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="flex flex-col gap-1 w-full">
              <label className="text-[10px] font-bold uppercase text-[var(--text-muted)]">
                End Date
              </label>
              <input
                type="date"
                className="h-9 px-3 rounded-[var(--radius-lg)] border border-[var(--border)] text-xs bg-[var(--surface)] text-[var(--text-primary)]"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="flex flex-col gap-1 w-full">
              <label className="text-[10px] font-bold uppercase text-[var(--text-muted)]">
                Status
              </label>
              <select
                className="h-9 px-3 rounded-[var(--radius-lg)] border border-[var(--border)] text-xs bg-[var(--surface)] text-[var(--text-primary)]"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="PRESENT">Present</option>
                <option value="HALF_DAY">Half Day</option>
                <option value="ABSENT">Absent</option>
                <option value="LEAVE">Leave</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Hours Logged</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyItems.length > 0 ? (
                historyItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-semibold">{formatDateLabel(item.date)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {formatLogTime(item.checkIn)}
                        {item.isLate && (
                          <Badge variant="warning" className="text-[9px] px-1 py-0 h-4">
                            Late
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatLogTime(item.checkOut)}</TableCell>
                    <TableCell className="font-medium font-mono text-xs">
                      {item.workingHours}
                    </TableCell>
                    <TableCell>
                      <StatusChip status={item.status.toLowerCase() as "present" | "absent" | "half_day" | "leave" | "pending"} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No history logs found for matching filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {historyTotal > 7 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-[var(--text-muted)] font-medium">
                Page {currentPage} of {Math.ceil(historyTotal / 7)}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="xs"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  disabled={currentPage >= Math.ceil(historyTotal / 7)}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
