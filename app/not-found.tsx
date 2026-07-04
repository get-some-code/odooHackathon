import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 — Page Not Found",
};

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-[var(--bg)] flex items-center justify-center p-6">
      {/* Background glow */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[var(--accent)] opacity-[0.04] blur-[120px]" />
      </div>

      <div className="relative text-center max-w-md w-full">
        {/* 404 glitch number */}
        <div className="mb-8 relative inline-block select-none">
          <span className="text-[140px] font-black leading-none tracking-tighter text-[var(--text-primary)] opacity-5">
            404
          </span>
          <span className="absolute inset-0 flex items-center justify-center text-[80px] font-black text-[var(--accent)] opacity-30 blur-sm">
            404
          </span>
          <span className="absolute inset-0 flex items-center justify-center text-[80px] font-black text-[var(--text-primary)]">
            404
          </span>
        </div>

        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
          Page not found
        </h1>
        <p className="text-[var(--text-muted)] mb-8 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Double-check the URL or head back to safety.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild variant="primary" size="lg">
            <Link href="/dashboard">
              <Home /> Back to Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="javascript:history.back()">
              <ArrowLeft /> Go Back
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
