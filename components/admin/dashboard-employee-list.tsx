"use client";

import * as React from "react";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { StatusChip } from "@/components/ui/status-chip";
import { Search, Mail, Phone, Calendar, ArrowRight, Eye, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getProfileAction } from "@/actions/profile";
import { getLeaveHistoryAction } from "@/actions/leave";
import { getAttendanceHistoryAction } from "@/actions/attendance";
import { getLifecycleHistoryAction, type LifecycleHistoryItem } from "@/actions/lifecycle";
import { toast } from "sonner";

interface EmployeeProfile {
  department: string | null;
  designation: string | null;
  phone: string | null;
  status: string;
  joiningDate: Date | string | null;
}

interface EmployeeItem {
  id: string;
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  isVerified: boolean;
  profile: EmployeeProfile | null;
}

interface DashboardEmployeeListProps {
  employees: EmployeeItem[];
}

export function DashboardEmployeeList({ employees }: DashboardEmployeeListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");

  // Detailed profile and history states for drawer view
  const [activeEmployee, setActiveEmployee] = useState<EmployeeItem | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [detailedProfile, setDetailedProfile] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [leavesHistory, setLeavesHistory] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [lifecycleHistory, setLifecycleHistory] = useState<LifecycleHistoryItem[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const handleOpenDrawer = async (emp: EmployeeItem) => {
    setActiveEmployee(emp);
    setIsLoadingDetails(true);
    try {
      const [profileRes, historyRes, attRes, lifeRes] = await Promise.all([
        getProfileAction(emp.id),
        getLeaveHistoryAction({ page: 1, limit: 5, targetUserId: emp.id }),
        getAttendanceHistoryAction({ page: 1, limit: 5, targetUserId: emp.id }),
        getLifecycleHistoryAction(emp.id),
      ]);

      if (profileRes.success && profileRes.data) {
        setDetailedProfile(profileRes.data);
      } else {
        setDetailedProfile(null);
      }
      if (historyRes.success && historyRes.data) {
        setLeavesHistory(historyRes.data.items);
      } else {
        setLeavesHistory([]);
      }
      if (attRes.success && attRes.data) {
        setAttendanceHistory(attRes.data.items);
      } else {
        setAttendanceHistory([]);
      }
      if (lifeRes.success && lifeRes.data) {
        setLifecycleHistory(lifeRes.data);
      } else {
        setLifecycleHistory([]);
      }
    } catch {
      toast.error("Failed to load employee file records");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Get unique list of departments for filtering
  const departments = React.useMemo(() => {
    const depts = new Set<string>();
    employees.forEach((emp) => {
      if (emp.profile?.department) {
        depts.add(emp.profile.department);
      }
    });
    return Array.from(depts);
  }, [employees]);

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const empId = emp.employeeId.toLowerCase();
    const email = emp.email.toLowerCase();
    const query = searchTerm.toLowerCase();

    const matchesSearch =
      fullName.includes(query) || empId.includes(query) || email.includes(query);

    const matchesDept =
      selectedDept === "ALL" || emp.profile?.department === selectedDept;

    return matchesSearch && matchesDept;
  });

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <>
      <Card className="glass border-[var(--border)] w-full">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
        <div>
          <CardTitle className="text-lg font-bold">Workforce Directory</CardTitle>
          <CardDescription>
            Overview of all active corporate employees ({filteredEmployees.length} listed)
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild className="shrink-0">
          <Link href="/admin/employees" className="flex items-center gap-1">
            Workforce Admin <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search by name, ID or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-[var(--radius-lg)] border border-[var(--border)] text-xs bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none"
            />
          </div>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="h-9 px-3 rounded-[var(--radius-lg)] border border-[var(--border)] text-xs bg-[var(--surface)] text-[var(--text-primary)] min-w-[150px] outline-none"
          >
            <option value="ALL">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Table container */}
        <div className="overflow-x-auto overflow-y-auto max-h-[400px] border border-[var(--border-subtle)] rounded-xl">
          <Table>
            <TableHeader className="bg-[var(--surface-raised)] border-b border-[var(--border-subtle)]">
              <TableRow>
                <TableHead className="font-bold text-[11px] text-[var(--text-muted)] uppercase">Employee</TableHead>
                <TableHead className="font-bold text-[11px] text-[var(--text-muted)] uppercase">Role / ID</TableHead>
                <TableHead className="font-bold text-[11px] text-[var(--text-muted)] uppercase">Department</TableHead>
                <TableHead className="font-bold text-[11px] text-[var(--text-muted)] uppercase">Contact</TableHead>
                <TableHead className="font-bold text-[11px] text-[var(--text-muted)] uppercase">Joining Date</TableHead>
                <TableHead className="font-bold text-[11px] text-[var(--text-muted)] uppercase">Status</TableHead>
                <TableHead className="font-bold text-[11px] text-[var(--text-muted)] uppercase text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((emp) => (
                  <TableRow key={emp.id} className="hover:bg-[var(--surface-raised)] transition-colors border-b border-[var(--border-subtle)] last:border-b-0">
                    <TableCell className="py-3">
                      <div>
                        <p className="font-bold text-sm text-[var(--text-primary)]">
                          {emp.firstName} {emp.lastName}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] font-medium">
                          {emp.profile?.designation || "No Title"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div>
                        <p className="font-mono text-xs font-semibold text-[var(--text-secondary)]">
                          {emp.employeeId}
                        </p>
                        <span className="inline-block mt-0.5 text-[9px] font-bold uppercase px-1.5 py-0.2 bg-[var(--border-subtle)] text-[var(--text-secondary)] rounded">
                          {emp.isVerified ? "Verified" : "Unverified"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 font-semibold text-xs text-[var(--text-secondary)]">
                      {emp.profile?.department || "Unassigned"}
                    </TableCell>
                    <TableCell className="py-3 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                        <Mail className="h-3 w-3 shrink-0 text-[var(--text-muted)]" />
                        <span className="truncate max-w-[160px]" title={emp.email}>{emp.email}</span>
                      </div>
                      {emp.profile?.phone && (
                        <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                          <Phone className="h-3 w-3 shrink-0" />
                          <span>{emp.profile.phone}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-3 text-xs text-[var(--text-secondary)] font-medium">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                        <span>{formatDate(emp.profile?.joiningDate)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <StatusChip status={(emp.profile?.status?.toLowerCase() || "active") as "active" | "inactive" | "present" | "absent" | "half_day" | "leave" | "pending" | "approved" | "rejected" | "admin" | "employee"} />
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <Button variant="ghost" size="icon-sm" title="View Profile Details" onClick={() => handleOpenDrawer(emp)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-xs text-[var(--text-muted)]">
                    No employees matching filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

    {/* Profile Details Drawer with Quick Switcher */}
    {activeEmployee && (
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={() => setActiveEmployee(null)} />
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div className="w-screen max-w-md bg-[var(--surface)] border-l border-[var(--border)] p-6 shadow-[var(--shadow-xl)] flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
                <h3 className="text-base font-bold text-[var(--text-primary)]">Employee Profile Summary</h3>
                <Button variant="ghost" size="icon-sm" onClick={() => setActiveEmployee(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Profile Switcher Dropdown */}
              <div className="flex flex-col gap-1.5 p-3.5 bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)]">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Quick Switch Profile
                </label>
                <select
                  value={activeEmployee.id}
                  onChange={(e) => {
                    const selected = employees.find((emp) => emp.id === e.target.value);
                    if (selected) {
                      handleOpenDrawer(selected);
                    }
                  }}
                  className="h-9 px-3 rounded-[var(--radius-lg)] border border-[var(--border)] text-xs bg-[var(--surface)] text-[var(--text-primary)] w-full outline-none focus:ring-1 focus:ring-[var(--accent)] font-medium"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              {/* Avatar Info */}
              <div className="flex items-center gap-4 p-3 bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)]">
                <div className="h-11 w-11 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)] flex items-center justify-center font-bold">
                  {activeEmployee.firstName[0].toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                    {activeEmployee.firstName} {activeEmployee.lastName}
                  </h4>
                  <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase mt-0.5">
                    ID: {activeEmployee.employeeId} · {activeEmployee.profile?.department || "Unassigned"}
                  </p>
                </div>
              </div>

              {isLoadingDetails ? (
                <div className="text-center py-12 text-xs text-[var(--text-muted)] animate-pulse">Loading profile details...</div>
              ) : (
                <div className="space-y-5 text-xs text-[var(--text-secondary)]">
                  <div>
                    <h4 className="font-bold text-[var(--text-primary)] uppercase text-[10px] tracking-wide mb-2">
                      Personal Information
                    </h4>
                    <div className="grid grid-cols-2 gap-3 bg-[var(--surface-raised)] border border-[var(--border-subtle)] p-3 rounded-[var(--radius-xl)]">
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)]">Email</span>
                        <p className="font-semibold truncate" title={activeEmployee.email}>{activeEmployee.email}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)]">Phone</span>
                        <p className="font-semibold">{activeEmployee.profile?.phone || "—"}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] text-[var(--text-muted)]">Address</span>
                        <p className="font-semibold">{detailedProfile?.profile?.address || "—"}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-[var(--text-primary)] uppercase text-[10px] tracking-wide mb-2">
                      Employment Metrics
                    </h4>
                    <div className="grid grid-cols-2 gap-3 bg-[var(--surface-raised)] border border-[var(--border-subtle)] p-3 rounded-[var(--radius-xl)]">
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)]">Designation</span>
                        <p className="font-semibold">{activeEmployee.profile?.designation || "No Title"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)]">Authority Role</span>
                        <p className="font-semibold uppercase text-[var(--accent)]">{detailedProfile?.role || "EMPLOYEE"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)]">Profile Status</span>
                        <p className="font-bold text-indigo-500 uppercase">{activeEmployee.profile?.status || "Active"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)]">Joined Date</span>
                        <p className="font-semibold">{formatDate(activeEmployee.profile?.joiningDate)}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-[var(--text-primary)] uppercase text-[10px] tracking-wide mb-2">
                      Recent Leaves History
                    </h4>
                    <div className="space-y-2">
                      {leavesHistory.length > 0 ? (
                        leavesHistory.map((l: any, idx: number) => (
                          <div key={`drawer-leave-${idx}`} className="flex items-center justify-between p-2.5 bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] text-[10px]">
                            <div>
                              <p className="font-bold text-[var(--text-primary)]">{l.leaveType} Leave</p>
                              <p className="text-[9px] text-[var(--text-muted)] mt-0.5">
                                {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}
                              </p>
                            </div>
                            <span className={`font-bold px-2 py-0.5 rounded text-[9px] uppercase ${
                              l.status === "APPROVED" ? "bg-[var(--success-subtle)] text-[var(--success)]" :
                              l.status === "PENDING" ? "bg-[var(--warning-subtle)] text-[var(--warning)]" :
                              "bg-[var(--danger-subtle)] text-[var(--danger)]"
                            }`}>
                              {l.status}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-2 text-[10px] text-[var(--text-muted)]">No leave entries found.</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-[var(--text-primary)] uppercase text-[10px] tracking-wide mb-2">
                      Check-in Logs Activity
                    </h4>
                    <div className="space-y-2">
                      {attendanceHistory.length > 0 ? (
                        attendanceHistory.map((a: any, idx: number) => (
                          <div key={`drawer-att-${idx}`} className="flex items-center justify-between p-2 bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] text-[10px]">
                            <span>{new Date(a.date).toLocaleDateString()}</span>
                            <span className="font-bold text-[var(--accent)]">{a.status}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-2 text-[10px] text-[var(--text-muted)]">No check-in entries found.</div>
                      )}
                    </div>
                  </div>

                  {lifecycleHistory.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-[var(--text-primary)] uppercase text-[10px] tracking-wide">
                        Lifecycle Timeline History
                      </h4>
                      <div className="relative border-l border-[var(--border-subtle)] ml-2.5 pl-4 space-y-3 pt-1">
                        {lifecycleHistory.map((life, index) => (
                          <div key={`life-log-${index}`} className="relative text-[10px]">
                            <div className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-indigo-500 ring-4 ring-[var(--surface)]" />
                            <div className="flex justify-between font-bold text-[var(--text-primary)]">
                              <span>{life.oldStatus || "Active"} → {life.newStatus}</span>
                              <span className="text-[9px] text-[var(--text-muted)]">
                                {new Date(life.date).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-[9px] text-[var(--text-muted)] mt-0.5">By: {life.updatedBy}</p>
                            {life.reason && <p className="text-[9px] italic mt-0.5 text-[var(--text-secondary)]">&quot;{life.reason}&quot;</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
