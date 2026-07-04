import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { PageContainer, PageHeader } from "@/components/layout/page-container";
import { AdminLeaveView } from "@/components/leave/admin-leave-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leave Approvals | Admin",
  description: "Monitor, filter, and approve or reject employee leave requests.",
};

export default async function AdminLeavePage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  // Count pending leaves for initial indicator
  const pendingCount = await db.leaveRequest.count({
    where: { status: "PENDING" },
  });

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Leave Approvals Dashboard"
        subtitle="Manage employee time-off requests, bulk actions, and view balances."
      />
      <AdminLeaveView initialPending={pendingCount} />
    </PageContainer>
  );
}
