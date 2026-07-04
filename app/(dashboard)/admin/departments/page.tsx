import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageContainer, PageHeader } from "@/components/layout/page-container";
import { DepartmentView } from "@/components/admin/department-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Departments & Designations | Admin",
  description: "Configure corporate hierarchy, assign branch managers, and audit job roles.",
};

export default async function AdminDepartmentsPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Departments &amp; Designation Structure"
        subtitle="Manage job titles, assign department leaders, and structure workforce hierarchy."
      />
      <DepartmentView />
    </PageContainer>
  );
}
