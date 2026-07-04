"use client";

import * as React from "react";
import { useState, useEffect, useMemo, useTransition, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  CalendarCheck,
  FileText,
  CreditCard,
  Users,
  Shield,
  Settings,
  X,
  Keyboard,
} from "lucide-react";
import { getCurrentUserAction } from "@/actions/auth";

export function CommandPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("EMPLOYEE");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [, startTransition] = useTransition();

  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    startTransition(async () => {
      const res = await getCurrentUserAction();
      if (res.success && res.data) {
        setRole(res.data.role);
      }
    });
  }, []);

  // Reset selectedIndex when query or open state changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, isOpen]);

  const allRoutes = useMemo(() => {
    const routes = [
      { label: "Dashboard overview", shortcut: "G D", href: "/dashboard", icon: LayoutDashboard, category: "General" },
      { label: "Check-in / Attendance logs", shortcut: "G A", href: "/attendance", icon: CalendarCheck, category: "Workforce" },
      { label: "Apply for Leave", shortcut: "G L", href: "/leave", icon: FileText, category: "Workforce" },
      { label: "View Payroll slips", shortcut: "G P", href: "/payroll", icon: CreditCard, category: "Financial" },
      { label: "Profile settings & Preferences", shortcut: "G S", href: "/settings", icon: Settings, category: "Account" },
    ];

    if (role === "ADMIN") {
      routes.push(
        { label: "Manage Workforce directory", shortcut: "A E", href: "/admin/employees", icon: Users, category: "Administration" },
        { label: "Departments & Designations list", shortcut: "A D", href: "/admin/departments", icon: Shield, category: "Administration" },
        { label: "Leave Requests Approvals board", shortcut: "A L", href: "/admin/leave", icon: Shield, category: "Administration" },
        { label: "Disburse Payroll management Board", shortcut: "A P", href: "/admin/payroll", icon: Shield, category: "Administration" },
        { label: "Verify Documents Board", shortcut: "A V", href: "/admin/documents", icon: Shield, category: "Administration" },
        { label: "Administrative system settings", shortcut: "A O", href: "/admin/settings", icon: Shield, category: "Administration" },
        { label: "Consolidated Audit Reports", shortcut: "A R", href: "/admin/reports", icon: Shield, category: "Administration" },
        { label: "Admin dashboard overview", shortcut: "A S", href: "/admin/dashboard", icon: Shield, category: "Administration" }
      );
    }

    return routes;
  }, [role]);

  const filteredRoutes = useMemo(() => {
    if (!query.trim()) return allRoutes;
    const q = query.toLowerCase();
    return allRoutes.filter((r) => r.label.toLowerCase().includes(q) || r.category.toLowerCase().includes(q));
  }, [allRoutes, query]);

  const handleNavigate = useCallback((href: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(href);
  }, [router]);

  // Scroll selected item into view
  useEffect(() => {
    const el = itemRefs.current[selectedIndex];
    if (el) {
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        return;
      }

      if (!isOpen) return;

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          setQuery("");
          break;
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            filteredRoutes.length > 0 ? (prev + 1) % filteredRoutes.length : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            filteredRoutes.length > 0
              ? (prev - 1 + filteredRoutes.length) % filteredRoutes.length
              : 0
          );
          break;
        case "Enter":
          e.preventDefault();
          if (filteredRoutes[selectedIndex]) {
            handleNavigate(filteredRoutes[selectedIndex].href);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredRoutes, selectedIndex, handleNavigate]);

  // Build a flat index map for highlighting: map each filteredRoute to its flat index
  const flatIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    filteredRoutes.forEach((r, i) => map.set(r.href, i));
    return map;
  }, [filteredRoutes]);

  if (!isOpen) return null;

  // Group by category while keeping track of flat indices
  const grouped = filteredRoutes.reduce((acc, curr) => {
    if (!acc[curr.category]) acc[curr.category] = [];
    acc[curr.category].push(curr);
    return acc;
  }, {} as Record<string, typeof filteredRoutes>);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      {/* Glassmorphic backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={() => { setIsOpen(false); setQuery(""); }}
        aria-hidden="true"
      />

      {/* Main command palette dialog */}
      <div className="relative w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-2xl)] z-10 overflow-hidden flex flex-col justify-between max-h-[70vh]">

        {/* Search Input */}
        <div className="relative border-b border-[var(--border-subtle)] flex items-center p-3">
          <Search className="h-4.5 w-4.5 text-[var(--text-muted)] mr-2.5 ml-1.5" aria-hidden="true" />
          <input
            type="text"
            role="combobox"
            aria-expanded={true}
            aria-autocomplete="list"
            aria-controls="command-palette-listbox"
            aria-activedescendant={
              filteredRoutes[selectedIndex] ? `cmd-item-${selectedIndex}` : undefined
            }
            className="w-full text-xs bg-transparent text-[var(--text-primary)] focus:outline-none placeholder-[var(--text-muted)]"
            placeholder="Type a page command or search shortcut..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button
            onClick={() => { setIsOpen(false); setQuery(""); }}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors rounded-[var(--radius-md)] hover:bg-[var(--surface-raised)]"
            aria-label="Close command palette"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Categories List */}
        <div
          id="command-palette-listbox"
          role="listbox"
          aria-label="Navigation commands"
          ref={listRef}
          className="overflow-y-auto p-2 space-y-3 max-h-[50vh]"
        >
          {filteredRoutes.length > 0 ? (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category} className="space-y-1">
                <span className="px-3 text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">
                  {category}
                </span>
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const flatIdx = flatIndexMap.get(item.href) ?? -1;
                    const isActive = flatIdx === selectedIndex;
                    return (
                      <div
                        key={item.href}
                        id={`cmd-item-${flatIdx}`}
                        role="option"
                        aria-selected={isActive}
                        ref={(el) => { itemRefs.current[flatIdx] = el; }}
                        onClick={() => handleNavigate(item.href)}
                        onMouseEnter={() => setSelectedIndex(flatIdx)}
                        className={[
                          "flex items-center justify-between px-3 py-2 rounded-[var(--radius-lg)] transition-all duration-100 cursor-pointer group",
                          isActive
                            ? "bg-[var(--accent)] text-[var(--accent-fg)]"
                            : "hover:bg-[var(--surface-raised)]",
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            className={[
                              "h-4 w-4 transition-colors",
                              isActive
                                ? "text-[var(--accent-fg)]"
                                : "text-[var(--text-muted)] group-hover:text-[var(--accent)]",
                            ].join(" ")}
                          />
                          <span
                            className={[
                              "text-xs font-medium transition-colors",
                              isActive
                                ? "text-[var(--accent-fg)]"
                                : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]",
                            ].join(" ")}
                          >
                            {item.label}
                          </span>
                        </div>
                        <span
                          className={[
                            "flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-sm border",
                            isActive
                              ? "text-[var(--accent-fg)] bg-white/20 border-white/20"
                              : "text-[var(--text-muted)] bg-[var(--surface-raised)] border-[var(--border-subtle)]",
                          ].join(" ")}
                        >
                          <Keyboard className="h-2.5 w-2.5" aria-hidden="true" />
                          {item.shortcut}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-xs text-[var(--text-muted)]">
              No matching commands or navigation options.
            </div>
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="border-t border-[var(--border-subtle)] p-2.5 bg-[var(--surface-raised)] flex justify-between items-center text-[9px] font-medium text-[var(--text-muted)]">
          <span>Search or navigate</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-[var(--border)] font-mono">↑↓</kbd> navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-[var(--border)] font-mono">↵</kbd> open
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-[var(--border)] font-mono">Esc</kbd> close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
