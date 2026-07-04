import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "403 — Access Forbidden",
  description: "Administrative clearance is required to view this directory resource.",
};

export default function UnauthorizedPage() {
  return (
    <div className="min-h-dvh bg-[var(--bg)] flex items-center justify-center p-6 text-xs select-none">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[var(--danger)] opacity-[0.03] blur-[120px]" />
      </div>

      <div className="relative text-center max-w-md w-full">
        {/* Shield icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[var(--radius-2xl)] bg-red-500/10 border border-red-500/20">
          <ShieldAlert className="h-8 w-8 text-red-500" />
        </div>

        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
          Access Unauthorized
        </h1>
        <p className="text-[var(--text-muted)] mb-8 leading-relaxed">
          Administrative clearance is required to view this directory resource. 
          If you believe this is an error, contact your system administrator.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild variant="primary" size="lg">
            <Link href="/dashboard">
              <Home className="h-4 w-4 mr-2" /> Back to Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="javascript:history.back()">
              <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
