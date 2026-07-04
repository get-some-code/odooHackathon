import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageContainer, PageHeader } from "@/components/layout/page-container";
import { AdminPayrollView } from "@/components/payroll/admin-payroll-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Corporate Payroll Board | Admin",
  description: "Disburse salary components, process monthly workforce payroll profiles, and review cost curves.",
};

export default async function AdminPayrollPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Workforce Payroll Board"
        subtitle="Process monthly salaries, manage base package components, and download cost distributions."
      />
      <AdminPayrollView />
    </PageContainer>
  );
}
