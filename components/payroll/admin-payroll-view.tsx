"use client";

import * as React from "react";
import { useState, useEffect, useTransition, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusChip } from "@/components/ui/status-chip";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  Calendar,
  Download,
  TrendingUp,
  X,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  getAdminPayrollDashboardAction,
  getAdminPayrollTableAction,
  createOrUpdatePayrollAction,
  processMonthlyPayrollAction,
  deletePayrollAction,
  updatePayrollPaymentStatusAction,
  type AdminPayrollDashboardData,
  type AdminPayrollTableItem,
} from "@/actions/payroll";
import { getEmployeesAction, type EmployeeDirectoryItem } from "@/actions/admin";

export function AdminPayrollView() {
  const [, startTransition] = useTransition();

  // Dashboard Aggregations
  const [dashboard, setDashboard] = useState<AdminPayrollDashboardData | null>(null);

  // Workforce Payroll Grid
  const [items, setItems] = useState<AdminPayrollTableItem[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("ALL");
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());

  // Workforce directory list for new salary assignments
  const [workforce, setWorkforce] = useState<EmployeeDirectoryItem[]>([]);

  // Modals States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  const [editForm, setEditForm] = useState({
    userId: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    basicSalary: 20000,
    houseRentAllowance: 8000,
    medicalAllowance: 3000,
    travelAllowance: 2000,
    otherAllowances: 2000,
    tax: 3500,
    providentFund: 4200,
    professionalTax: 200,
    otherDeductions: 0,
    bonus: 0,
    paymentStatus: "PENDING",
  });

  const [bulkForm, setBulkForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  // Calculate Net salary automatically on the fly
  const calculatedNetSalary = useMemo(() => {
    const earnings =
      Number(editForm.basicSalary) +
      Number(editForm.houseRentAllowance) +
      Number(editForm.medicalAllowance) +
      Number(editForm.travelAllowance) +
      Number(editForm.otherAllowances);

    const deductions =
      Number(editForm.tax) +
      Number(editForm.providentFund) +
      Number(editForm.professionalTax) +
      Number(editForm.otherDeductions);

    return earnings + Number(editForm.bonus) - deductions;
  }, [editForm]);

  const loadData = useCallback(async () => {
    const [dashRes, tableRes, workRes] = await Promise.all([
      getAdminPayrollDashboardAction(),
      getAdminPayrollTableAction({
        search: search || undefined,
        department: department !== "ALL" ? department : undefined,
        month: filterMonth,
        year: filterYear,
        page: currentPage,
        limit: 10,
      }),
      getEmployeesAction({ page: 1, limit: 100 }),
    ]);

    if (dashRes.success && dashRes.data) {
      setDashboard(dashRes.data);
    }
    if (tableRes.success && tableRes.data) {
      setItems(tableRes.data.items);
      setTotal(tableRes.data.total);
    }
    if (workRes.success && workRes.data) {
      setWorkforce(workRes.data.items);
    }
  }, [search, department, filterMonth, filterYear, currentPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadData();
  };

  const handleResetFilters = () => {
    setSearch("");
    setDepartment("ALL");
    setFilterMonth(new Date().getMonth() + 1);
    setFilterYear(new Date().getFullYear());
    setCurrentPage(1);
  };

  const handleOpenCreate = () => {
    setEditForm({
      userId: workforce[0]?.id || "",
      month: filterMonth,
      year: filterYear,
      basicSalary: 20000,
      houseRentAllowance: 8000,
      medicalAllowance: 3000,
      travelAllowance: 2000,
      otherAllowances: 2000,
      tax: 3000,
      providentFund: 4000,
      professionalTax: 200,
      otherDeductions: 0,
      bonus: 0,
      paymentStatus: "PENDING",
    });
    setIsEditOpen(true);
  };

  const handleOpenEdit = (item: AdminPayrollTableItem) => {
    setEditForm({
      userId: item.userId,
      month: item.month,
      year: item.year,
      basicSalary: item.basicSalary,
      houseRentAllowance: item.houseRentAllowance,
      medicalAllowance: item.medicalAllowance,
      travelAllowance: item.travelAllowance,
      otherAllowances: item.otherAllowances,
      tax: item.tax,
      providentFund: item.providentFund,
      professionalTax: item.professionalTax,
      otherDeductions: item.otherDeductions,
      bonus: item.bonus,
      paymentStatus: item.paymentStatus,
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.userId) {
      toast.error("Please select an employee");
      return;
    }

    startTransition(async () => {
      const res = await createOrUpdatePayrollAction(editForm);
      if (res.success) {
        toast.success("Payroll record updated successfully!");
        setIsEditOpen(false);
        loadData();
      } else {
        toast.error(res.error || "Save payroll failed");
      }
    });
  };

  const handleProcessBulk = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await processMonthlyPayrollAction(bulkForm.month, bulkForm.year);
      if (res.success) {
        toast.success(`Successfully processed monthly payroll for ${res.data} employees!`);
        setIsBulkOpen(false);
        loadData();
      } else {
        toast.error(res.error || "Bulk process failed");
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Are you sure you want to delete this payroll record?")) return;

    startTransition(async () => {
      const res = await deletePayrollAction(id);
      if (res.success) {
        toast.success("Payroll record deleted!");
        loadData();
      } else {
        toast.error(res.error || "Delete failed");
      }
    });
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "PAID" ? "PENDING" : "PAID";
    startTransition(async () => {
      const res = await updatePayrollPaymentStatusAction(id, nextStatus);
      if (res.success) {
        toast.success(`Status updated to ${nextStatus}`);
        loadData();
      } else {
        toast.error(res.error || "Status update failed");
      }
    });
  };

  const handleExportCSV = () => {
    const headers = [
      "Employee ID",
      "Full Name",
      "Month",
      "Year",
      "Basic",
      "Allowances",
      "Deductions",
      "Bonus",
      "Net Salary",
      "Status",
    ].join(",");

    const rows = items.map((item) =>
      [
        `"${item.employeeId}"`,
        `"${item.fullName}"`,
        item.month,
        item.year,
        item.basicSalary,
        item.allowances,
        item.deductions,
        item.bonus,
        item.netSalary,
        `"${item.paymentStatus}"`,
      ].join(",")
    );

    const blob = new Blob([[headers, ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payroll_report_${filterMonth}_${filterYear}.csv`;
    link.click();
    toast.success("CSV export download started!");
  };

  return (
    <div className="space-y-6">
      {/* Aggregates Dashboard Cards */}
      {dashboard && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass border-[var(--border)]">
            <CardContent className="p-5 space-y-1">
              <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Total Monthly Cost</span>
              <p className="text-xl font-bold text-[var(--text-primary)]">₹{dashboard.totalPayrollCost.toLocaleString("en-IN")}</p>
              <p className="text-[9px] text-[var(--text-muted)]">Sum of all taking net salary payouts</p>
            </CardContent>
          </Card>

          <Card className="glass border-[var(--border)]">
            <CardContent className="p-5 space-y-1">
              <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Employees Paid</span>
              <p className="text-xl font-bold text-emerald-500">{dashboard.employeesPaid} / {dashboard.employeesPaid + dashboard.pendingPayroll}</p>
              <p className="text-[9px] text-[var(--text-muted)]">Active accounts processed this month</p>
            </CardContent>
          </Card>

          <Card className="glass border-[var(--border)]">
            <CardContent className="p-5 space-y-1">
              <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Average Take Home</span>
              <p className="text-xl font-bold text-indigo-500">₹{dashboard.averageSalary.toLocaleString("en-IN")}</p>
              <p className="text-[9px] text-[var(--text-muted)]">Mean earnings across workforce</p>
            </CardContent>
          </Card>

          <Card className="glass border-[var(--border)]">
            <CardContent className="p-5 space-y-1">
              <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Salary Extrema</span>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-emerald-500 flex items-center gap-0.5" title="Highest takehome">
                  <TrendingUp className="h-3.5 w-3.5" /> ₹{dashboard.highestSalary.toLocaleString("en-IN")}
                </span>
                <span className="text-xs font-semibold text-[var(--danger)] flex items-center gap-0.5" title="Lowest takehome">
                  <TrendingDown className="h-3.5 w-3.5" /> ₹{dashboard.lowestSalary.toLocaleString("en-IN")}
                </span>
              </div>
              <p className="text-[9px] text-[var(--text-muted)]">Highest vs Lowest net takehomes</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Visual Charting panels */}
      {dashboard && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Department Payroll Distribution */}
          <Card className="glass border-[var(--border)]">
            <CardContent className="p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Department Disbursal Allocation</h3>
                <p className="text-[10px] text-[var(--text-muted)]">Distribution of payroll cost per department.</p>
              </div>
              <div className="space-y-3 pt-2">
                {dashboard.departmentSalaryDistribution.map((d) => {
                  const maxAmt = Math.max(...dashboard.departmentSalaryDistribution.map((item) => item.amount), 1);
                  const pct = Math.round((d.amount / maxAmt) * 100);
                  return (
                    <div key={`dept-dist-${d.department}`} className="space-y-1 text-xs">
                      <div className="flex justify-between font-medium">
                        <span>{d.department}</span>
                        <span className="font-bold text-[var(--text-primary)]">₹{d.amount.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="h-2 w-full bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-full overflow-hidden">
                        <div className="h-full bg-[var(--accent)] transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Chart 2: Monthly Trends */}
          <Card className="glass border-[var(--border)]">
            <CardContent className="p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Monthly Disbursal Trend</h3>
                <p className="text-[10px] text-[var(--text-muted)]">Annual cost curve mapped monthly.</p>
              </div>
              <div className="h-44 w-full flex items-end justify-between gap-2 pt-4 border-b border-[var(--border-subtle)] px-2">
                {dashboard.monthlyPayrollTrend.map((m) => {
                  const maxAmt = Math.max(...dashboard.monthlyPayrollTrend.map((item) => item.amount), 1);
                  const pct = Math.round((m.amount / maxAmt) * 80); // cap height at 80%
                  return (
                    <div key={`trend-${m.month}`} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                      <div className="relative w-full flex justify-center">
                        <div
                          className="w-full max-w-[20px] rounded-t-sm bg-gradient-to-t from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 transition-all duration-300"
                          style={{ height: `${Math.max(4, pct)}px` }}
                        />
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full mb-1 bg-[var(--surface)] border border-[var(--border)] px-1.5 py-0.5 rounded text-[8px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md pointer-events-none">
                          ₹{m.amount.toLocaleString("en-IN")}
                        </div>
                      </div>
                      <span className="text-[8px] text-[var(--text-muted)] font-semibold">{m.month}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Admin Controls and Table Grid */}
      <Card className="glass border-[var(--border)]">
        <CardContent className="p-0">
          <div className="p-4 flex flex-col md:flex-row items-center justify-between border-b border-[var(--border-subtle)] gap-4">
            <form onSubmit={handleFilterSearch} className="flex flex-wrap items-center gap-3 w-full md:w-auto text-xs">
              <div className="relative min-w-[200px]">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search name, ID, or email..."
                  className="w-full h-9 pl-9 pr-3 rounded-[var(--radius-lg)] border border-[var(--border)] text-xs bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
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
                value={filterMonth}
                onChange={(e) => {
                  setFilterMonth(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                {[...Array(12)].map((_, i) => (
                  <option key={`month-opt-${i + 1}`} value={i + 1}>
                    Month {i + 1}
                  </option>
                ))}
              </select>

              <select
                className="h-9 px-3 rounded-[var(--radius-lg)] border border-[var(--border)] text-xs bg-[var(--surface)] text-[var(--text-primary)]"
                value={filterYear}
                onChange={(e) => {
                  setFilterYear(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>

              <Button type="submit" variant="primary" size="sm" className="h-9">
                Filter
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-9" onClick={handleResetFilters}>
                Reset
              </Button>
            </form>

            <div className="flex flex-wrap gap-2 justify-end w-full md:w-auto">
              <Button variant="outline" size="sm" className="h-9" onClick={handleExportCSV}>
                <Download className="h-3.5 w-3.5 mr-1.5" /> Export Report
              </Button>
              <Button variant="outline" size="sm" className="h-9" onClick={() => setIsBulkOpen(true)}>
                <Calendar className="h-3.5 w-3.5 mr-1.5" /> Process Monthly
              </Button>
              <Button variant="primary" size="sm" className="h-9" onClick={handleOpenCreate}>
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Process Single
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Month &amp; Year</TableHead>
                <TableHead>Basic Salary</TableHead>
                <TableHead>Allowances</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Bonus</TableHead>
                <TableHead>Net Salary</TableHead>
                <TableHead>Disbursal Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length > 0 ? (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-xs text-[var(--text-primary)]">{item.fullName}</p>
                        <p className="text-[10px] text-[var(--text-muted)] font-mono">ID: {item.employeeId}</p>
                      </div>
                    </TableCell>
                    <TableCell>{item.department}</TableCell>
                    <TableCell className="text-xs">
                      Month {item.month} / {item.year}
                    </TableCell>
                    <TableCell>₹{item.basicSalary.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-emerald-500">+₹{item.allowances.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-[var(--danger)]">-₹{item.deductions.toLocaleString("en-IN")}</TableCell>
                    <TableCell>₹{item.bonus.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="font-bold text-xs">₹{item.netSalary.toLocaleString("en-IN")}</TableCell>
                    <TableCell>
                      <button
                        title="Click to toggle status"
                        onClick={() => handleToggleStatus(item.id, item.paymentStatus)}
                      >
                        <StatusChip status={item.paymentStatus === "PAID" ? "present" : "pending"} />
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" title="Edit salary parameters" onClick={() => handleOpenEdit(item)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" className="text-[var(--danger)] hover:bg-[var(--danger-subtle)]" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    No workforce salary history records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {total > 10 && (
            <div className="flex items-center justify-between p-4 border-t border-[var(--border-subtle)]">
              <span className="text-xs text-[var(--text-muted)] font-medium">
                Page {currentPage} of {Math.ceil(total / 10)}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="xs"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-3 w-3" /> Prev
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  disabled={currentPage >= Math.ceil(total / 10)}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Next <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Component Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setIsEditOpen(false)} />
          <div className="relative w-full max-w-xl bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-2xl)] z-10 overflow-hidden flex flex-col justify-between max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-subtle)]">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Disburse Salary slip</h3>
              <Button variant="ghost" size="icon-sm" onClick={() => setIsEditOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Select Employee</label>
                  <select
                    className="h-10 px-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]"
                    value={editForm.userId}
                    onChange={(e) => setEditForm({ ...editForm, userId: e.target.value })}
                  >
                    {workforce.map((w) => (
                      <option key={`wf-${w.id}`} value={w.id}>
                        {w.fullName} (ID: {w.employeeId})
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Month"
                  type="number"
                  min="1"
                  max="12"
                  value={editForm.month}
                  onChange={(e) => setEditForm({ ...editForm, month: Number(e.target.value) })}
                />
                <Input
                  label="Year"
                  type="number"
                  value={editForm.year}
                  onChange={(e) => setEditForm({ ...editForm, year: Number(e.target.value) })}
                />

                <div className="col-span-2 border-b border-[var(--border-subtle)] pb-1 mb-2 font-bold text-[var(--text-primary)]">
                  EARNINGS &amp; ALLOWANCES
                </div>

                <Input
                  label="Basic Salary (₹)"
                  type="number"
                  value={editForm.basicSalary}
                  onChange={(e) => setEditForm({ ...editForm, basicSalary: Number(e.target.value) })}
                />
                <Input
                  label="House Rent Allowance (HRA) (₹)"
                  type="number"
                  value={editForm.houseRentAllowance}
                  onChange={(e) => setEditForm({ ...editForm, houseRentAllowance: Number(e.target.value) })}
                />
                <Input
                  label="Medical Allowance (₹)"
                  type="number"
                  value={editForm.medicalAllowance}
                  onChange={(e) => setEditForm({ ...editForm, medicalAllowance: Number(e.target.value) })}
                />
                <Input
                  label="Travel Allowance (₹)"
                  type="number"
                  value={editForm.travelAllowance}
                  onChange={(e) => setEditForm({ ...editForm, travelAllowance: Number(e.target.value) })}
                />
                <Input
                  label="Other Allowances (₹)"
                  type="number"
                  value={editForm.otherAllowances}
                  onChange={(e) => setEditForm({ ...editForm, otherAllowances: Number(e.target.value) })}
                />
                <Input
                  label="Bonus Payout (₹)"
                  type="number"
                  value={editForm.bonus}
                  onChange={(e) => setEditForm({ ...editForm, bonus: Number(e.target.value) })}
                />

                <div className="col-span-2 border-b border-[var(--border-subtle)] pb-1 mb-2 font-bold text-[var(--text-primary)]">
                  TAXES &amp; DEDUCTIONS
                </div>

                <Input
                  label="Income Tax / TDS (₹)"
                  type="number"
                  value={editForm.tax}
                  onChange={(e) => setEditForm({ ...editForm, tax: Number(e.target.value) })}
                />
                <Input
                  label="EPF Contribution (₹)"
                  type="number"
                  value={editForm.providentFund}
                  onChange={(e) => setEditForm({ ...editForm, providentFund: Number(e.target.value) })}
                />
                <Input
                  label="Professional Tax (₹)"
                  type="number"
                  value={editForm.professionalTax}
                  onChange={(e) => setEditForm({ ...editForm, professionalTax: Number(e.target.value) })}
                />
                <Input
                  label="Other Deductions (₹)"
                  type="number"
                  value={editForm.otherDeductions}
                  onChange={(e) => setEditForm({ ...editForm, otherDeductions: Number(e.target.value) })}
                />

                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Disbursal Status</label>
                  <select
                    className="h-10 px-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]"
                    value={editForm.paymentStatus}
                    onChange={(e) => setEditForm({ ...editForm, paymentStatus: e.target.value })}
                  >
                    <option value="PENDING">Awaiting Approval (PENDING)</option>
                    <option value="PAID">Disbursed (PAID)</option>
                  </select>
                </div>
              </div>

              {/* Recalculate preview */}
              <div className="p-3 bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-xl flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-[var(--text-primary)]">TAKEOHOME NET ESTIMATE:</span>
                  <p className="text-[9px] text-[var(--text-muted)] mt-0.5">Calculated: Basic + Allowances + Bonus - Deductions</p>
                </div>
                <span className="text-base font-black text-indigo-500">₹{calculatedNetSalary.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex justify-end gap-2 border-t border-[var(--border-subtle)] pt-4 mt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk roll monthly processing modal */}
      {isBulkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setIsBulkOpen(false)} />
          <div className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-2xl)] z-10 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-subtle)]">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Process Monthly Disbursals</h3>
              <Button variant="ghost" size="icon-sm" onClick={() => setIsBulkOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleProcessBulk} className="p-5 space-y-4 text-xs">
              <p className="text-[11px] text-[var(--text-secondary)]">
                This will automatically generate PENDING payroll sheets for all verified employees using their base profile salary figures, skipping accounts that have already been generated for this month.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Target Month"
                  type="number"
                  min="1"
                  max="12"
                  value={bulkForm.month}
                  onChange={(e) => setBulkForm({ ...bulkForm, month: Number(e.target.value) })}
                />
                <Input
                  label="Target Year"
                  type="number"
                  value={bulkForm.year}
                  onChange={(e) => setBulkForm({ ...bulkForm, year: Number(e.target.value) })}
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-[var(--border-subtle)] pt-4 mt-4">
                <Button type="button" variant="outline" onClick={() => setIsBulkOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Roll Monthly Payroll
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
