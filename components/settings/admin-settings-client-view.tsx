"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { toast } from "sonner";
import {
  Building,
  Calendar,
  Layers,
  Plus,
  Trash2,
  Edit2,
  Clock,
  Globe,
  DollarSign,
  Briefcase,
  X,
} from "lucide-react";
import {
  updateCompanySettingsAction,
  createOrUpdateHolidayAction,
  deleteHolidayAction,
  type CompanySettingsData,
  type HolidayItem,
} from "@/actions/company";
import {
  createDesignationAction,
  deleteDesignationAction,
} from "@/actions/admin";
import { type DesignationEntry } from "@/lib/department-designation";

interface AdminSettingsClientViewProps {
  initialCompany: CompanySettingsData;
  initialHolidays: HolidayItem[];
  initialDesignations: DesignationEntry[];
}

export function AdminSettingsClientView({
  initialCompany,
  initialHolidays,
  initialDesignations,
}: AdminSettingsClientViewProps) {
  const [, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"company" | "holidays" | "designations">("company");

  // Tab 1: Company Profile States
  const [company, setCompany] = useState<CompanySettingsData>(initialCompany);

  // Tab 2: Holiday States
  const [holidays, setHolidays] = useState<HolidayItem[]>(initialHolidays);
  const [isHolidayOpen, setIsHolidayOpen] = useState(false);
  const [holidayForm, setHolidayForm] = useState({
    id: "",
    title: "",
    date: "",
    isOptional: false,
    isRecurring: false,
    category: "Public",
  });

  // Tab 3: Designation States
  const [designations, setDesignations] = useState<DesignationEntry[]>(initialDesignations);
  const [isDesignationOpen, setIsDesignationOpen] = useState(false);
  const [designationForm, setDesignationForm] = useState({
    title: "",
    department: "Engineering",
    hierarchyLevel: 3,
  });

  const handleCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateCompanySettingsAction(company);
      if (res.success) {
        toast.success("Company settings updated successfully!");
      } else {
        toast.error(res.error || "Failed to update settings");
      }
    });
  };

  // Holiday triggers
  const handleOpenAddHoliday = () => {
    setHolidayForm({
      id: "",
      title: "",
      date: new Date().toISOString().split("T")[0],
      isOptional: false,
      isRecurring: false,
      category: "Public",
    });
    setIsHolidayOpen(true);
  };

  const handleOpenEditHoliday = (h: HolidayItem) => {
    setHolidayForm({
      id: h.id,
      title: h.title,
      date: new Date(h.date).toISOString().split("T")[0],
      isOptional: h.isOptional,
      isRecurring: h.isRecurring,
      category: h.category,
    });
    setIsHolidayOpen(true);
  };

  const handleHolidaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayForm.title || !holidayForm.date) {
      toast.error("Please fill in holiday title and date.");
      return;
    }

    startTransition(async () => {
      const res = await createOrUpdateHolidayAction(holidayForm);
      if (res.success) {
        toast.success("Holiday entry saved successfully!");
        setIsHolidayOpen(false);
        // Refresh local list mapping (simple reload simulation or refresh state)
        window.location.reload();
      } else {
        toast.error(res.error || "Save failed");
      }
    });
  };

  const handleDeleteHoliday = (id: string) => {
    if (!window.confirm("Are you sure you want to delete this holiday?")) return;

    startTransition(async () => {
      const res = await deleteHolidayAction(id);
      if (res.success) {
        toast.success("Holiday entry deleted!");
        setHolidays(holidays.filter((h) => h.id !== id));
      } else {
        toast.error(res.error || "Delete failed");
      }
    });
  };

  // Designation triggers
  const handleDesignationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!designationForm.title) {
      toast.error("Please fill in designation title.");
      return;
    }

    startTransition(async () => {
      const res = await createDesignationAction(
        designationForm.title,
        designationForm.department,
        Number(designationForm.hierarchyLevel)
      );
      if (res.success) {
        toast.success("Designation created successfully!");
        setIsDesignationOpen(false);
        setDesignations([
          ...designations,
          {
            title: designationForm.title,
            department: designationForm.department,
            hierarchyLevel: Number(designationForm.hierarchyLevel),
          },
        ]);
      } else {
        toast.error(res.error || "Creation failed");
      }
    });
  };

  const handleDeleteDesignation = (title: string) => {
    if (!window.confirm(`Are you sure you want to delete the job title "${title}"?`)) return;

    startTransition(async () => {
      const res = await deleteDesignationAction(title);
      if (res.success) {
        toast.success("Designation deleted successfully!");
        setDesignations(designations.filter((d) => d.title !== title));
      } else {
        toast.error(res.error || "Delete failed");
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-xs select-none">
      {/* Settings Navigation list */}
      <Card className="glass border-[var(--border)] lg:col-span-1">
        <CardContent className="p-3 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible">
          <button
            onClick={() => setActiveTab("company")}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-[var(--radius-lg)] font-semibold transition-all ${
              activeTab === "company" ? "bg-[var(--accent-subtle)] text-[var(--accent)]" : "text-[var(--text-secondary)] hover:bg-[var(--surface-raised)]"
            }`}
          >
            <Building className="h-4 w-4" /> Company details
          </button>
          <button
            onClick={() => setActiveTab("holidays")}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-[var(--radius-lg)] font-semibold transition-all ${
              activeTab === "holidays" ? "bg-[var(--accent-subtle)] text-[var(--accent)]" : "text-[var(--text-secondary)] hover:bg-[var(--surface-raised)]"
            }`}
          >
            <Calendar className="h-4 w-4" /> Holiday Schedule
          </button>
          <button
            onClick={() => setActiveTab("designations")}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-[var(--radius-lg)] font-semibold transition-all ${
              activeTab === "designations" ? "bg-[var(--accent-subtle)] text-[var(--accent)]" : "text-[var(--text-secondary)] hover:bg-[var(--surface-raised)]"
            }`}
          >
            <Layers className="h-4 w-4" /> Job Designations
          </button>
        </CardContent>
      </Card>

      {/* Main Configurations panel */}
      <Card className="glass border-[var(--border)] lg:col-span-3">
        <CardContent className="p-6">
          {activeTab === "company" && (
            <form onSubmit={handleCompanySubmit} className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Corporate Preferences</h3>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Configure organization-wide defaults, timezone rules, and weekly offs.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Company Name"
                  placeholder="Nexus Enterprise"
                  leftIcon={<Building className="h-4 w-4" />}
                  value={company.companyName}
                  onChange={(e) => setCompany({ ...company, companyName: e.target.value })}
                />
                <Input
                  label="Timezone Offset"
                  placeholder="UTC+05:30"
                  leftIcon={<Globe className="h-4 w-4" />}
                  value={company.timezone}
                  onChange={(e) => setCompany({ ...company, timezone: e.target.value })}
                />
                <Input
                  label="Office Timing Hours"
                  placeholder="09:00 - 18:00"
                  leftIcon={<Clock className="h-4 w-4" />}
                  value={company.officeTiming}
                  onChange={(e) => setCompany({ ...company, officeTiming: e.target.value })}
                />
                <Input
                  label="Weekly Off Days"
                  placeholder="Saturday, Sunday"
                  leftIcon={<Calendar className="h-4 w-4" />}
                  value={company.weeklyOff}
                  onChange={(e) => setCompany({ ...company, weeklyOff: e.target.value })}
                />
                <Input
                  label="Corporate Currency"
                  placeholder="INR"
                  leftIcon={<DollarSign className="h-4 w-4" />}
                  value={company.currency}
                  onChange={(e) => setCompany({ ...company, currency: e.target.value })}
                />
                <Input
                  label="Active Financial Year"
                  placeholder="2026-2027"
                  leftIcon={<Briefcase className="h-4 w-4" />}
                  value={company.financialYear}
                  onChange={(e) => setCompany({ ...company, financialYear: e.target.value })}
                />
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="font-bold text-[var(--text-secondary)] uppercase">Company Registered Address</label>
                  <textarea
                    rows={2}
                    className="w-full p-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text-primary)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    value={company.address || ""}
                    onChange={(e) => setCompany({ ...company, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end border-t border-[var(--border-subtle)] pt-4 mt-6">
                <Button type="submit" variant="primary">
                  Save settings configuration
                </Button>
              </div>
            </form>
          )}

          {activeTab === "holidays" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <Calendar className="h-4.5 w-4.5 text-[var(--accent)]" /> Annual Holiday Calendar
                  </h3>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Manage optional and national holiday lists visible on employee dashboards.</p>
                </div>
                <Button variant="primary" size="sm" onClick={handleOpenAddHoliday}>
                  <Plus className="h-4 w-4 mr-1" /> Add Holiday
                </Button>
              </div>

              <div className="border border-[var(--border-subtle)] rounded-[var(--radius-xl)] overflow-hidden bg-[var(--surface)]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Holiday Date</TableHead>
                      <TableHead>Holiday Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Recurring</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {holidays.length > 0 ? (
                      holidays.map((h) => (
                        <TableRow key={h.id}>
                          <TableCell className="font-semibold">{new Date(h.date).toLocaleDateString("en-IN")}</TableCell>
                          <TableCell className="font-semibold text-xs text-[var(--text-primary)]">{h.title}</TableCell>
                          <TableCell>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[var(--surface-raised)] border border-[var(--border-subtle)]">
                              {h.category}
                            </span>
                          </TableCell>
                          <TableCell>{h.isRecurring ? "Yes" : "No"}</TableCell>
                          <TableCell>{h.isOptional ? "Optional (Restricted)" : "Compulsory (Gazetted)"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon-sm" onClick={() => handleOpenEditHoliday(h)}>
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-[var(--danger)] hover:bg-[var(--danger-subtle)]"
                                onClick={() => handleDeleteHoliday(h.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6">
                          No company holidays registered yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {activeTab === "designations" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <Layers className="h-4.5 w-4.5 text-[var(--accent)]" /> Job Designations &amp; Hierarchy
                  </h3>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Manage hierarchical roles mapping across organization departments.</p>
                </div>
                <Button variant="primary" size="sm" onClick={() => setIsDesignationOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Add Job Role
                </Button>
              </div>

              <div className="border border-[var(--border-subtle)] rounded-[var(--radius-xl)] overflow-hidden bg-[var(--surface)]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Designation Title</TableHead>
                      <TableHead>Department Mapping</TableHead>
                      <TableHead>Hierarchy Scale</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {designations.length > 0 ? (
                      designations.map((d, idx) => (
                        <TableRow key={`des-${idx}`}>
                          <TableCell className="font-semibold text-xs text-[var(--text-primary)]">{d.title}</TableCell>
                          <TableCell>{d.department}</TableCell>
                          <TableCell>
                            Level {d.hierarchyLevel} (
                            {d.hierarchyLevel === 1 ? "Executive Director" : d.hierarchyLevel === 2 ? "Senior Manager" : "Staff Generalist"}
                            )
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-[var(--danger)] hover:bg-[var(--danger-subtle)]"
                              onClick={() => handleDeleteDesignation(d.title)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6">
                          No designations mapped.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Holiday form modal */}
      {isHolidayOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setIsHolidayOpen(false)} />
          <div className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-2xl)] z-10 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-subtle)]">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                {holidayForm.id ? "Edit Holiday schedule" : "Register Company Holiday"}
              </h3>
              <Button variant="ghost" size="icon-sm" onClick={() => setIsHolidayOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleHolidaySubmit} className="p-5 space-y-4 text-xs">
              <Input
                label="Holiday Title"
                placeholder="Independance Day"
                value={holidayForm.title}
                onChange={(e) => setHolidayForm({ ...holidayForm, title: e.target.value })}
              />
              <Input
                label="Holiday Date"
                type="date"
                value={holidayForm.date}
                onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
              />

              <div className="flex flex-col gap-1">
                <label className="font-bold text-[var(--text-secondary)] uppercase">Category classification</label>
                <select
                  className="h-10 px-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-xs"
                  value={holidayForm.category}
                  onChange={(e) => setHolidayForm({ ...holidayForm, category: e.target.value })}
                >
                  <option value="National">National (Public Gazetted)</option>
                  <option value="Restricted">Restricted (Restricted optional)</option>
                  <option value="Regional">Regional (State holidays)</option>
                  <option value="Company">Company Holiday</option>
                </select>
              </div>

              <div className="flex items-center justify-between bg-[var(--surface-raised)] border border-[var(--border-subtle)] p-3 rounded-[var(--radius-xl)] font-semibold mt-2">
                <div>
                  <p className="text-[var(--text-primary)]">Restricted Optional Holiday</p>
                  <p className="text-[9px] text-[var(--text-muted)] font-medium">Employee requires approvals to select this off day.</p>
                </div>
                <input
                  type="checkbox"
                  checked={holidayForm.isOptional}
                  onChange={(e) => setHolidayForm({ ...holidayForm, isOptional: e.target.checked })}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
              </div>

              <div className="flex items-center justify-between bg-[var(--surface-raised)] border border-[var(--border-subtle)] p-3 rounded-[var(--radius-xl)] font-semibold">
                <div>
                  <p className="text-[var(--text-primary)]">Recurring Annual Holiday</p>
                  <p className="text-[9px] text-[var(--text-muted)] font-medium">Auto-populates calendar logs every fiscal year.</p>
                </div>
                <input
                  type="checkbox"
                  checked={holidayForm.isRecurring}
                  onChange={(e) => setHolidayForm({ ...holidayForm, isRecurring: e.target.checked })}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-[var(--border-subtle)] pt-4 mt-6">
                <Button type="button" variant="outline" onClick={() => setIsHolidayOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Save Holiday
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Designation form modal */}
      {isDesignationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setIsDesignationOpen(false)} />
          <div className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-2xl)] z-10 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-subtle)]">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Create Job Designation</h3>
              <Button variant="ghost" size="icon-sm" onClick={() => setIsDesignationOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleDesignationSubmit} className="p-5 space-y-4 text-xs">
              <Input
                label="Role Title"
                placeholder="Lead Frontend Engineer"
                value={designationForm.title}
                onChange={(e) => setDesignationForm({ ...designationForm, title: e.target.value })}
              />

              <div className="flex flex-col gap-1">
                <label className="font-bold text-[var(--text-secondary)] uppercase">Department mapping</label>
                <select
                  className="h-10 px-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-xs"
                  value={designationForm.department}
                  onChange={(e) => setDesignationForm({ ...designationForm, department: e.target.value })}
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Design">Design</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Operations">Operations</option>
                  <option value="HR">HR</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-[var(--text-secondary)] uppercase">Hierarchy Scale level</label>
                <select
                  className="h-10 px-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-xs"
                  value={designationForm.hierarchyLevel}
                  onChange={(e) => setDesignationForm({ ...designationForm, hierarchyLevel: Number(e.target.value) })}
                >
                  <option value="1">Level 1 (Executive director / Head)</option>
                  <option value="2">Level 2 (Senior / Manager)</option>
                  <option value="3">Level 3 (Staff / Generalist)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 border-t border-[var(--border-subtle)] pt-4 mt-6">
                <Button type="button" variant="outline" onClick={() => setIsDesignationOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Create Designation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
