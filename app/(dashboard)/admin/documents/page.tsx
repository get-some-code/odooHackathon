import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageContainer, PageHeader } from "@/components/layout/page-container";
import { getAdminDocumentsAction } from "@/actions/document";
import { AdminDocumentsView } from "@/components/documents/admin-documents-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Document Verification Dashboard | Admin",
  description: "Verify, reject, or request re-uploads of employee identification documents.",
};

export default async function AdminDocumentsPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  const res = await getAdminDocumentsAction({ status: "ALL" });

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Document Verification Dashboard"
        subtitle="Manage employee profile identity sheets, request re-uploads, and confirm clearances."
      />
      <AdminDocumentsView initialDocuments={res.success && res.data ? res.data : []} />
    </PageContainer>
  );
}
