"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { StatusChip } from "@/components/ui/status-chip";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  FileSpreadsheet,
  Search,
  Clock,
  Users,
  CalendarCheck,
  FileText,
} from "lucide-react";
import { getAdminAttendanceLogsAction, type AdminAttendanceLog } from "@/actions/attendance";
import { AnalyticsCharts } from "./analytics-charts";
import { cn } from "@/lib/utils";

interface AdminAttendanceViewProps {
  initialCounts: {
    totalEmployees: number;
    presentToday: number;
    openLeaves: number;
    attendanceRate: number;
  };
}

export function AdminAttendanceView({ initialCounts }: AdminAttendanceViewProps) {
  const [logs, setLogs] = useState<AdminAttendanceLog[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter States
  const [searchText, setSearchText] = useState("");
  const [department, setDepartment] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchLogs = useCallback(async () => {
    const res = await getAdminAttendanceLogsAction({
      search: searchText || undefined,
      department: department || undefined,
      status: statusFilter || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      page: currentPage,
      limit: 10,
    });

    if (res.success && res.data) {
      setLogs(res.data.items);
      setTotalLogs(res.data.total);
    } else {
      toast.error(res.error || "Failed to load attendance logs");
    }
  }, [searchText, department, statusFilter, startDate, endDate, currentPage]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchLogs();
  };

  const handleResetFilters = () => {
    setSearchText("");
    setDepartment("ALL");
    setStatusFilter("ALL");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  // Export CSV
  const handleExportCSV = async () => {
    const toastId = toast.loading("Generating CSV export...");
    try {
      // Query everything (limit high for CSV export)
      const res = await getAdminAttendanceLogsAction({
        search: searchText || undefined,
        department: department || undefined,
        status: statusFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page: 1,
        limit: 1000,
      });

      if (!res.success || !res.data) {
        throw new Error(res.error || "Failed to fetch records for export");
      }

      const exportLogs = res.data.items;

      // Build CSV String
      const headers = ["Date", "Employee ID", "Employee Name", "Department", "Check In", "Check Out", "Logged Hours", "Status", "Late Check-In"];
      const csvRows = [headers.join(",")];

      exportLogs.forEach((log) => {
        const row = [
          `"${new Date(log.date).toLocaleDateString()}"`,
          `"${log.employeeId}"`,
          `"${log.employeeName}"`,
          `"${log.department}"`,
          `"${log.checkIn ? new Date(log.checkIn).toLocaleTimeString() : "—"}"`,
          `"${log.checkOut ? new Date(log.checkOut).toLocaleTimeString() : "—"}"`,
          `"${log.workingHours}"`,
          `"${log.status}"`,
          `"${log.isLate ? "YES" : "NO"}"`,
        ];
        csvRows.push(row.join(","));
      });

      const csvString = csvRows.join("\n");
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `attendance_report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("CSV export downloaded successfully!", { id: toastId });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to generate CSV export";
      toast.error(errMsg, { id: toastId });
    }
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
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Headcount"
          value={initialCounts.totalEmployees}
          subtitle="Employees registered"
          icon={<Users />}
          iconColor="indigo"
        />
        <StatCard
          title="Clocked In Today"
          value={initialCounts.presentToday}
          subtitle={`${initialCounts.attendanceRate}% Present rate`}
          icon={<CalendarCheck />}
          iconColor="emerald"
        />
        <StatCard
          title="On Approved Leave"
          value={initialCounts.openLeaves} // Count of leave/out of office
          subtitle="Out of office today"
          icon={<FileText />}
          iconColor="amber"
        />
        <StatCard
          title="Late Check-ins"
          value={logs.filter((l) => l.isLate).length}
          subtitle="In current list"
          icon={<Clock />}
          iconColor="rose"
        />
      </div>

      {/* Analytics Charts */}
      <AnalyticsCharts />

      {/* Database Filters & Logs Grid */}
      <Card className="glass border-[var(--border)]">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Attendance Log Registry</CardTitle>
            <CardDescription>Organization-wide active check-in logs and states.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <FileSpreadsheet className="h-4 w-4 mr-1.5" /> Export CSV
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filter Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-3 bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)]"
          >
            <div className="flex flex-col gap-1 w-full">
              <label className="text-[10px] font-bold uppercase text-[var(--text-muted)]">
                Search Employee
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Name or Emp ID..."
                  className="w-full h-9 pl-9 pr-3 rounded-[var(--radius-lg)] border border-[var(--border)] text-xs bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1 w-full">
              <label className="text-[10px] font-bold uppercase text-[var(--text-muted)]">
                Department
              </label>
              <select
                className="h-9 px-3 rounded-[var(--radius-lg)] border border-[var(--border)] text-xs bg-[var(--surface)] text-[var(--text-primary)]"
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="ALL">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
                <option value="Operations">Operations</option>
                <option value="HR">HR</option>
              </select>
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

            <div className="flex flex-col gap-1 w-full">
              <label className="text-[10px] font-bold uppercase text-[var(--text-muted)]">
                Date Range
              </label>
              <div className="flex gap-1.5">
                <input
                  type="date"
                  className="w-1/2 h-9 px-2 rounded-[var(--radius-lg)] border border-[var(--border)] text-[10px] bg-[var(--surface)] text-[var(--text-primary)]"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                />
                <input
                  type="date"
                  className="w-1/2 h-9 px-2 rounded-[var(--radius-lg)] border border-[var(--border)] text-[10px] bg-[var(--surface)] text-[var(--text-primary)]"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            <div className="flex items-end gap-1.5 w-full">
              <Button type="submit" variant="primary" size="sm" className="w-1/2 h-9">
                Search
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-1/2 h-9 text-xs"
                onClick={handleResetFilters}
              >
                Reset
              </Button>
            </div>
          </form>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Hours Logged</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length > 0 ? (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">
                          {log.employeeName}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)] font-semibold uppercase">
                          {log.employeeId} · {log.department}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{formatDateLabel(log.date)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {formatLogTime(log.checkIn)}
                        {log.isLate && (
                          <Badge variant="warning" className="text-[9px] px-1 py-0 h-4">
                            Late
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatLogTime(log.checkOut)}</TableCell>
                    <TableCell className="font-mono text-xs font-semibold">
                      {log.workingHours}
                    </TableCell>
                    <TableCell>
                      <StatusChip status={log.status.toLowerCase() as "present" | "absent" | "half_day" | "leave" | "pending"} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No active check-in logs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalLogs > 10 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)] font-semibold">
                Page {currentPage} of {Math.ceil(totalLogs / 10)}
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
                  disabled={currentPage >= Math.ceil(totalLogs / 10)}
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

// Internal inline StatCard re-export helper since components/ui/stat-card.tsx is local Client Component
function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconColor,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  iconColor: "indigo" | "emerald" | "amber" | "rose";
}) {
  const bgColors = {
    indigo: "bg-[var(--accent-subtle)] text-[var(--accent)]",
    emerald: "bg-[var(--success-subtle)] text-[var(--success)]",
    amber: "bg-[var(--warning-subtle)] text-[var(--warning)]",
    rose: "bg-[var(--danger-subtle)] text-[var(--danger)]",
  };

  return (
    <Card className="glass border-[var(--border)] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-[var(--text-primary)] leading-none">{value}</p>
          <p className="text-xs text-[var(--text-muted)] mt-2 font-medium">{subtitle}</p>
        </div>
        <div className={cn("h-10 w-10 rounded-[var(--radius-xl)] flex items-center justify-center [&_svg]:h-5 [&_svg]:w-5 shadow-sm shrink-0", bgColors[iconColor])}>
          {icon}
        </div>
      </div>
    </Card>
  );
}
