import { getSession } from "@/lib/auth";
import { getProfileAction } from "@/actions/profile";
import { redirect } from "next/navigation";
import { PageContainer, PageHeader } from "@/components/layout/page-container";
import { ProfileForm, UserProfile } from "@/components/profile/profile-form";
import { DocumentManager } from "@/components/profile/document-manager";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Profile | HRMS",
  description: "View and edit your employee profile details.",
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { id: targetId } = await searchParams;
  const userId = targetId && session.role === "ADMIN" ? targetId : session.id;

  // Get current user profile data
  const profileRes = await getProfileAction(userId);

  if (!profileRes.success || !profileRes.data) {
    return (
      <PageContainer>
        <PageHeader title="My Profile" subtitle="Manage your personal information." />
        <div className="p-6 rounded-[var(--radius-xl)] bg-[var(--danger-subtle)] border border-[var(--danger-border)] text-[var(--danger)] text-sm font-semibold">
          Error: {profileRes.error || "Could not retrieve profile. Please contact an administrator."}
        </div>
      </PageContainer>
    );
  }

  const profileData = profileRes.data as UserProfile;

  return (
    <PageContainer className="space-y-6">
      <PageHeader title="My Profile" subtitle="Manage your personal and corporate employee file." />

      {/* Main Edit Form */}
      <ProfileForm user={profileData} currentSessionUser={session} />

      {/* Document Manager Section */}
      <DocumentManager
        userId={profileData.id}
        initialDocuments={profileData.documents || []}
        readOnly={false}
      />
    </PageContainer>
  );
}
