"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
  CreditCard,
  FileText,
  Printer,
  ChevronDown,
  ChevronUp,
  Search,
  Calendar,
  X,
} from "lucide-react";
import type { EmployeePayrollProfile } from "@/actions/payroll";

interface EmployeePayrollViewProps {
  profile: EmployeePayrollProfile;
}

export function EmployeePayrollView({ profile }: EmployeePayrollViewProps) {
  const [isBreakdownExpanded, setIsBreakdownExpanded] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);

  // Search & Pagination States
  const [searchQuery, setSearchQuery] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const currentMonthYear = useMemo(() => {
    if (profile.latestPayslip) {
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      return `${monthNames[profile.latestPayslip.month - 1]} ${profile.latestPayslip.year}`;
    }
    return "N/A";
  }, [profile.latestPayslip]);

  // Derived current salary defaults if no slip is generated yet
  const activeBreakdown = useMemo(() => {
    if (profile.latestPayslip) {
      return profile.latestPayslip;
    }
    // Pre-calculate mock estimate from base contract salary
    const base = profile.baseSalary;
    const basic = Math.round(base * 0.5);
    const hra = Math.round(base * 0.2);
    const med = Math.round(base * 0.1);
    const travel = Math.round(base * 0.1);
    const otherAllow = Math.round(base * 0.1);
    const tax = Math.round(base * 0.1);
    const pf = Math.round(base * 0.12);
    const profTax = 200;
    const otherDeduct = 0;
    const bonus = 0;
    const allowances = hra + med + travel + otherAllow;
    const deductions = tax + pf + profTax + otherDeduct;
    const net = basic + allowances + bonus - deductions;

    return {
      basicSalary: basic,
      houseRentAllowance: hra,
      medicalAllowance: med,
      travelAllowance: travel,
      otherAllowances: otherAllow,
      tax,
      providentFund: pf,
      professionalTax: profTax,
      otherDeductions: otherDeduct,
      bonus,
      allowances,
      deductions,
      netSalary: net,
    };
  }, [profile.latestPayslip, profile.baseSalary]);

  // Filter history
  const filteredHistory = useMemo(() => {
    let result = [...profile.history];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.year.toString().includes(q) ||
          item.month.toString().includes(q) ||
          item.paymentStatus.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const dateA = a.year * 12 + a.month;
      const dateB = b.year * 12 + b.month;
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [profile.history, searchQuery, sortOrder]);

  const paginatedHistory = useMemo(() => {
    const skip = (currentPage - 1) * itemsPerPage;
    return filteredHistory.slice(skip, skip + itemsPerPage);
  }, [filteredHistory, currentPage]);

  const handlePrint = () => {
    window.print();
  };

  const getMonthName = (monthNum: number) => {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return monthNames[monthNum - 1] || `Month ${monthNum}`;
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Printing Style Blocks */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #payslip-print-section, #payslip-print-section * {
            visibility: visible;
          }
          #payslip-print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 24px !important;
          }
        }
      `}} />

      {/* Salary aggregates summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass border-[var(--border)]">
          <CardContent className="p-5 space-y-1">
            <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Base Package</span>
            <p className="text-xl font-bold text-[var(--text-primary)]">₹{profile.baseSalary.toLocaleString("en-IN")}</p>
            <p className="text-[9px] text-[var(--text-muted)]">Per month salary package</p>
          </CardContent>
        </Card>

        <Card className="glass border-[var(--border)]">
          <CardContent className="p-5 space-y-1">
            <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Gross Allowances</span>
            <p className="text-xl font-bold text-emerald-500">+₹{activeBreakdown.allowances.toLocaleString("en-IN")}</p>
            <p className="text-[9px] text-[var(--text-muted)]">HRA, Medical, Travel, Extras</p>
          </CardContent>
        </Card>

        <Card className="glass border-[var(--border)]">
          <CardContent className="p-5 space-y-1">
            <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Total Deductions</span>
            <p className="text-xl font-bold text-[var(--danger)]">-₹{activeBreakdown.deductions.toLocaleString("en-IN")}</p>
            <p className="text-[9px] text-[var(--text-muted)]">Tax, EPF, Professional tax</p>
          </CardContent>
        </Card>

        <Card className="glass border-[var(--border)] text-white bg-gradient-to-br from-indigo-600 to-violet-600 border-none shadow-[var(--shadow-lg)]">
          <CardContent className="p-5 space-y-1">
            <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider">Take Home (Net)</span>
            <p className="text-xl font-black">₹{activeBreakdown.netSalary.toLocaleString("en-IN")}</p>
            <p className="text-[9px] text-indigo-200">Last slip: {currentMonthYear}</p>
          </CardContent>
        </Card>
      </div>

      {/* Salary Breakdown Expandable section */}
      <Card className="glass border-[var(--border)]">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-[var(--accent)]" /> Salary Breakdown details
              </h3>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Review allowances, deductions, and tax configurations.</p>
            </div>
            <Button
              variant="outline"
              size="xs"
              onClick={() => setIsBreakdownExpanded(!isBreakdownExpanded)}
            >
              {isBreakdownExpanded ? (
                <span className="flex items-center gap-1">Collapse <ChevronUp className="h-3 w-3" /></span>
              ) : (
                <span className="flex items-center gap-1">Expand details <ChevronDown className="h-3 w-3" /></span>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-[var(--text-secondary)]">
            {/* Allowances */}
            <div className="space-y-2">
              <h4 className="font-bold text-[var(--text-primary)] text-[10px] tracking-wide uppercase border-b border-[var(--border-subtle)] pb-1 text-emerald-500">
                Allowances (+)
              </h4>
              <div className="space-y-1.5 font-medium">
                <div className="flex justify-between">
                  <span>Basic Salary (50%)</span>
                  <span className="font-semibold">₹{activeBreakdown.basicSalary.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span>House Rent Allowance (HRA)</span>
                  <span className="font-semibold">₹{activeBreakdown.houseRentAllowance.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Medical Allowance</span>
                  <span className="font-semibold">₹{activeBreakdown.medicalAllowance.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Travel Allowance</span>
                  <span className="font-semibold">₹{activeBreakdown.travelAllowance.toLocaleString("en-IN")}</span>
                </div>
                {isBreakdownExpanded && (
                  <>
                    <div className="flex justify-between">
                      <span>Other Allowances</span>
                      <span className="font-semibold">₹{activeBreakdown.otherAllowances.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between border-t border-[var(--border-subtle)] pt-1.5 font-bold text-[var(--text-primary)]">
                      <span>Total Earnings</span>
                      <span>₹{(activeBreakdown.basicSalary + activeBreakdown.allowances).toLocaleString("en-IN")}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Deductions */}
            <div className="space-y-2">
              <h4 className="font-bold text-[var(--text-primary)] text-[10px] tracking-wide uppercase border-b border-[var(--border-subtle)] pb-1 text-[var(--danger)]">
                Deductions &amp; Taxes (-)
              </h4>
              <div className="space-y-1.5 font-medium">
                <div className="flex justify-between">
                  <span>Income Tax (TDS)</span>
                  <span className="font-semibold">₹{activeBreakdown.tax.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Provident Fund (EPF)</span>
                  <span className="font-semibold">₹{activeBreakdown.providentFund.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Professional Tax</span>
                  <span className="font-semibold">₹{activeBreakdown.professionalTax.toLocaleString("en-IN")}</span>
                </div>
                {isBreakdownExpanded && (
                  <>
                    <div className="flex justify-between">
                      <span>Other Deductions</span>
                      <span className="font-semibold">₹{activeBreakdown.otherDeductions.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between border-t border-[var(--border-subtle)] pt-1.5 font-bold text-[var(--text-primary)]">
                      <span>Total Deductions</span>
                      <span>₹{activeBreakdown.deductions.toLocaleString("en-IN")}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Salary history table */}
      <Card className="glass border-[var(--border)]">
        <CardContent className="p-0">
          <div className="p-4 flex flex-col sm:flex-row items-center justify-between border-b border-[var(--border-subtle)] gap-3">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Payroll Disbursal History</h3>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">List of all salary slips processed for your account.</p>
            </div>
            <div className="relative max-w-xs w-full sm:w-auto">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search month or status..."
                className="w-full sm:w-60 h-9 pl-9 pr-3 rounded-[var(--radius-lg)] border border-[var(--border)] text-xs bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month &amp; Year</TableHead>
                <TableHead>Basic Salary</TableHead>
                <TableHead>Allowances</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Bonus</TableHead>
                <TableHead>Net takehome</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedHistory.length > 0 ? (
                paginatedHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-semibold text-xs flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                      {getMonthName(item.month)} {item.year}
                    </TableCell>
                    <TableCell>₹{item.basicSalary.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-emerald-500">+₹{item.allowances.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-[var(--danger)]">-₹{item.deductions.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="font-semibold text-xs">₹{item.bonus.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="font-bold text-xs">₹{item.netSalary.toLocaleString("en-IN")}</TableCell>
                    <TableCell>
                      <StatusChip status={item.paymentStatus === "PAID" ? "present" : "pending"} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="View / Print Payslip"
                        onClick={() => setSelectedPayslip(item)}
                      >
                        <FileText className="h-3.5 w-3.5 text-[var(--accent)]" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">
                    No payroll disbursal history entries found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {filteredHistory.length > itemsPerPage && (
            <div className="flex items-center justify-between p-4 border-t border-[var(--border-subtle)]">
              <span className="text-xs text-[var(--text-muted)] font-medium">
                Showing {paginatedHistory.length} of {filteredHistory.length} slips
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
                  disabled={currentPage >= Math.ceil(filteredHistory.length / itemsPerPage)}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice modal display payslip */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setSelectedPayslip(null)} />
          <div className="relative w-full max-w-2xl bg-white border border-gray-200 rounded-[var(--radius-xl)] shadow-2xl z-10 overflow-hidden flex flex-col justify-between max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50 text-gray-800">
              <h3 className="text-sm font-bold flex items-center gap-1.5"><FileText className="h-4 w-4" /> Salary Slip Invoice</h3>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="xs" className="h-8 text-xs border-gray-300 hover:bg-gray-100 text-gray-700" onClick={handlePrint}>
                  <Printer className="h-3.5 w-3.5 mr-1" /> Print / Save PDF
                </Button>
                <Button variant="ghost" size="icon-sm" className="text-gray-500 hover:bg-gray-100" onClick={() => setSelectedPayslip(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Payslip Document container printed natively */}
            <div id="payslip-print-section" className="p-8 overflow-y-auto space-y-8 text-black bg-white text-xs select-none">
              {/* Header company logo */}
              <div className="flex justify-between items-start border-b border-gray-300 pb-5">
                <div>
                  <h1 className="text-lg font-black tracking-tight text-gray-900">NEXUS ENTERPRISE HR</h1>
                  <p className="text-[10px] text-gray-500">Corporate HQ · Outer Ring Road, Bangalore</p>
                </div>
                <div className="text-right">
                  <h2 className="text-sm font-bold text-gray-800">PAYSLIP SUMMARY</h2>
                  <p className="text-[10px] text-gray-500">Month: {getMonthName(selectedPayslip.month).toUpperCase()} {selectedPayslip.year}</p>
                </div>
              </div>

              {/* Employee Metadata */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 border border-gray-200 p-4 rounded-xl text-[11px] text-gray-700">
                <div>
                  <p><span className="font-bold text-gray-900">Employee Name:</span> {profile.fullName}</p>
                  <p><span className="font-bold text-gray-900">Employee ID:</span> {profile.employeeId}</p>
                  <p><span className="font-bold text-gray-900">Email Address:</span> {profile.email}</p>
                </div>
                <div>
                  <p><span className="font-bold text-gray-900">Department:</span> {profile.department}</p>
                  <p><span className="font-bold text-gray-900">Designation:</span> {profile.designation}</p>
                  <p><span className="font-bold text-gray-900">Disbursal Date:</span> {new Date(selectedPayslip.createdAt).toLocaleDateString("en-IN")}</p>
                </div>
              </div>

              {/* Salary Breakdown table inside slip */}
              <div className="grid grid-cols-2 gap-8 pt-2">
                {/* Earnings */}
                <div className="space-y-2 border-r border-gray-200 pr-4">
                  <h3 className="font-bold border-b border-gray-300 pb-1 text-gray-900">EARNINGS &amp; ALLOWANCES</h3>
                  <div className="space-y-1 text-gray-700">
                    <div className="flex justify-between">
                      <span>Basic Salary</span>
                      <span className="font-semibold">₹{selectedPayslip.basicSalary.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>House Rent Allowance</span>
                      <span className="font-semibold">₹{(selectedPayslip.houseRentAllowance ?? Math.round(profile.baseSalary * 0.2)).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Medical Allowance</span>
                      <span className="font-semibold">₹{(selectedPayslip.medicalAllowance ?? Math.round(profile.baseSalary * 0.1)).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Travel Allowance</span>
                      <span className="font-semibold">₹{(selectedPayslip.travelAllowance ?? Math.round(profile.baseSalary * 0.1)).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Other Allowances</span>
                      <span className="font-semibold">₹{(selectedPayslip.otherAllowances ?? Math.round(profile.baseSalary * 0.1)).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-gray-200 pt-1 text-gray-900">
                      <span>Gross Allowances</span>
                      <span>₹{selectedPayslip.allowances.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="space-y-2 pl-4">
                  <h3 className="font-bold border-b border-gray-300 pb-1 text-gray-900">TAXES &amp; DEDUCTIONS</h3>
                  <div className="space-y-1 text-gray-700">
                    <div className="flex justify-between">
                      <span>Income Tax (TDS)</span>
                      <span className="font-semibold">₹{(selectedPayslip.tax ?? Math.round(profile.baseSalary * 0.1)).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Provident Fund (EPF)</span>
                      <span className="font-semibold">₹{(selectedPayslip.providentFund ?? Math.round(profile.baseSalary * 0.12)).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Professional Tax</span>
                      <span className="font-semibold">₹{(selectedPayslip.professionalTax ?? 200).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Other Deductions</span>
                      <span className="font-semibold">₹{(selectedPayslip.otherDeductions ?? 0).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-gray-200 pt-1 text-gray-900">
                      <span>Total Deductions</span>
                      <span>₹{selectedPayslip.deductions.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net takehome display inside slip */}
              <div className="border-t border-gray-300 pt-4 flex flex-col items-end gap-1.5">
                <div className="flex gap-12 text-sm">
                  <span className="font-bold text-gray-700">NET DISBURSED AMOUNT:</span>
                  <span className="font-black text-gray-900 border-b-2 border-double border-gray-900 pb-0.5">
                    ₹{selectedPayslip.netSalary.toLocaleString("en-IN")}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 italic">Net Salary = Basic + Allowances + Bonus - Deductions</p>
              </div>

              {/* Footer signature line */}
              <div className="pt-16 flex justify-between text-gray-500 text-[10px]">
                <div className="text-center">
                  <div className="w-40 border-b border-gray-300 mb-1" />
                  <p>Employee Signature</p>
                </div>
                <div className="text-center">
                  <div className="w-40 border-b border-gray-300 mb-1" />
                  <p>Authorized Signature &amp; Stamp</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
