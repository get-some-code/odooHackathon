import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageContainer, PageHeader } from "@/components/layout/page-container";
import { EmployeesDirectory } from "@/components/admin/employees-directory";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workforce Directory | Admin",
  description: "Manage employee files, update designations, departments, roles, and review check-in/out records.",
};

export default async function AdminEmployeesPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Workforce Management Directory"
        subtitle="Complete database directory of all corporate employees, roles, departments, and active profiles."
      />
      <EmployeesDirectory />
    </PageContainer>
  );
}
