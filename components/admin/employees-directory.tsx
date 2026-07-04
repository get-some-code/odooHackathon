"use client";

import * as React from "react";
import { useState, useEffect, useTransition, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { StatusChip } from "@/components/ui/status-chip";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Search,
  Eye,
  Edit2,
  Trash2,
  UserPlus,
  Key,
  ShieldAlert,
  UserCheck,
  UserMinus,
  Download,
  Upload,
  X,
  AlertCircle,
} from "lucide-react";
import {
  getEmployeesAction,
  createEmployeeAction,
  updateEmployeeAction,
  deactivateEmployeeAction,
  activateEmployeeAction,
  deleteEmployeeAction,
  resetPasswordAction,
  changeRoleAction,
  bulkImportEmployeesAction,
  type EmployeeDirectoryItem,
} from "@/actions/admin";
import { getProfileAction } from "@/actions/profile";
import { getLeaveHistoryAction } from "@/actions/leave";
import { getAttendanceHistoryAction } from "@/actions/attendance";
import { getLifecycleHistoryAction, updateEmployeeStatusAction, type LifecycleHistoryItem } from "@/actions/lifecycle";

export function EmployeesDirectory() {
  const [, startTransition] = useTransition();

  const [employees, setEmployees] = useState<EmployeeDirectoryItem[]>([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [department, setDepartment] = useState("ALL");
  const [designation, setDesignation] = useState("ALL");
  const [status, setStatus] = useState("ALL");

  // Selection states (for bulk actions)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Drawer (Side Panel Details) state
  const [activeEmployee, setActiveEmployee] = useState<EmployeeDirectoryItem | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  const [detailedProfile, setDetailedProfile] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  const [leavesHistory, setLeavesHistory] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [lifecycleHistory, setLifecycleHistory] = useState<LifecycleHistoryItem[]>([]);
  const [lifecycleForm, setLifecycleForm] = useState({
    newStatus: "Active",
    reason: "",
  });
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Modal states: Create/Edit Employee
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"CREATE" | "EDIT">("CREATE");
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [formFields, setFormFields] = useState({
    employeeId: "",
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    department: "Engineering",
    designation: "Software Engineer",
    joiningDate: "",
    role: "EMPLOYEE",
  });

  // Bulk Import state
  const [isImportOpen, setIsImportOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const fetchEmployees = useCallback(async () => {
    const res = await getEmployeesAction({
      search: searchQuery || undefined,
      department: department || undefined,
      designation: designation || undefined,
      status: status !== "ALL" ? status : undefined,
      page: currentPage,
      limit: 10,
    });

    if (res.success && res.data) {
      setEmployees(res.data.items);
      setTotalEmployees(res.data.total);
    } else {
      toast.error(res.error || "Failed to load employee list");
    }
  }, [searchQuery, department, designation, status, currentPage]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchEmployees();
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setDepartment("ALL");
    setDesignation("ALL");
    setStatus("ALL");
    setCurrentPage(1);
  };

  // CRUD Actions
  const handleOpenCreateModal = () => {
    setModalMode("CREATE");
    setEditingEmployeeId(null);
    setFormFields({
      employeeId: "",
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      address: "",
      department: "Engineering",
      designation: "Software Engineer",
      joiningDate: new Date().toISOString().split("T")[0],
      role: "EMPLOYEE",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp: EmployeeDirectoryItem) => {
    setModalMode("EDIT");
    setEditingEmployeeId(emp.id);
    setFormFields({
      employeeId: emp.employeeId,
      email: emp.email,
      firstName: emp.firstName,
      lastName: emp.lastName,
      phone: emp.phone !== "—" ? emp.phone : "",
      address: emp.address !== "—" ? emp.address : "",
      department: emp.department !== "Unassigned" ? emp.department : "Engineering",
      designation: emp.designation !== "Unassigned" ? emp.designation : "Software Engineer",
      joiningDate: emp.joiningDate
        ? new Date(emp.joiningDate).toISOString().split("T")[0]
        : "",
      role: emp.role,
    });
    setIsModalOpen(true);
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formFields.employeeId || !formFields.email || !formFields.firstName || !formFields.lastName) {
      toast.error("Please fill in all required fields.");
      return;
    }

    startTransition(async () => {
      let res;
      if (modalMode === "CREATE") {
        res = await createEmployeeAction(formFields);
      } else {
        res = await updateEmployeeAction(editingEmployeeId!, formFields);
      }

      if (res.success) {
        toast.success(
          modalMode === "CREATE"
            ? "Employee created successfully!"
            : "Employee details updated successfully!"
        );
        setIsModalOpen(false);
        fetchEmployees();
      } else {
        toast.error(res.error || "Action failed");
      }
    });
  };

  const handleDeactivate = (id: string, active: boolean) => {
    const confirmText = active
      ? "Are you sure you want to deactivate this employee?"
      : "Are you sure you want to activate this employee?";
    if (!window.confirm(confirmText)) return;

    startTransition(async () => {
      const res = active
        ? await deactivateEmployeeAction(id)
        : await activateEmployeeAction(id);

      if (res.success) {
        toast.success(active ? "Employee deactivated" : "Employee activated");
        fetchEmployees();
        if (activeEmployee && activeEmployee.id === id) {
          setActiveEmployee((prev) => prev ? { ...prev, isVerified: !active } : null);
        }
      } else {
        toast.error(res.error || "Update status failed");
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("WARNING: This will permanently delete the employee. Are you sure?")) return;

    startTransition(async () => {
      const res = await deleteEmployeeAction(id);
      if (res.success) {
        toast.success("Employee deleted successfully");
        fetchEmployees();
        setActiveEmployee(null);
      } else {
        toast.error(res.error || "Delete failed");
      }
    });
  };

  const handleResetPassword = (id: string) => {
    if (!window.confirm("Are you sure you want to reset password back to Employee ID?")) return;

    startTransition(async () => {
      const res = await resetPasswordAction(id);
      if (res.success) {
        toast.success("Password reset successfully back to Employee ID.");
      } else {
        toast.error(res.error || "Reset failed");
      }
    });
  };

  const handleChangeRole = (id: string, currentRole: string) => {
    const nextRole = currentRole === "ADMIN" ? "EMPLOYEE" : "ADMIN";
    if (!window.confirm(`Are you sure you want to change employee role to ${nextRole}?`)) return;

    startTransition(async () => {
      const res = await changeRoleAction(id, nextRole);
      if (res.success) {
        toast.success(`Role updated successfully to ${nextRole}`);
        fetchEmployees();
      } else {
        toast.error(res.error || "Change role failed");
      }
    });
  };

  const handleStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEmployee) return;

    startTransition(async () => {
      const res = await updateEmployeeStatusAction({
        targetUserId: activeEmployee.id,
        newStatus: lifecycleForm.newStatus,
        reason: lifecycleForm.reason,
      });

      if (res.success) {
        toast.success("Employee status updated successfully!");
        setLifecycleForm((prev) => ({ ...prev, reason: "" }));
        const historyRes = await getLifecycleHistoryAction(activeEmployee.id);
        if (historyRes.success && historyRes.data) {
          setLifecycleHistory(historyRes.data);
        }
        fetchEmployees();
      } else {
        toast.error(res.error || "Status update failed");
      }
    });
  };

  // Open Details Drawer
  const handleOpenDrawer = async (emp: EmployeeDirectoryItem) => {
    setActiveEmployee(emp);
    setLifecycleForm({ newStatus: emp.status || "Active", reason: "" });
    setIsLoadingDetails(true);
    try {
      const [profileRes, historyRes, attRes, lifeRes] = await Promise.all([
        getProfileAction(emp.id),
        getLeaveHistoryAction({ page: 1, limit: 5, targetUserId: emp.id }), // query leave histories
        getAttendanceHistoryAction({ page: 1, limit: 5, targetUserId: emp.id }), // query checkin logs
        getLifecycleHistoryAction(emp.id),
      ]);

      if (profileRes.success && profileRes.data) {
        setDetailedProfile(profileRes.data);
      }
      if (historyRes.success && historyRes.data) {
        setLeavesHistory(historyRes.data.items);
      }
      if (attRes.success && attRes.data) {
        setAttendanceHistory(attRes.data.items);
      }
      if (lifeRes.success && lifeRes.data) {
        setLifecycleHistory(lifeRes.data);
      }
    } catch {
      toast.error("Failed to load employee file records");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // CSV Import handling
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
      if (lines.length <= 1) {
        toast.error("CSV file is empty or missing data rows.");
        return;
      }

      // Columns: employeeId, email, firstName, lastName, department, designation, joiningDate
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parsedRows: any[] = [];
      const errors: string[] = [];

      lines.slice(1).forEach((line, idx) => {
        const cols = line.split(",").map((c) => c.replace(/^["']|["']$/g, "").trim());
        if (cols.length < 4) {
          errors.push(`Row ${idx + 2}: Missing required columns (ID, Email, First, Last)`);
          return;
        }

        parsedRows.push({
          employeeId: cols[0],
          email: cols[1],
          firstName: cols[2],
          lastName: cols[3],
          department: cols[4] || "Engineering",
          designation: cols[5] || "Software Engineer",
          joiningDate: cols[6] || new Date().toISOString().split("T")[0],
        });
      });

      setImportRows(parsedRows);
      setImportErrors(errors);
      setIsImportOpen(true);
    };
    reader.readAsText(file);
  };

  const triggerImportSubmit = () => {
    if (importRows.length === 0) return;
    startTransition(async () => {
      const res = await bulkImportEmployeesAction(importRows);
      if (res.success) {
        toast.success(`Successfully imported ${res.data} employees!`);
        setIsImportOpen(false);
        fetchEmployees();
      } else {
        toast.error(res.error || "Failed to process import rows");
      }
    });
  };

  // CSV Export
  const handleExportCSV = () => {
    const csvRows = [
      ["Employee ID", "Full Name", "Email", "Phone", "Department", "Designation", "Joining Date", "Status", "Role"].join(","),
    ];

    employees.forEach((e) => {
      const statusStr = e.isVerified ? "ACTIVE" : "INACTIVE";
      const row = [
        `"${e.employeeId}"`,
        `"${e.fullName}"`,
        `"${e.email}"`,
        `"${e.phone}"`,
        `"${e.department}"`,
        `"${e.designation}"`,
        `"${e.joiningDate ? new Date(e.joiningDate).toLocaleDateString() : "—"}"`,
        `"${statusStr}"`,
        `"${e.role}"`,
      ];
      csvRows.push(row.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `employees_export_${Date.now()}.csv`;
    link.click();
    toast.success("CSV directory download complete!");
  };

  return (
    <div className="space-y-6">
      {/* Search and Action Bar */}
      <Card className="glass border-[var(--border)]">
        <CardContent className="py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search name, email, or employee ID..."
                className="w-full h-9 pl-9 pr-3 rounded-[var(--radius-lg)] border border-[var(--border)] text-xs bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

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

            <select
              className="h-9 px-3 rounded-[var(--radius-lg)] border border-[var(--border)] text-xs bg-[var(--surface)] text-[var(--text-primary)]"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Deactivated Only</option>
            </select>

            <Button type="submit" variant="primary" size="sm" className="h-9">
              Filter
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-9 text-xs" onClick={handleResetFilters}>
              Reset
            </Button>
          </form>

          <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
            <label className="flex items-center gap-1.5 h-9 px-3 border border-[var(--border)] hover:bg-[var(--surface-raised)] rounded-[var(--radius-lg)] text-xs font-semibold text-[var(--text-secondary)] transition-colors cursor-pointer select-none">
              <Upload className="h-3.5 w-3.5" />
              Import CSV
              <input type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
            </label>

            <Button variant="outline" size="sm" className="h-9" onClick={handleExportCSV}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> Export CSV
            </Button>

            <Button variant="primary" size="sm" className="h-9" onClick={handleOpenCreateModal}>
              <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Add Employee
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Directory Table */}
      <Card className="glass border-[var(--border)]">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee ID</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length > 0 ? (
                employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-semibold">{emp.employeeId}</TableCell>
                    <TableCell>{emp.fullName}</TableCell>
                    <TableCell>{emp.department}</TableCell>
                    <TableCell>{emp.designation}</TableCell>
                    <TableCell className="text-xs">{emp.email}</TableCell>
                    <TableCell className="text-xs">{emp.phone}</TableCell>
                    <TableCell className="text-xs">
                      {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString("en-IN") : "—"}
                    </TableCell>
                    <TableCell>
                      <StatusChip status={emp.isVerified ? "present" : "absent"} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" title="View Profile Drawer" onClick={() => handleOpenDrawer(emp)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" title="Edit Profile Details" onClick={() => handleOpenEditModal(emp)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" title="Reset Password" onClick={() => handleResetPassword(emp.id)}>
                          <Key className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" title="Toggle Role (Admin/Employee)" onClick={() => handleChangeRole(emp.id, emp.role)}>
                          <ShieldAlert className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title={emp.isVerified ? "Deactivate Employee" : "Activate Employee"}
                          className={emp.isVerified ? "text-[var(--danger)] hover:bg-[var(--danger-subtle)]" : "text-[var(--success)] hover:bg-[var(--success-subtle)]"}
                          onClick={() => handleDeactivate(emp.id, emp.isVerified)}
                        >
                          {emp.isVerified ? <UserMinus className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                        </Button>
                        <Button variant="ghost" size="icon-sm" className="text-[var(--danger)] hover:bg-[var(--danger-subtle)]" onClick={() => handleDelete(emp.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    No workforce directory entries found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalEmployees > 10 && (
            <div className="flex items-center justify-between p-4 border-t border-[var(--border-subtle)]">
              <span className="text-xs text-[var(--text-muted)] font-medium">
                Page {currentPage} of {Math.ceil(totalEmployees / 10)}
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
                  disabled={currentPage >= Math.ceil(totalEmployees / 10)}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Side Details Drawer */}
      {activeEmployee && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={() => setActiveEmployee(null)} />
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-[var(--surface)] border-l border-[var(--border)] p-6 shadow-[var(--shadow-xl)] flex flex-col justify-between overflow-y-auto">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
                  <h3 className="text-base font-bold text-[var(--text-primary)]">Employee Profile summary</h3>
                  <Button variant="ghost" size="icon-sm" onClick={() => setActiveEmployee(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-4 p-3 bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)]">
                  <div className="h-11 w-11 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)] flex items-center justify-center font-bold">
                    {activeEmployee.fullName[0].toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--text-primary)]">{activeEmployee.fullName}</h4>
                    <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase mt-0.5">
                      ID: {activeEmployee.employeeId} · {activeEmployee.department}
                    </p>
                  </div>
                </div>

                {isLoadingDetails ? (
                  <div className="text-center py-12 text-xs text-[var(--text-muted)]">Loading details logs...</div>
                ) : (
                  <div className="space-y-5 text-xs text-[var(--text-secondary)]">
                    <div>
                      <h4 className="font-bold text-[var(--text-primary)] uppercase text-[10px] tracking-wide mb-2">Personal Information</h4>
                      <div className="grid grid-cols-2 gap-3 bg-[var(--surface-raised)] border border-[var(--border-subtle)] p-3 rounded-[var(--radius-xl)]">
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)]">Email</span>
                          <p className="font-semibold truncate">{activeEmployee.email}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)]">Phone</span>
                          <p className="font-semibold">{activeEmployee.phone}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-[10px] text-[var(--text-muted)]">Address</span>
                          <p className="font-semibold">{activeEmployee.address}</p>
                        </div>
                      </div>
                    </div>

                     <div>
                      <h4 className="font-bold text-[var(--text-primary)] uppercase text-[10px] tracking-wide mb-2">Employment metrics</h4>
                      <div className="grid grid-cols-2 gap-3 bg-[var(--surface-raised)] border border-[var(--border-subtle)] p-3 rounded-[var(--radius-xl)]">
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)]">Designation</span>
                          <p className="font-semibold">{activeEmployee.designation}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)]">Authority Role</span>
                          <p className="font-semibold uppercase text-[var(--accent)]">{activeEmployee.role}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)]">Profile Status</span>
                          <p className="font-bold text-indigo-500 uppercase">{activeEmployee.status || "Active"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)]">Leaves Count</span>
                          <p className="font-semibold">{activeEmployee.leavesCount} approved</p>
                        </div>
                      </div>
                    </div>

                    {/* Change Status Form */}
                    <div className="bg-[var(--surface-raised)] border border-[var(--border-subtle)] p-3 rounded-[var(--radius-xl)] space-y-3">
                      <h4 className="font-bold text-[var(--text-primary)] uppercase text-[10px] tracking-wide">
                        Change Lifecycle Status
                      </h4>
                      <form onSubmit={handleStatusSubmit} className="space-y-2 text-[10px]">
                        <div className="flex flex-col gap-1">
                          <label className="font-semibold text-[var(--text-secondary)] uppercase">New Status</label>
                          <select
                            className="h-8 px-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-[10px]"
                            value={lifecycleForm.newStatus}
                            onChange={(e) => setLifecycleForm({ ...lifecycleForm, newStatus: e.target.value })}
                          >
                            <option value="Active">Active</option>
                            <option value="Probation">Probation</option>
                            <option value="On Leave">On Leave</option>
                            <option value="Suspended">Suspended</option>
                            <option value="Resigned">Resigned</option>
                            <option value="Terminated">Terminated</option>
                            <option value="Retired">Retired</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="font-semibold text-[var(--text-secondary)] uppercase">Change Reason</label>
                          <input
                            type="text"
                            placeholder="Reason for changing status..."
                            className="h-8 px-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-[10px] focus:outline-none"
                            value={lifecycleForm.reason}
                            onChange={(e) => setLifecycleForm({ ...lifecycleForm, reason: e.target.value })}
                          />
                        </div>
                        <Button type="submit" variant="primary" size="xs" className="w-full">
                          Change Status
                        </Button>
                      </form>
                    </div>

                    {/* Lifecycle status change history logs */}
                    {lifecycleHistory.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-bold text-[var(--text-primary)] uppercase text-[10px] tracking-wide">
                          Lifecycle Timeline History
                        </h4>
                        <div className="relative border-l border-[var(--border-subtle)] ml-2.5 pl-4 space-y-3 pt-1">
                          {lifecycleHistory.map((life, index) => (
                            <div key={`life-log-${index}`} className="relative text-[10px]">
                              {/* Timeline indicator dot */}
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

                    <div>
                      <h4 className="font-bold text-[var(--text-primary)] uppercase text-[10px] tracking-wide mb-2">Check-in Logs Activity</h4>
                      <div className="space-y-2">
                        {attendanceHistory.length > 0 ? (
                          attendanceHistory.map((a: { date: Date | string; status: string }, idx: number) => (
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
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Create Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-2xl)] z-10 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-subtle)]">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                {modalMode === "CREATE" ? "Register Employee profile" : "Update Profile settings"}
              </h3>
              <Button variant="ghost" size="icon-sm" onClick={() => setIsModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleModalSubmit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Employee ID (Required)"
                  placeholder="e.g. EMP105"
                  value={formFields.employeeId}
                  onChange={(e) => setFormFields({ ...formFields, employeeId: e.target.value })}
                  disabled={modalMode === "EDIT"}
                />
                <Input
                  label="Email (Required)"
                  type="email"
                  placeholder="name@company.com"
                  value={formFields.email}
                  onChange={(e) => setFormFields({ ...formFields, email: e.target.value })}
                />
                <Input
                  label="First Name (Required)"
                  placeholder="John"
                  value={formFields.firstName}
                  onChange={(e) => setFormFields({ ...formFields, firstName: e.target.value })}
                />
                <Input
                  label="Last Name (Required)"
                  placeholder="Doe"
                  value={formFields.lastName}
                  onChange={(e) => setFormFields({ ...formFields, lastName: e.target.value })}
                />
                <Input
                  label="Phone"
                  placeholder="9876543210"
                  value={formFields.phone}
                  onChange={(e) => setFormFields({ ...formFields, phone: e.target.value })}
                />
                <Input
                  label="Address"
                  placeholder="Street details..."
                  value={formFields.address}
                  onChange={(e) => setFormFields({ ...formFields, address: e.target.value })}
                />
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">Department</label>
                  <select
                    className="h-10 px-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]"
                    value={formFields.department}
                    onChange={(e) => setFormFields({ ...formFields, department: e.target.value })}
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Design">Design</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Operations">Operations</option>
                    <option value="HR">HR</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">Designation</label>
                  <select
                    className="h-10 px-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]"
                    value={formFields.designation}
                    onChange={(e) => setFormFields({ ...formFields, designation: e.target.value })}
                  >
                    <option value="Software Engineer">Software Engineer</option>
                    <option value="Senior Software Engineer">Senior Software Engineer</option>
                    <option value="Engineering Lead">Engineering Lead</option>
                    <option value="Product Designer">Product Designer</option>
                    <option value="Design Director">Design Director</option>
                    <option value="HR Manager">HR Manager</option>
                  </select>
                </div>
                <Input
                  label="Joining Date"
                  type="date"
                  value={formFields.joiningDate}
                  onChange={(e) => setFormFields({ ...formFields, joiningDate: e.target.value })}
                />
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">Access Role</label>
                  <select
                    className="h-10 px-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]"
                    value={formFields.role}
                    onChange={(e) => setFormFields({ ...formFields, role: e.target.value })}
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="ADMIN">Admin Manager</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-[var(--border-subtle)] pt-4 mt-4">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  {modalMode === "CREATE" ? "Save Employee" : "Apply Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Preview Modal */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setIsImportOpen(false)} />
          <div className="relative w-full max-w-2xl bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-2xl)] z-10 overflow-hidden max-h-[85vh] flex flex-col justify-between">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-subtle)]">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Preview Imported Employee directory</h3>
              <Button variant="ghost" size="icon-sm" onClick={() => setIsImportOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              {importErrors.length > 0 && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-semibold rounded-[var(--radius-lg)]">
                  <p className="font-bold flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" /> Parser Validation Warnings:</p>
                  <ul className="list-disc pl-4 mt-1.5 space-y-0.5">
                    {importErrors.map((err, i) => <li key={`err-${i}`}>{err}</li>)}
                  </ul>
                </div>
              )}

              <p className="text-xs text-[var(--text-secondary)] font-semibold">
                Parsed {importRows.length} rows from uploaded file. Double check correctness before confirming imports:
              </p>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>First Name</TableHead>
                    <TableHead>Last Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Designation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importRows.map((row, idx) => (
                    <TableRow key={`import-row-${idx}`}>
                      <TableCell className="font-bold">{row.employeeId}</TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>{row.firstName}</TableCell>
                      <TableCell>{row.lastName}</TableCell>
                      <TableCell>{row.department}</TableCell>
                      <TableCell>{row.designation}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-2 p-5 border-t border-[var(--border-subtle)] bg-[var(--surface-raised)]">
              <Button variant="outline" onClick={() => setIsImportOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={triggerImportSubmit} disabled={importRows.length === 0}>
                Confirm Import ({importRows.length} rows)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
