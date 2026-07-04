"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { WifiOff, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-dvh bg-[var(--bg)] flex items-center justify-center p-6 text-xs select-none">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[var(--text-muted)] opacity-[0.03] blur-[120px]" />
      </div>

      <div className="relative text-center max-w-md w-full">
        {/* Offline indicator */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[var(--radius-2xl)] bg-[var(--surface-raised)] border border-[var(--border)]">
          <WifiOff className="h-8 w-8 text-[var(--text-muted)]" />
        </div>

        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
          No Internet Connection
        </h1>
        <p className="text-[var(--text-muted)] mb-8 leading-relaxed">
          {isOnline
            ? "Your internet connection is restored! Click below to reconnect."
            : "You are currently offline. Please check your network cables or Wi-Fi settings."}
        </p>

        <div className="flex justify-center">
          <Button onClick={handleReload} variant="primary" size="lg">
            <RefreshCw className="h-4 w-4 mr-2" /> Reconnect Now
          </Button>
        </div>
      </div>
    </div>
  );
}
