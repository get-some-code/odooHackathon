import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageContainer, PageHeader } from "@/components/layout/page-container";
import { getProfileAction } from "@/actions/profile";
import { SettingsClientView } from "@/components/settings/settings-client-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Settings & System Logs",
  description: "Configure profile contact details, security parameters, notification alerts, and audit log files.",
};

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const res = await getProfileAction();
  if (!res.success || !res.data) {
    return (
      <PageContainer>
        <PageHeader title="Account Settings" subtitle="Configure preferences and security." />
        <div className="p-4 bg-[var(--danger-subtle)] border border-[var(--danger-border)] text-[var(--danger)] text-sm font-semibold rounded-[var(--radius-xl)]">
          {res.error || "Failed to load account profile preferences."}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Settings &amp; Audit Preferences"
        subtitle="Manage phone numbers, security keys, notification lists, and organizational audit trails."
      />
      <SettingsClientView userProfile={res.data} />
    </PageContainer>
  );
}
