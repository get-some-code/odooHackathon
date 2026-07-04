import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageContainer, PageHeader } from "@/components/layout/page-container";
import { getCompanySettingsAction, getHolidaysAction } from "@/actions/company";
import { AdminSettingsClientView } from "@/components/settings/admin-settings-client-view";
import { getDesignations } from "@/lib/department-designation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Organization settings & Calendars | Admin",
  description: "Configure corporate credentials, holiday schedules, working hours, and designations.",
};

export default async function AdminSettingsPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  const [companyRes, holidayRes] = await Promise.all([
    getCompanySettingsAction(),
    getHolidaysAction(),
  ]);

  if (!companyRes.success || !companyRes.data || !holidayRes.success || !holidayRes.data) {
    return (
      <PageContainer>
        <PageHeader title="Admin settings" subtitle="Configure organization preferences." />
        <div className="p-4 bg-[var(--danger-subtle)] border border-[var(--danger-border)] text-[var(--danger)] text-sm font-semibold rounded-[var(--radius-xl)]">
          Failed to load company policies data.
        </div>
      </PageContainer>
    );
  }

  // Load designations from helper
  const designationsList = getDesignations();

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Administrative settings"
        subtitle="Manage company working hours, configure national calendar holidays, and edit job hierarchy grades."
      />
      <AdminSettingsClientView
        initialCompany={companyRes.data}
        initialHolidays={holidayRes.data}
        initialDesignations={designationsList}
      />
    </PageContainer>
  );
}
