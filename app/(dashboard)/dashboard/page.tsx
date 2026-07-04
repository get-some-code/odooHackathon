import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDashboardDataAction } from "@/actions/dashboard";
import { PageContainer, PageHeader } from "@/components/layout/page-container";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardWidgets } from "@/components/dashboard/dashboard-widgets";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusChip } from "@/components/ui/status-chip";
import { EmptyState } from "@/components/ui/empty-state";
import { CalendarCheck, FileText, CreditCard, Clock, Calendar, Bell } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | HRMS",
};

export default async function EmployeeDashboard() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const res = await getDashboardDataAction();
  if (!res.success || !res.data) {
    return (
      <PageContainer>
        <PageHeader title="Welcome 👋" subtitle="Organization Human Resource Management System" />
        <div className="p-5 rounded-[var(--radius-xl)] bg-[var(--danger-subtle)] border border-[var(--danger-border)] text-[var(--danger)] text-sm font-semibold">
          Error: {res.error || "Failed to load dashboard data. Please try again later."}
        </div>
      </PageContainer>
    );
  }

  const data = res.data;

  // Formatting date/time helpers for table display
  const formatTime = (date: Date | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      weekday: "short",
    });
  };

  return (
    <PageContainer>
      <PageHeader
        title={`Good morning, ${session.firstName} 👋`}
        subtitle="Here's what's happening with your HR today."
      />

      {/* Stat Cards connected to real database counts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Days Present"
          value={data.presentDays}
          subtitle="This month"
          icon={<CalendarCheck />}
          iconColor="emerald"
        />
        <StatCard
          title="Leave Balance"
          value={data.leaveBalance}
          subtitle="Days remaining"
          icon={<FileText />}
          iconColor="indigo"
        />
        <StatCard
          title="Pending Requests"
          value={data.pendingLeaves}
          subtitle="Awaiting approval"
          icon={<Clock />}
          iconColor="amber"
        />
        <StatCard
          title="Net Salary"
          value={data.netSalary > 0 ? `₹${data.netSalary.toLocaleString("en-IN")}` : "—"}
          subtitle="Latest processed"
          icon={<CreditCard />}
          iconColor="violet"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Attendance */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Attendance</CardTitle>
                  <CardDescription>Your last 5 active logs</CardDescription>
                </div>
                <Badge variant="primary" dot>Live</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {data.recentAttendance.length > 0 ? (
                <div className="space-y-3">
                  {data.recentAttendance.map((row) => (
                    <div
                      key={row.id}
                      className="flex items-center justify-between py-2.5 border-b border-[var(--border-subtle)] last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <StatusChip status={row.status.toLowerCase() as "present" | "absent" | "half_day" | "leave" | "pending"} />
                        <span className="text-sm font-medium text-[var(--text-secondary)]">
                          {formatDate(row.date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                        <span>
                          In:{" "}
                          <span className="font-semibold text-[var(--text-secondary)]">
                            {formatTime(row.checkIn)}
                          </span>
                        </span>
                        <span>
                          Out:{" "}
                          <span className="font-semibold text-[var(--text-secondary)]">
                            {formatTime(row.checkOut)}
                          </span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<CalendarCheck className="h-5 w-5" />}
                  title="No attendance records"
                  description="Your check-in history will be loaded once you check in."
                  className="border-0 py-6"
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick panels */}
        <div className="space-y-5">
          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming</CardTitle>
              <CardDescription>Events &amp; holidays (Next 30 days)</CardDescription>
            </CardHeader>
            <CardContent>
              {data.upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {data.upcomingEvents.map((evt, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-2.5 rounded-[var(--radius-lg)] hover:bg-[var(--surface-raised)] transition-colors text-sm"
                    >
                      <div
                        className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${
                          evt.type === "holiday" ? "bg-[var(--warning)]" : "bg-[var(--accent)]"
                        }`}
                      />
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">{evt.title}</p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {formatDate(evt.date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Calendar className="h-5 w-5" />}
                  title="No upcoming events"
                  description="No holidays or approved leaves in the next 30 days."
                  className="border-0 py-6"
                />
              )}
            </CardContent>
          </Card>

          {/* Dynamic Notifications */}
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              {data.notifications.length > 0 ? (
                <div className="space-y-3">
                  {data.notifications.map((n) => (
                    <div
                      key={n.id}
                      className="flex gap-3 items-start p-2.5 rounded-[var(--radius-lg)] hover:bg-[var(--surface-raised)] transition-colors text-sm"
                    >
                      <div className="shrink-0 mt-0.5">
                        <Badge
                          variant={
                            n.type === "success"
                              ? "success"
                              : n.type === "error"
                              ? "danger"
                              : n.type === "warning"
                              ? "warning"
                              : "default"
                          }
                          dot
                          className="px-0 py-0 h-4.5 w-4.5 items-center justify-center border-none"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[var(--text-primary)] leading-tight">{n.title}</p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">{n.description}</p>
                        <span className="text-[10px] text-[var(--text-muted)] mt-1 block">
                          {new Date(n.time).toLocaleDateString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Bell className="h-5 w-5" />}
                  title="You're all caught up"
                  description="No recent notification alerts."
                  className="border-0 py-6"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-8 border-t border-[var(--border-subtle)] pt-8">
        <DashboardWidgets />
      </div>
    </PageContainer>
  );
}
