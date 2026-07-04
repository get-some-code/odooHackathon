import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageContainer, PageHeader } from "@/components/layout/page-container";
import { getHRMSReportsAction } from "@/actions/reports";
import { AdminReportsView } from "@/components/reports/admin-reports-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Corporate Audit Reports | Admin",
  description: "Download CSV directory spreadsheets, review lifecycle status histories, and inspect verifications.",
};

export default async function AdminReportsPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  const res = await getHRMSReportsAction();

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Corporate Audit &amp; Reports"
        subtitle="Consolidated database reports directory. Export lists to CSV spreadsheets or print pages."
      />
      <AdminReportsView initialData={res.success && res.data ? res.data : { employees: [], documents: [], lifecycle: [] }} />
    </PageContainer>
  );
}
