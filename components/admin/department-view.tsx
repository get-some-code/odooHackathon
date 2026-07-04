"use client";

import * as React from "react";
import { useState, useEffect, useTransition, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Shield, Briefcase, X } from "lucide-react";
import {
  getDepartmentStatsAction,
  getDesignationStatsAction,
  createDepartmentAction,
  deleteDepartmentAction,
  renameDepartmentAction,
  createDesignationAction,
  deleteDesignationAction,
} from "@/actions/admin";

export function DepartmentView() {
  const [, startTransition] = useTransition();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [departments, setDepartments] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [designations, setDesignations] = useState<any[]>([]);

  // Modal States: Dept
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [deptMode, setDeptMode] = useState<"CREATE" | "EDIT">("CREATE");
  const [targetDeptName, setTargetDeptName] = useState("");
  const [deptForm, setDeptForm] = useState({
    name: "",
    description: "",
    managerName: "",
  });

  // Modal States: Designation
  const [isTitleModalOpen, setIsTitleModalOpen] = useState(false);
  const [titleForm, setTitleForm] = useState({
    title: "",
    department: "Engineering",
    level: 3,
  });

  const fetchData = useCallback(async () => {
    const [deptRes, desRes] = await Promise.all([
      getDepartmentStatsAction(),
      getDesignationStatsAction(),
    ]);

    if (deptRes.success && deptRes.data) {
      setDepartments(deptRes.data);
    }
    if (desRes.success && desRes.data) {
      setDesignations(desRes.data);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Dept CRUD
  const handleOpenCreateDept = () => {
    setDeptMode("CREATE");
    setDeptForm({ name: "", description: "", managerName: "" });
    setIsDeptModalOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleOpenEditDept = (dept: any) => {
    setDeptMode("EDIT");
    setTargetDeptName(dept.name);
    setDeptForm({
      name: dept.name,
      description: dept.description || "",
      managerName: dept.managerName || "",
    });
    setIsDeptModalOpen(true);
  };

  const handleDeptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.name) {
      toast.error("Department name is required");
      return;
    }

    startTransition(async () => {
      let res;
      if (deptMode === "CREATE") {
        res = await createDepartmentAction(deptForm.name, deptForm.description, deptForm.managerName);
      } else {
        res = await renameDepartmentAction(targetDeptName, deptForm.name, deptForm.managerName);
      }

      if (res.success) {
        toast.success(deptMode === "CREATE" ? "Department created!" : "Department updated!");
        setIsDeptModalOpen(false);
        fetchData();
      } else {
        toast.error(res.error || "Action failed");
      }
    });
  };

  const handleDeleteDept = (name: string) => {
    if (!window.confirm(`Are you sure you want to delete the ${name} department?`)) return;

    startTransition(async () => {
      const res = await deleteDepartmentAction(name);
      if (res.success) {
        toast.success("Department deleted!");
        fetchData();
      } else {
        toast.error(res.error || "Delete failed");
      }
    });
  };

  // Designation CRUD
  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleForm.title) {
      toast.error("Job title is required");
      return;
    }

    startTransition(async () => {
      const res = await createDesignationAction(titleForm.title, titleForm.department, Number(titleForm.level));
      if (res.success) {
        toast.success("Job title created!");
        setIsTitleModalOpen(false);
        setTitleForm({ title: "", department: "Engineering", level: 3 });
        fetchData();
      } else {
        toast.error(res.error || "Action failed");
      }
    });
  };

  const handleDeleteTitle = (title: string) => {
    if (!window.confirm(`Are you sure you want to delete the ${title} job title?`)) return;

    startTransition(async () => {
      const res = await deleteDesignationAction(title);
      if (res.success) {
        toast.success("Job title deleted!");
        fetchData();
      } else {
        toast.error(res.error || "Delete failed");
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Departments management */}
      <Card className="glass border-[var(--border)]">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[var(--accent)]" /> Department Directory
            </CardTitle>
            <CardDescription>Manage company branches, assign managers, and view stats.</CardDescription>
          </div>
          <Button variant="primary" size="sm" onClick={handleOpenCreateDept}>
            <Plus className="h-4 w-4 mr-1" /> Add Dept
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department Name</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Headcount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((dept) => (
                <TableRow key={dept.name}>
                  <TableCell>
                    <div>
                      <p className="font-semibold text-sm">{dept.name}</p>
                      <p className="text-[10px] text-[var(--text-muted)] truncate max-w-[200px]" title={dept.description}>
                        {dept.description || "No description"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-xs">
                    {dept.managerName || "Unassigned"}
                  </TableCell>
                  <TableCell className="font-mono text-xs font-semibold">
                    {dept.employeeCount} {dept.employeeCount === 1 ? "member" : "members"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button variant="ghost" size="icon-sm" onClick={() => handleOpenEditDept(dept)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" className="text-[var(--danger)] hover:bg-[var(--danger-subtle)]" onClick={() => handleDeleteDept(dept.name)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 2. Job Titles / Designations */}
      <Card className="glass border-[var(--border)]">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-amber-500" /> Job Designations
            </CardTitle>
            <CardDescription>Manage corporate roles, titles, and hierarchical levels.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsTitleModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Title
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Designation Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Tier Level</TableHead>
                <TableHead>Headcount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {designations.map((title) => (
                <TableRow key={title.title}>
                  <TableCell className="font-semibold">{title.title}</TableCell>
                  <TableCell className="text-xs">{title.department}</TableCell>
                  <TableCell>
                    <span className="text-[10px] font-bold uppercase bg-[var(--surface-raised)] border border-[var(--border-subtle)] px-2 py-0.5 rounded-full">
                      Level {title.hierarchyLevel}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-semibold">
                    {title.employeeCount} {title.employeeCount === 1 ? "staff" : "staff"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon-sm" className="text-[var(--danger)] hover:bg-[var(--danger-subtle)]" onClick={() => handleDeleteTitle(title.title)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Department Modal */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setIsDeptModalOpen(false)} />
          <div className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-2xl)] z-10 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-subtle)]">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                {deptMode === "CREATE" ? "Register Department" : "Edit Department details"}
              </h3>
              <Button variant="ghost" size="icon-sm" onClick={() => setIsDeptModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleDeptSubmit} className="p-5 space-y-4 text-xs">
              <Input
                label="Department Name (Required)"
                placeholder="e.g. Sales"
                value={deptForm.name}
                onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
              />
              <Input
                label="Description"
                placeholder="Product design and marketing assets..."
                value={deptForm.description}
                onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
              />
              <Input
                label="Manager Name"
                placeholder="John Doe"
                value={deptForm.managerName}
                onChange={(e) => setDeptForm({ ...deptForm, managerName: e.target.value })}
              />
              <div className="flex justify-end gap-2 border-t border-[var(--border-subtle)] pt-4 mt-4">
                <Button type="button" variant="outline" onClick={() => setIsDeptModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary">
                  {deptMode === "CREATE" ? "Create Department" : "Save Department"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Designation Modal */}
      {isTitleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setIsTitleModalOpen(false)} />
          <div className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-2xl)] z-10 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-subtle)]">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Register Designation Title</h3>
              <Button variant="ghost" size="icon-sm" onClick={() => setIsTitleModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleTitleSubmit} className="p-5 space-y-4 text-xs">
              <Input
                label="Designation Job Title (Required)"
                placeholder="e.g. Senior Product Manager"
                value={titleForm.title}
                onChange={(e) => setTitleForm({ ...titleForm, title: e.target.value })}
              />
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">Department</label>
                <select
                  className="h-10 px-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]"
                  value={titleForm.department}
                  onChange={(e) => setTitleForm({ ...titleForm, department: e.target.value })}
                >
                  {departments.map((d) => (
                    <option key={`title-opt-${d.name}`} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">Hierarchy Tier Level</label>
                <select
                  className="h-10 px-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]"
                  value={titleForm.level}
                  onChange={(e) => setTitleForm({ ...titleForm, level: Number(e.target.value) })}
                >
                  <option value="1">Level 1 (Executive Director / Lead)</option>
                  <option value="2">Level 2 (Senior Analyst / Staff)</option>
                  <option value="3">Level 3 (Associate Engineer / Junior)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 border-t border-[var(--border-subtle)] pt-4 mt-4">
                <Button type="button" variant="outline" onClick={() => setIsTitleModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary">Create Job Title</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
