"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("[Global Error Boundary]", error);
  }, [error]);

  return (
    <div className="min-h-dvh bg-[var(--bg)] flex items-center justify-center p-6">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[var(--danger)] opacity-[0.04] blur-[120px]" />
      </div>

      <div className="relative text-center max-w-md w-full">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[var(--radius-2xl)] bg-[var(--danger-subtle)] border border-[var(--danger-border)]">
          <AlertTriangle className="h-8 w-8 text-[var(--danger)]" />
        </div>

        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
          Something went wrong
        </h1>
        <p className="text-[var(--text-muted)] mb-2 leading-relaxed">
          An unexpected error occurred. Our team has been notified.
        </p>
        {error.digest && (
          <p className="text-xs font-mono text-[var(--text-muted)] mb-8 bg-[var(--surface-raised)] px-3 py-1.5 rounded-full inline-block border border-[var(--border)]">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          <Button onClick={reset} variant="primary" size="lg">
            <RefreshCw /> Try Again
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/dashboard">
              <Home /> Go to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
