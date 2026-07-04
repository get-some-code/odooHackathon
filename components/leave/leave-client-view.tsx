"use client";

import * as React from "react";
import { useState, useEffect, useTransition, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { StatusChip } from "@/components/ui/status-chip";
import { cn } from "@/lib/utils";
import { ApplyLeaveSchema, type ApplyLeaveInput } from "@/lib/validators";
import {
  applyLeaveAction,
  getLeaveSummaryAction,
  getLeaveHistoryAction,
  type LeaveSummaryData,
  type LeaveHistoryItem,
} from "@/actions/leave";
import { getMonthlyAttendanceAction } from "@/actions/attendance";

export function LeaveClientView() {
  const [isPending, startTransition] = useTransition();

  // Summary Metrics
  const [summary, setSummary] = useState<LeaveSummaryData | null>(null);

  // Calendar parameters
  const [currentDate, setCurrentDate] = useState(new Date());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);

  // Selection states for direct calendar clicks
  const [selectedStartDate, setSelectedStartDate] = useState<string>("");
  const [selectedEndDate, setSelectedEndDate] = useState<string>("");

  // History table filters & list
  const [historyItems, setHistoryItems] = useState<LeaveHistoryItem[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // React Hook Form initialization for applying leaves
  const form = useForm<ApplyLeaveInput>({
    resolver: zodResolver(ApplyLeaveSchema),
    defaultValues: {
      leaveType: "PAID",
      startDate: "",
      endDate: "",
      halfDay: false,
      reason: "",
      fileUrl: "",
    },
  });

  // Sync calendar selected dates to form
  useEffect(() => {
    if (selectedStartDate) {
      form.setValue("startDate", selectedStartDate);
    }
  }, [selectedStartDate, form]);

  useEffect(() => {
    if (selectedEndDate) {
      form.setValue("endDate", selectedEndDate);
    }
  }, [selectedEndDate, form]);

  const fetchSummary = useCallback(async () => {
    const res = await getLeaveSummaryAction();
    if (res.success && res.data) {
      setSummary(res.data);
    }
  }, []);

  const fetchAttendance = useCallback(async () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const res = await getMonthlyAttendanceAction(year, month);
    if (res.success && res.data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setAttendanceRecords(res.data as any[]);
    }
  }, [currentDate]);

  const fetchHistory = useCallback(async () => {
    const res = await getLeaveHistoryAction({
      page: currentPage,
      limit: 5,
      status: statusFilter,
      leaveType: typeFilter,
    });
    if (res.success && res.data) {
      setHistoryItems(res.data.items);
      setHistoryTotal(res.data.total);
    }
  }, [currentPage, statusFilter, typeFilter]);

  useEffect(() => {
    fetchSummary();
    fetchAttendance();
  }, [currentDate, fetchSummary, fetchAttendance]);

  useEffect(() => {
    fetchHistory();
  }, [currentPage, statusFilter, typeFilter, fetchHistory]);

  const onSubmit = (values: ApplyLeaveInput) => {
    startTransition(async () => {
      const res = await applyLeaveAction(values);
      if (res.success) {
        toast.success("Leave request submitted successfully!");
        form.reset();
        setSelectedStartDate("");
        setSelectedEndDate("");
        fetchSummary();
        fetchAttendance();
        fetchHistory();
      } else {
        toast.error(res.error || "Failed to submit leave request.");
      }
    });
  };

  // Calendar helpers
  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);

  const calendarCells: Array<Date | null> = [];
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
  }

  // Click date on calendar to select start/end date
  const handleDateClick = (date: Date) => {
    const formatted = date.toISOString().split("T")[0];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) {
      toast.warning("Cannot apply for leave in the past.");
      return;
    }

    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      setSelectedStartDate(formatted);
      setSelectedEndDate("");
      toast.info(`Selected Start Date: ${formatted}`);
    } else {
      const start = new Date(selectedStartDate);
      if (date < start) {
        setSelectedStartDate(formatted);
        setSelectedEndDate("");
        toast.info(`Selected Start Date: ${formatted}`);
      } else {
        setSelectedEndDate(formatted);
        toast.info(`Selected End Date: ${formatted}`);
      }
    }
  };

  const formatAppliedDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Leave Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="glass border-[var(--border)] p-4 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-wider">
              Paid Leave Balance
            </p>
            <p className="text-2xl font-bold text-[var(--accent)] mt-2">
              {summary ? summary.paidRemaining : "—"}
            </p>
          </div>
          <p className="text-[9px] text-[var(--text-muted)] font-semibold mt-2">Days remaining</p>
        </Card>

        <Card className="glass border-[var(--border)] p-4 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-wider">
              Sick Leave Balance
            </p>
            <p className="text-2xl font-bold text-amber-500 mt-2">
              {summary ? summary.sickRemaining : "—"}
            </p>
          </div>
          <p className="text-[9px] text-[var(--text-muted)] font-semibold mt-2">Days remaining</p>
        </Card>

        <Card className="glass border-[var(--border)] p-4 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-wider">
              Unpaid Leave Used
            </p>
            <p className="text-2xl font-bold text-[var(--text-primary)] mt-2">
              {summary ? summary.unpaidUsed : "—"}
            </p>
          </div>
          <p className="text-[9px] text-[var(--text-muted)] font-semibold mt-2">Total days used</p>
        </Card>

        <Card className="glass border-[var(--border)] p-4 flex flex-col justify-between bg-amber-500/5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-wider">
                Pending Requests
              </p>
              <p className="text-xl font-bold text-amber-500 mt-2">
                {summary ? summary.pendingCount : "—"}
              </p>
            </div>
            <Clock className="h-4.5 w-4.5 text-amber-500 shrink-0" />
          </div>
        </Card>

        <Card className="glass border-[var(--border)] p-4 flex flex-col justify-between bg-emerald-500/5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-wider">
                Approved Requests
              </p>
              <p className="text-xl font-bold text-[var(--success)] mt-2">
                {summary ? summary.approvedCount : "—"}
              </p>
            </div>
            <CheckCircle2 className="h-4.5 w-4.5 text-[var(--success)] shrink-0" />
          </div>
        </Card>

        <Card className="glass border-[var(--border)] p-4 flex flex-col justify-between bg-red-500/5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-wider">
                Rejected Requests
              </p>
              <p className="text-xl font-bold text-[var(--danger)] mt-2">
                {summary ? summary.rejectedCount : "—"}
              </p>
            </div>
            <XCircle className="h-4.5 w-4.5 text-[var(--danger)] shrink-0" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. Interactive Monthly Calendar (Left 2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass border-[var(--border)]">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>Time-Off Calendar</CardTitle>
                <CardDescription>
                  Select dates directly to start applying. Grid shows shift logs & leaves.
                </CardDescription>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon-sm" onClick={handlePrevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon-sm" onClick={handleNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 border-b border-[var(--border-subtle)] pb-2">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {calendarCells.map((cell, idx) => {
                  if (!cell) {
                    return <div key={`empty-${idx}`} className="h-12 bg-transparent" />;
                  }

                  const dayNum = cell.getDate();
                  const cellFormatted = cell.toISOString().split("T")[0];
                  const isWeekend = cell.getDay() === 0 || cell.getDay() === 6;

                  // Selection highlighting
                  const isStart = cellFormatted === selectedStartDate;
                  const isEnd = cellFormatted === selectedEndDate;
                  const inRange =
                    selectedStartDate &&
                    selectedEndDate &&
                    cellFormatted > selectedStartDate &&
                    cellFormatted < selectedEndDate;

                  // Find attendance status
                  const record = attendanceRecords.find((r) => {
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
                      colorClass = "bg-[var(--accent-subtle)] border-indigo-400/50 text-[var(--accent)]";
                    } else if (record.status === "ABSENT") {
                      colorClass = "bg-[var(--danger-subtle)] border-[var(--danger-border)] text-[var(--danger)]";
                    }
                  } else if (isWeekend) {
                    colorClass = "bg-[var(--surface-raised)] border-[var(--border-subtle)] opacity-55";
                  }

                  return (
                    <div
                      key={`day-${dayNum}`}
                      onClick={() => handleDateClick(cell)}
                      className={cn(
                        "h-12 flex flex-col justify-between p-1 rounded-[var(--radius-lg)] border text-[10px] font-semibold transition-all cursor-pointer hover:scale-[1.03] select-none",
                        colorClass,
                        (isStart || isEnd) && "bg-[var(--accent)] text-white border-[var(--accent)] ring-1 ring-[var(--accent)]",
                        inRange && "bg-indigo-500/10 border-dashed border-[var(--accent)] text-[var(--accent)]"
                      )}
                    >
                      <span className={cn("font-bold", (isStart || isEnd) ? "text-white" : "text-[var(--text-secondary)]")}>
                        {dayNum}
                      </span>
                      {record && (
                        <span className="text-[8px] font-black uppercase truncate tracking-wider text-center block">
                          {record.status === "HALF_DAY" ? "Half" : record.status.toLowerCase()}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 3. Apply Leave Form (Right 1 column) */}
        <div>
          <Card className="glass border-[var(--border)] h-fit">
            <CardHeader>
              <CardTitle>Request Time-Off</CardTitle>
              <CardDescription>Submit leave request for approval.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">
                    Leave Type
                  </label>
                  <select
                    className="h-10 px-3 rounded-[var(--radius-lg)] border border-[var(--border)] text-sm bg-[var(--surface)] text-[var(--text-primary)]"
                    {...form.register("leaveType")}
                  >
                    <option value="PAID">Paid Leave</option>
                    <option value="SICK">Sick Leave</option>
                    <option value="UNPAID">Unpaid Leave</option>
                  </select>
                </div>

                <Input
                  label="Start Date"
                  type="date"
                  {...form.register("startDate")}
                  error={form.formState.errors.startDate?.message}
                />

                <Input
                  label="End Date"
                  type="date"
                  {...form.register("endDate")}
                  error={form.formState.errors.endDate?.message}
                />

                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id="halfDay"
                    className="h-4 w-4 rounded border-[var(--border)] bg-[var(--surface)] text-[var(--accent)] focus:ring-[var(--accent)]"
                    {...form.register("halfDay")}
                  />
                  <label htmlFor="halfDay" className="text-xs font-semibold text-[var(--text-secondary)] uppercase select-none cursor-pointer">
                    Apply as Half-Day
                  </label>
                </div>

                <Input
                  label="Reason"
                  placeholder="Details of leave..."
                  {...form.register("reason")}
                  error={form.formState.errors.reason?.message}
                />

                <Input
                  label="Attachment (Optional URL)"
                  placeholder="Link to medical document/receipt..."
                  {...form.register("fileUrl")}
                />

                <Button type="submit" variant="primary" className="w-full h-10 mt-2" loading={isPending}>
                  Apply Request
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 4. Leave History logs table */}
      <Card className="glass border-[var(--border)]">
        <CardHeader>
          <CardTitle>Request History Logs</CardTitle>
          <CardDescription>List of all applied leaves and current status sheets.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-end gap-3 p-3 bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] text-xs">
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
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 w-full">
              <label className="text-[10px] font-bold uppercase text-[var(--text-muted)]">
                Leave Type
              </label>
              <select
                className="h-9 px-3 rounded-[var(--radius-lg)] border border-[var(--border)] text-xs bg-[var(--surface)] text-[var(--text-primary)]"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="ALL">All Types</option>
                <option value="PAID">Paid Leave</option>
                <option value="SICK">Sick Leave</option>
                <option value="UNPAID">Unpaid Leave</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Leave Type</TableHead>
                <TableHead>Date Range</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Applied Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Admin Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyItems.length > 0 ? (
                historyItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-semibold">{item.leaveType}</TableCell>
                    <TableCell>
                      {formatAppliedDate(item.startDate)} — {formatAppliedDate(item.endDate)}
                    </TableCell>
                    <TableCell className="font-medium font-mono text-xs">
                      {item.duration} {item.duration === 1 ? "day" : "days"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={item.reason}>
                      {item.reason}
                    </TableCell>
                    <TableCell className="text-[11px] text-[var(--text-muted)]">
                      {formatAppliedDate(item.appliedDate)}
                    </TableCell>
                    <TableCell>
                      <StatusChip status={item.status.toLowerCase() as "present" | "absent" | "half_day" | "leave" | "pending"} />
                    </TableCell>
                    <TableCell className="text-xs text-[var(--text-secondary)] italic max-w-[150px] truncate" title={item.adminComment || ""}>
                      {item.adminComment || "—"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No history log entries found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {historyTotal > 5 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)] font-medium">
                Page {currentPage} of {Math.ceil(historyTotal / 5)}
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
                  disabled={currentPage >= Math.ceil(historyTotal / 5)}
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
