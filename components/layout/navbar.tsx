"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useTransition } from "react";
import { Bell, Menu, Search, X, Loader2 } from "lucide-react";
import { DarkModeToggle } from "@/components/ui/dark-mode-toggle";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/ui/breadcrumbs";
import { ProfileDropdown } from "./profile-dropdown";
import { cn } from "@/lib/utils";
import type { AuthUserPayload } from "@/lib/auth";
import { globalSearchAction, type SearchResultItem } from "@/actions/admin";

interface NavbarProps {
  user: AuthUserPayload | null;
  onMobileMenuOpen: () => void;
}

function pathToBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);
  const labelMap: Record<string, string> = {
    dashboard: "Dashboard",
    admin: "Admin",
    employees: "Employees",
    departments: "Departments",
    attendance: "Attendance",
    leave: "Leave",
    payroll: "Payroll",
    profile: "Profile",
    settings: "Settings",
  };
  let accum = "";
  return segments.map((seg) => {
    accum += `/${seg}`;
    return { label: labelMap[seg] ?? seg, href: accum };
  });
}

export function Navbar({ user, onMobileMenuOpen }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const crumbs = pathToBreadcrumbs(pathname);

  // Global Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    startTransition(async () => {
      const res = await globalSearchAction(q);
      if (res.success && res.data) {
        setSearchResults(res.data);
      }
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  // Group search results by category
  const groupedResults = searchResults.reduce((acc, curr) => {
    if (!acc[curr.category]) {
      acc[curr.category] = [];
    }
    acc[curr.category].push(curr);
    return acc;
  }, {} as Record<string, SearchResultItem[]>);

  const handleResultClick = (href: string) => {
    setShowResults(false);
    setSearchQuery("");
    router.push(href);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-20 h-16 flex items-center gap-4 px-4 lg:px-6",
        "bg-[var(--navbar-bg)] border-b border-[var(--navbar-border)]",
        "backdrop-blur-md"
      )}
    >
      {/* Mobile menu button */}
      <button
        onClick={onMobileMenuOpen}
        aria-label="Open navigation menu"
        className={cn(
          "lg:hidden flex h-9 w-9 items-center justify-center rounded-[var(--radius-lg)]",
          "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)]",
          "border border-[var(--border)] transition-colors"
        )}
      >
        <Menu className="h-4.5 w-4.5" />
      </button>

      {/* Breadcrumbs */}
      <div className="flex-1 min-w-0 hidden lg:block">
        <Breadcrumbs items={crumbs} showHome={false} />
      </div>

      {/* Global Search Bar */}
      <div className="relative max-w-sm w-full flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Global search (Ctrl + K)..."
            className={cn(
              "w-full h-9 pl-9 pr-8 rounded-[var(--radius-lg)] border border-[var(--border)] text-xs",
              "bg-[var(--surface-raised)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            )}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSearchResults([]);
              }}
              className="absolute right-3 top-2.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown Overlay */}
        {showResults && searchQuery.trim().length >= 2 && (
          <div className="absolute top-11 left-0 right-0 z-50 max-h-96 overflow-y-auto rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-xl)] backdrop-blur-md p-2 space-y-3">
            {isPending && (
              <div className="flex items-center justify-center py-4 gap-2 text-xs text-[var(--text-muted)]">
                <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" /> Searching directory...
              </div>
            )}

            {!isPending && Object.keys(groupedResults).length === 0 && (
              <div className="text-center py-4 text-xs text-[var(--text-muted)]">
                No matching directory results.
              </div>
            )}

            {!isPending &&
              Object.entries(groupedResults).map(([category, items]) => (
                <div key={category} className="space-y-1">
                  <h4 className="px-2 text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-1">
                    {category}s
                  </h4>
                  <div className="space-y-0.5">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleResultClick(item.href)}
                        className="px-2 py-1.5 rounded-[var(--radius-md)] hover:bg-[var(--surface-raised)] transition-all cursor-pointer text-left"
                      >
                        <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                          {item.title}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)] truncate">
                          {item.subtitle}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Notification bell */}
        <button
          aria-label="Notifications"
          className={cn(
            "relative flex h-9 w-9 items-center justify-center rounded-[var(--radius-lg)]",
            "bg-[var(--surface-raised)] border border-[var(--border)]",
            "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]",
            "transition-colors"
          )}
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-[var(--accent)] pulse-dot" />
        </button>

        <DarkModeToggle />

        <ProfileDropdown user={user} />
      </div>
    </header>
  );
}
