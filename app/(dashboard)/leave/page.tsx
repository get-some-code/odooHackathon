import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageContainer, PageHeader } from "@/components/layout/page-container";
import { LeaveClientView } from "@/components/leave/leave-client-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Leave Tracking | HRMS",
  description: "Request paid, sick, or unpaid time-off and track leave balances.",
};

export default async function LeavePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Leave &amp; Time-Off"
        subtitle="Manage your leave requests, check time-off calendars, and track remaining balances."
      />
      <LeaveClientView />
    </PageContainer>
  );
}
