import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAdminDashboardDataAction } from "@/actions/dashboard";
import { PageContainer, PageHeader } from "@/components/layout/page-container";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardWidgets } from "@/components/dashboard/dashboard-widgets";
import { DemoPanel } from "@/components/admin/demo-panel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, CalendarCheck, FileText, CreditCard, Plus } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { DashboardLeaveApprover } from "@/components/admin/dashboard-leave-approver";
import { DashboardEmployeeList } from "@/components/admin/dashboard-employee-list";

export const metadata: Metadata = {
  title: "Admin Dashboard | HRMS",
};

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  const employees = await db.user.findMany({
    where: { role: "EMPLOYEE" },
    include: { profile: true },
    orderBy: { createdAt: "desc" },
  });

  const res = await getAdminDashboardDataAction();
  if (!res.success || !res.data) {
    return (
      <PageContainer>
        <PageHeader title="Admin Dashboard" subtitle="Organization-wide HR overview." />
        <div className="p-5 rounded-[var(--radius-xl)] bg-[var(--danger-subtle)] border border-[var(--danger-border)] text-[var(--danger)] text-sm font-semibold">
          Error: {res.error || "Failed to load admin dashboard statistics."}
        </div>
      </PageContainer>
    );
  }

  const data = res.data;

  return (
    <PageContainer>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Organization-wide HR overview."
        actions={
          <Link href="/admin/employees">
            <Button size="sm" variant="primary">
              <Plus /> Manage Workforce
            </Button>
          </Link>
        }
      />

      <div className="mb-6">
        <DemoPanel />
      </div>

      {/* Org Stats dynamically queried */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Employees"
          value={data.totalEmployees}
          subtitle="Active headcount"
          icon={<Users />}
          iconColor="indigo"
        />
        <StatCard
          title="Present Today"
          value={data.presentToday}
          subtitle={`${data.attendanceRate}% attendance rate`}
          icon={<CalendarCheck />}
          iconColor="emerald"
        />
        <StatCard
          title="Open Leave Requests"
          value={data.openLeaves}
          subtitle="Awaiting approval"
          icon={<FileText />}
          iconColor="amber"
        />
        <StatCard
          title="Monthly Payroll"
          value={
            data.monthlyPayrollEstimate > 0
              ? `₹${(data.monthlyPayrollEstimate / 100000).toFixed(2)}L`
              : "₹0.00L"
          }
          subtitle="Processed this month"
          icon={<CreditCard />}
          iconColor="violet"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Attendance today */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Department Attendance</CardTitle>
                  <CardDescription>Today&apos;s attendance rate by department</CardDescription>
                </div>
                <Badge variant="success" dot>
                  Live
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.departmentAttendance.map((row, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-[var(--text-primary)]">
                        {row.dept}
                      </span>
                      <span className="text-xs text-[var(--text-muted)] font-medium">
                        {row.present} / {row.total} present
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[var(--surface-raised)] border border-[var(--border-subtle)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-350"
                        style={{ width: `${row.rate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Leave Requests */}
        <div>
          <DashboardLeaveApprover
            initialLeaves={data.recentLeaves}
            openLeavesCount={data.openLeaves}
          />
        </div>
      </div>

      {/* Workforce Directory */}
      <div className="mt-8">
        <DashboardEmployeeList employees={employees} />
      </div>

      <div className="mt-8 border-t border-[var(--border-subtle)] pt-8">
        <DashboardWidgets isAdmin={true} />
      </div>
    </PageContainer>
  );
}

