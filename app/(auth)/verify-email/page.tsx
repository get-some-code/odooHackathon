import type { Metadata } from "next";
export const metadata: Metadata = { title: "Verify Email" };
export default function VerifyEmailPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center">
      <p className="text-[var(--text-muted)]">Email verification coming soon.</p>
    </div>
  );
}
