import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageContainer, PageHeader } from "@/components/layout/page-container";
import { getEmployeePayrollAction } from "@/actions/payroll";
import { EmployeePayrollView } from "@/components/payroll/employee-payroll-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Payroll Details | Employee",
  description: "View monthly salary breakdowns, takehome net earnings, and print official payslips.",
};

export default async function PayrollPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const res = await getEmployeePayrollAction();
  if (!res.success || !res.data) {
    return (
      <PageContainer>
        <PageHeader title="My Payroll Slips" subtitle="View monthly takehome payslips." />
        <div className="p-4 bg-[var(--danger-subtle)] border border-[var(--danger-border)] text-[var(--danger)] text-sm font-semibold rounded-[var(--radius-xl)]">
          {res.error || "Failed to load account payroll summary."}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="My Payroll &amp; Salary"
        subtitle="Manage and print official monthly salary slips, earnings breakdowns, and EPF configurations."
      />
      <EmployeePayrollView profile={res.data} />
    </PageContainer>
  );
}
