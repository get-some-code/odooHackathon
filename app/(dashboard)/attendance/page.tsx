import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageContainer, PageHeader } from "@/components/layout/page-container";
import { AttendanceClientView } from "@/components/attendance/attendance-client-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Attendance | HRMS",
  description: "Record daily check-ins, check-outs, and review monthly status sheets.",
};

export default async function AttendancePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Attendance Tracking"
        subtitle="Manage daily clock punch-ins and log history."
      />
      <AttendanceClientView />
    </PageContainer>
  );
}
