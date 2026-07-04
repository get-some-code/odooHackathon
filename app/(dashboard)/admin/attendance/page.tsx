import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAdminDashboardDataAction } from "@/actions/dashboard";
import { PageContainer, PageHeader } from "@/components/layout/page-container";
import { AdminAttendanceView } from "@/components/attendance/admin-attendance-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Attendance Registry | Admin",
  description: "Monitor and manage organization-wide employee attendance sheets.",
};

export default async function AdminAttendancePage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  // Fetch initial active count widgets from Admin Dashboard server logic
  const countsRes = await getAdminDashboardDataAction();

  const initialCounts = countsRes.success && countsRes.data
    ? {
        totalEmployees: countsRes.data.totalEmployees,
        presentToday: countsRes.data.presentToday,
        openLeaves: countsRes.data.openLeaves,
        attendanceRate: countsRes.data.attendanceRate,
      }
    : {
        totalEmployees: 0,
        presentToday: 0,
        openLeaves: 0,
        attendanceRate: 0,
      };

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Attendance Registry"
        subtitle="Monitor organization active attendance records, punch timelines, and analytics charts."
      />
      <AdminAttendanceView initialCounts={initialCounts} />
    </PageContainer>
  );
}
