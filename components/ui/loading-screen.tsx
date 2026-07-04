"use client";

import { cn } from "@/lib/utils";

interface LoadingScreenProps {
  message?: string;
  className?: string;
}

export function LoadingScreen({ message = "Loading…", className }: LoadingScreenProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center gap-5",
        "bg-[var(--bg)]",
        className
      )}
      aria-live="polite"
      aria-busy="true"
    >
      {/* Animated logo mark */}
      <div className="relative flex h-14 w-14 items-center justify-center">
        <div className="absolute inset-0 rounded-[var(--radius-xl)] bg-gradient-to-tr from-indigo-500 to-indigo-700 opacity-20 animate-ping" />
        <div className="relative h-14 w-14 rounded-[var(--radius-xl)] bg-gradient-to-tr from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg">
          <svg viewBox="0 0 24 24" className="h-7 w-7 text-white" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      </div>

      {/* Three-dot loader */}
      <div className="flex items-center gap-1.5" role="status">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full bg-[var(--accent)] animate-bounce"
            style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.8s" }}
          />
        ))}
      </div>

      <p className="text-sm text-[var(--text-muted)] font-medium">{message}</p>
    </div>
  );
}
