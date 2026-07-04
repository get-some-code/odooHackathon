"use client";

import * as React from "react";
import { useState, useEffect, useTransition, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { StatusChip } from "@/components/ui/status-chip";
import { toast } from "sonner";
import {
  Search,
  CheckCircle,
  XCircle,
  Eye,
  X,
  FolderOpen,
  Loader2,
} from "lucide-react";
import {
  getAdminLeavesAction,
  updateLeaveStatusAction,
  bulkUpdateLeaveStatusAction,
  type AdminLeaveRequestLog,
} from "@/actions/leave";
import { getProfileAction } from "@/actions/profile";
import { LeaveReports } from "./leave-reports";

interface AdminLeaveViewProps {
  initialPending: number;
}

export function AdminLeaveView({ initialPending }: AdminLeaveViewProps) {
  const [, startTransition] = useTransition();

  // Requests queue
  const [requests, setRequests] = useState<AdminLeaveRequestLog[]>([]);
  const [totalRequests, setTotalRequests] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Selection states (for bulk actions)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filter States
  const [searchText, setSearchText] = useState("");
  const [department, setDepartment] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Drawer (Side Panel Details) state
  const [activeRequest, setActiveRequest] = useState<AdminLeaveRequestLog | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [employeeProfile, setEmployeeProfile] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const fetchRequests = useCallback(async () => {
    const res = await getAdminLeavesAction({
      search: searchText || undefined,
      department: department || undefined,
      status: statusFilter || undefined,
      leaveType: typeFilter || undefined,
      page: currentPage,
      limit: 8,
    });

    if (res.success && res.data) {
      setRequests(res.data.items);
      setTotalRequests(res.data.total);
    } else {
      toast.error(res.error || "Failed to load leave requests");
    }
  }, [searchText, department, statusFilter, typeFilter, currentPage]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchRequests();
  };

  const handleResetFilters = () => {
    setSearchText("");
    setDepartment("ALL");
    setStatusFilter("ALL");
    setTypeFilter("ALL");
    setCurrentPage(1);
  };

  // Actions
  const handleUpdateStatus = (id: string, status: "APPROVED" | "REJECTED") => {
    const remark = window.prompt(`Enter remarks for this ${status.toLowerCase()} request (optional):`);
    if (remark === null) return; // cancel click

    startTransition(async () => {
      const res = await updateLeaveStatusAction(id, status, remark);
      if (res.success) {
        toast.success(`Request ${status.toLowerCase()} successfully!`);
        fetchRequests();
        if (activeRequest && activeRequest.id === id) {
          setActiveRequest(null);
        }
      } else {
        toast.error(res.error || "Failed to update status");
      }
    });
  };

  // Bulk Actions
  const handleBulkAction = (status: "APPROVED" | "REJECTED") => {
    if (selectedIds.length === 0) return;
    const confirmBulk = window.confirm(`Are you sure you want to bulk ${status.toLowerCase()} ${selectedIds.length} request(s)?`);
    if (!confirmBulk) return;

    startTransition(async () => {
      const res = await bulkUpdateLeaveStatusAction(selectedIds, status);
      if (res.success) {
        toast.success(`Successfully processed ${selectedIds.length} request(s).`);
        setSelectedIds([]);
        fetchRequests();
      } else {
        toast.error(res.error || "Failed to bulk update");
      }
    });
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === requests.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(requests.map((r) => r.id));
    }
  };

  // Side Drawer load details
  const handleOpenDrawer = async (req: AdminLeaveRequestLog) => {
    setActiveRequest(req);
    setIsLoadingProfile(true);
    try {
      const res = await getProfileAction(req.userId);
      if (res.success && res.data) {
        setEmployeeProfile(res.data);
      }
    } catch {
      toast.error("Failed to load employee file summary");
    } finally {
      setIsLoadingProfile(false);
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
      {/* 1. Statistics Cards & Reports */}
      <LeaveReports />

      {/* 2. Main Approvals Registry */}
      <Card className="glass border-[var(--border)]">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Leave Requests Management Queue</CardTitle>
            <CardDescription>
              Review employee time-off request sheets. There are {initialPending} pending requests in the queue.
            </CardDescription>
          </div>

          {selectedIds.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleBulkAction("APPROVED")}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Bulk Approve ({selectedIds.length})
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleBulkAction("REJECTED")}>
                Bulk Reject ({selectedIds.length})
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters Form */}
          <form
            onSubmit={handleSearchSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-3 bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)]"
          >
            <div className="flex flex-col gap-1 w-full col-span-1 sm:col-span-2">
              <label className="text-[10px] font-bold uppercase text-[var(--text-muted)]">
                Search Employee
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Name or Employee ID..."
                  className="w-full h-9 pl-9 pr-3 rounded-[var(--radius-lg)] border border-[var(--border)] text-xs bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none"
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
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
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
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === requests.length}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-[var(--border)] bg-[var(--surface)] text-[var(--accent)]"
                  />
                </TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>Date Range</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Applied Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length > 0 ? (
                requests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(r.id)}
                        onChange={() => handleSelectRow(r.id)}
                        className="h-4 w-4 rounded border-[var(--border)] bg-[var(--surface)] text-[var(--accent)]"
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">
                          {r.employeeName}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)] font-semibold uppercase">
                          {r.employeeId} · {r.department}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">{r.leaveType}</TableCell>
                    <TableCell>
                      {formatAppliedDate(r.startDate)} — {formatAppliedDate(r.endDate)}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-semibold">
                      {r.duration} {r.duration === 1 ? "day" : "days"}
                    </TableCell>
                    <TableCell className="text-[11px] text-[var(--text-muted)]">
                      {formatAppliedDate(r.appliedDate)}
                    </TableCell>
                    <TableCell>
                      <StatusChip status={r.status.toLowerCase() as "present" | "absent" | "half_day" | "leave" | "pending"} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="ghost" size="icon-sm" onClick={() => handleOpenDrawer(r)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {r.status === "PENDING" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-[var(--success)] hover:bg-[var(--success-subtle)]"
                              onClick={() => handleUpdateStatus(r.id, "APPROVED")}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-[var(--danger)] hover:bg-[var(--danger-subtle)]"
                              onClick={() => handleUpdateStatus(r.id, "REJECTED")}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No matching leave sheets in queue.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalRequests > 8 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)] font-semibold">
                Page {currentPage} of {Math.ceil(totalRequests / 8)}
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
                  disabled={currentPage >= Math.ceil(totalRequests / 8)}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Employee Details Drawer (Slide-over / Absolute Right Panel) */}
      {activeRequest && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={() => setActiveRequest(null)} />

          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-[var(--surface)] border-l border-[var(--border)] p-6 shadow-[var(--shadow-xl)] flex flex-col justify-between overflow-y-auto">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    Leave Request Details
                  </h3>
                  <Button variant="ghost" size="icon-sm" onClick={() => setActiveRequest(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Employee Card */}
                <div className="flex items-center gap-4 p-3 bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)]">
                  <div className="h-11 w-11 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)] flex items-center justify-center font-bold">
                    {activeRequest.employeeName[0].toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                      {activeRequest.employeeName}
                    </h4>
                    <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase mt-0.5">
                      ID: {activeRequest.employeeId} · {activeRequest.department}
                    </p>
                  </div>
                </div>

                {/* Request details */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                        Leave Type
                      </span>
                      <p className="font-semibold text-sm mt-0.5">{activeRequest.leaveType}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                        Status
                      </span>
                      <div className="mt-1">
                        <StatusChip status={activeRequest.status.toLowerCase() as "present" | "absent" | "half_day" | "leave" | "pending"} />
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                        Duration
                      </span>
                      <p className="font-semibold mt-0.5">{activeRequest.duration} days</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                        Timeline
                      </span>
                      <p className="font-semibold mt-0.5">
                        {formatAppliedDate(activeRequest.startDate)} — {formatAppliedDate(activeRequest.endDate)}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[var(--border-subtle)]">
                    <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                      Reason for Request
                    </span>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 bg-[var(--surface-raised)] p-2.5 rounded-[var(--radius-lg)] border border-[var(--border-subtle)]">
                      {activeRequest.reason}
                    </p>
                  </div>

                  {activeRequest.adminComment && (
                    <div className="pt-2 border-t border-[var(--border-subtle)]">
                      <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                        Attachment File Link
                      </span>
                      <a
                        href={activeRequest.adminComment}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-[var(--accent)] hover:underline flex items-center gap-1.5 mt-1 bg-[var(--accent-subtle)] p-2.5 rounded-[var(--radius-lg)] border border-indigo-400/25"
                      >
                        <FolderOpen className="h-4 w-4" /> View Linked Document Attachment
                      </a>
                    </div>
                  )}
                </div>

                {/* dynamic summary profile data */}
                {isLoadingProfile ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--text-muted)]" />
                  </div>
                ) : employeeProfile ? (
                  <div className="space-y-4 pt-4 border-t border-[var(--border-subtle)]">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Employee Summary File
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-xs bg-[var(--surface-raised)] border border-[var(--border-subtle)] p-3 rounded-[var(--radius-xl)]">
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)]">Email</span>
                        <p className="font-semibold truncate">{employeeProfile.email}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)]">Phone</span>
                        <p className="font-semibold">{employeeProfile.profile?.phone || "—"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)]">Leaves Requested</span>
                        <p className="font-semibold">{employeeProfile.documents?.length || 0} file uploads</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)]">Joined</span>
                        <p className="font-semibold">
                          {employeeProfile.profile?.joiningDate
                            ? formatAppliedDate(employeeProfile.profile.joiningDate)
                            : "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {activeRequest.status === "PENDING" && (
                <div className="flex gap-2 border-t border-[var(--border-subtle)] pt-4">
                  <Button
                    onClick={() => handleUpdateStatus(activeRequest.id, "APPROVED")}
                    variant="primary"
                    className="w-1/2"
                  >
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleUpdateStatus(activeRequest.id, "REJECTED")}
                    variant="destructive"
                    className="w-1/2"
                  >
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
