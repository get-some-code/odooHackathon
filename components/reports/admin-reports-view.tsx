"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { toast } from "sonner";
import {
  FileSpreadsheet,
  Printer,
  Search,
  Users,
  FolderOpen,
  History,
} from "lucide-react";
import {
  type HRMSReportsData,
} from "@/actions/reports";

interface AdminReportsViewProps {
  initialData: HRMSReportsData;
}

export function AdminReportsView({ initialData }: AdminReportsViewProps) {
  const [activeTab, setActiveTab] = useState<"employees" | "documents" | "lifecycle">("employees");
  const [search, setSearch] = useState("");

  // Filter lists locally based on active tab and query search
  const filteredEmployees = useMemo(() => {
    if (!search.trim()) return initialData.employees;
    const q = search.toLowerCase();
    return initialData.employees.filter(
      (e) =>
        e.fullName.toLowerCase().includes(q) ||
        e.employeeId.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q) ||
        e.designation.toLowerCase().includes(q)
    );
  }, [initialData.employees, search]);

  const filteredDocuments = useMemo(() => {
    if (!search.trim()) return initialData.documents;
    const q = search.toLowerCase();
    return initialData.documents.filter(
      (d) =>
        d.employeeName.toLowerCase().includes(q) ||
        d.employeeId.toLowerCase().includes(q) ||
        d.fileName.toLowerCase().includes(q) ||
        d.fileType.toLowerCase().includes(q) ||
        d.status.toLowerCase().includes(q)
    );
  }, [initialData.documents, search]);

  const filteredLifecycle = useMemo(() => {
    if (!search.trim()) return initialData.lifecycle;
    const q = search.toLowerCase();
    return initialData.lifecycle.filter(
      (l) =>
        l.employeeName.toLowerCase().includes(q) ||
        l.employeeId.toLowerCase().includes(q) ||
        l.newStatus.toLowerCase().includes(q) ||
        (l.reason && l.reason.toLowerCase().includes(q))
    );
  }, [initialData.lifecycle, search]);

  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = "";

    if (activeTab === "employees") {
      headers = ["Employee ID", "Full Name", "Email", "Department", "Designation", "Joining Date", "Status"];
      rows = filteredEmployees.map((e) => [
        `"${e.employeeId}"`,
        `"${e.fullName}"`,
        `"${e.email}"`,
        `"${e.department}"`,
        `"${e.designation}"`,
        `"${e.joiningDate}"`,
        `"${e.status}"`,
      ]);
      filename = "Employee_Directory_Report.csv";
    } else if (activeTab === "documents") {
      headers = ["Employee ID", "Employee Name", "File Name", "File Type", "Verification Status", "Feedback Comment", "Upload Date"];
      rows = filteredDocuments.map((d) => [
        `"${d.employeeId}"`,
        `"${d.employeeName}"`,
        `"${d.fileName}"`,
        `"${d.fileType}"`,
        `"${d.status}"`,
        `"${d.adminComment || ""}"`,
        `"${d.uploadedAt}"`,
      ]);
      filename = "Document_Verification_Report.csv";
    } else if (activeTab === "lifecycle") {
      headers = ["Employee ID", "Employee Name", "Old Status", "New Status", "Change Reason", "Effective Date", "Updated By"];
      rows = filteredLifecycle.map((l) => [
        `"${l.employeeId}"`,
        `"${l.employeeName}"`,
        `"${l.oldStatus || "Active"}"`,
        `"${l.newStatus}"`,
        `"${l.reason || ""}"`,
        `"${l.date}"`,
        `"${l.updatedBy}"`,
      ]);
      filename = "Employee_Lifecycle_Report.csv";
    }

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    toast.success(`${filename} exported successfully!`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 text-xs select-none">
      {/* Print media stylesheet */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #print-report-section, #print-report-section * {
            visibility: visible;
          }
          #print-report-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 15px !important;
          }
        }
      `}} />

      {/* Tab Selectors and Search panel */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[var(--surface-raised)] border border-[var(--border-subtle)] p-4 rounded-[var(--radius-xl)]">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <button
            onClick={() => { setActiveTab("employees"); setSearch(""); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-[var(--radius-lg)] font-semibold whitespace-nowrap transition-all ${
              activeTab === "employees" ? "bg-[var(--accent)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--surface)]"
            }`}
          >
            <Users className="h-4 w-4" /> Employee Directory
          </button>
          <button
            onClick={() => { setActiveTab("documents"); setSearch(""); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-[var(--radius-lg)] font-semibold whitespace-nowrap transition-all ${
              activeTab === "documents" ? "bg-[var(--accent)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--surface)]"
            }`}
          >
            <FolderOpen className="h-4 w-4" /> Document Verification
          </button>
          <button
            onClick={() => { setActiveTab("lifecycle"); setSearch(""); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-[var(--radius-lg)] font-semibold whitespace-nowrap transition-all ${
              activeTab === "lifecycle" ? "bg-[var(--accent)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--surface)]"
            }`}
          >
            <History className="h-4 w-4" /> Employee Lifecycle
          </button>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="relative w-full md:w-56">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Filter list values..."
              className="w-full h-9 pl-9 pr-3 rounded-[var(--radius-lg)] border border-[var(--border)] text-xs bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Button variant="outline" size="sm" className="h-9 whitespace-nowrap" onClick={handleExportCSV}>
            <FileSpreadsheet className="h-3.5 w-3.5 mr-1" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" className="h-9 whitespace-nowrap" onClick={handlePrint}>
            <Printer className="h-3.5 w-3.5 mr-1" /> Print
          </Button>
        </div>
      </div>

      {/* Main Reports Table Board */}
      <Card className="glass border-[var(--border)] overflow-hidden" id="print-report-section">
        <CardContent className="p-0">
          {/* Company Title for print layouts */}
          <div className="hidden print:block p-6 border-b border-gray-300 mb-4">
            <h1 className="text-lg font-black text-gray-900">NEXUS ENTERPRISE HRMS</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">
              Consolidated Audit Report: {activeTab === "employees" ? "Employee Directory" : activeTab === "documents" ? "Document Vault Status" : "Lifecycle Transitions Timeline"}
            </p>
          </div>

          {activeTab === "employees" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Joined Date</TableHead>
                  <TableHead>Profile Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((e) => (
                    <TableRow key={e.employeeId}>
                      <TableCell className="font-semibold">{e.employeeId}</TableCell>
                      <TableCell className="font-semibold text-[var(--text-primary)]">{e.fullName}</TableCell>
                      <TableCell>{e.department}</TableCell>
                      <TableCell>{e.designation}</TableCell>
                      <TableCell>{e.joiningDate}</TableCell>
                      <TableCell>
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-indigo-500">
                          {e.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">No employees found in report filter.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}

          {activeTab === "documents" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Employee Name</TableHead>
                  <TableHead>Document File</TableHead>
                  <TableHead>Classification</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Feedback Comment</TableHead>
                  <TableHead>Submitted On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.length > 0 ? (
                  filteredDocuments.map((d, idx) => (
                    <TableRow key={`doc-row-${idx}`}>
                      <TableCell className="font-semibold">{d.employeeId}</TableCell>
                      <TableCell className="font-semibold text-[var(--text-primary)]">{d.employeeName}</TableCell>
                      <TableCell>{d.fileName}</TableCell>
                      <TableCell>{d.fileType}</TableCell>
                      <TableCell>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          d.status === "VERIFIED" ? "text-emerald-500 bg-emerald-500/10" : d.status === "REJECTED" ? "text-red-500 bg-red-500/10" : "text-amber-500 bg-amber-500/10"
                        }`}>
                          {d.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-[10px] text-[var(--text-muted)] max-w-[200px] truncate">{d.adminComment || "—"}</TableCell>
                      <TableCell>{d.uploadedAt}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">No documents found in report filter.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}

          {activeTab === "lifecycle" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Employee Name</TableHead>
                  <TableHead>Old Status</TableHead>
                  <TableHead>New Status</TableHead>
                  <TableHead>Transition Reason</TableHead>
                  <TableHead>Effective Date</TableHead>
                  <TableHead>Updated By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLifecycle.length > 0 ? (
                  filteredLifecycle.map((l, idx) => (
                    <TableRow key={`life-row-${idx}`}>
                      <TableCell className="font-semibold">{l.employeeId}</TableCell>
                      <TableCell className="font-semibold text-[var(--text-primary)]">{l.employeeName}</TableCell>
                      <TableCell className="text-[var(--text-muted)]">{l.oldStatus || "Active"}</TableCell>
                      <TableCell className="font-bold text-indigo-500">{l.newStatus}</TableCell>
                      <TableCell className="text-[10px] max-w-[200px] truncate">{l.reason || "—"}</TableCell>
                      <TableCell>{l.date}</TableCell>
                      <TableCell>{l.updatedBy}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">No lifecycle events recorded.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
