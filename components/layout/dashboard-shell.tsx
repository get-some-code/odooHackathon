"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { CommandPalette } from "@/components/layout/command-palette";
import type { AuthUserPayload } from "@/lib/auth";

interface DashboardShellProps {
  user: AuthUserPayload | null;
  children: React.ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
      {/* Global Command Search console */}
      <CommandPalette />

      {/* Desktop Sidebar — receives real user */}
      <Sidebar
        user={user}
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
      />

      {/* Mobile Drawer — receives real user */}
      <MobileNav
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        user={user}
      />

      {/* Main area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Navbar — receives real user */}
        <Navbar
          user={user}
          onMobileMenuOpen={() => setMobileOpen(true)}
        />

        {/* Page content */}
        <motion.div
          className="flex-1 overflow-y-auto"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
