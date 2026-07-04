"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, CalendarCheck, FileText, CreditCard,
  ChevronLeft, ChevronRight, LogOut, Shield, Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { logoutAction } from "@/actions/auth";
import { useRouter } from "next/navigation";
import type { AuthUserPayload } from "@/lib/auth";

/* ---- Nav config ---- */
interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Workforce",
    items: [
      { label: "Employees",   href: "/admin/employees",   icon: Users,         adminOnly: true },
      { label: "Departments", href: "/admin/departments", icon: Shield,        adminOnly: true },
      { label: "Attendance",  href: "/attendance",        icon: CalendarCheck },
    ],
  },
  {
    label: "Leave & Pay",
    items: [
      { label: "Leave",           href: "/leave",         icon: FileText  },
      { label: "Leave Approvals", href: "/admin/leave",   icon: Shield,   adminOnly: true },
      { label: "Payroll",         href: "/payroll",       icon: CreditCard },
      { label: "Payroll Admin",   href: "/admin/payroll", icon: Shield,   adminOnly: true },
      { label: "Document Board",  href: "/admin/documents", icon: Shield,  adminOnly: true },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Settings",        href: "/settings",       icon: Settings },
      { label: "Admin Settings",  href: "/admin/settings", icon: Shield,   adminOnly: true },
      { label: "Audit Reports",   href: "/admin/reports",  icon: Shield,   adminOnly: true },
    ],
  },
];

/* ---- Props ---- */
interface SidebarProps {
  user: AuthUserPayload | null;
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ user, collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = user?.role === "ADMIN";

  const handleLogout = async () => {
    await logoutAction();
    router.push("/login");
    router.refresh();
  };

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 256 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "hidden lg:flex flex-col h-screen sticky top-0 shrink-0 overflow-hidden",
          "bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)]",
          "z-30"
        )}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-[var(--sidebar-border)] shrink-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--accent)]">
            <Users className="h-4.5 w-4.5 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="ml-3 font-bold text-[var(--text-primary)] whitespace-nowrap overflow-hidden"
              >
                HR<span className="text-[var(--accent)]">MS</span>
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2.5 space-y-5">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter(
              (item) => !item.adminOnly || isAdmin
            );
            if (visibleItems.length === 0) return null;
            return (
              <div key={group.label}>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="px-2.5 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]"
                    >
                      {group.label}
                    </motion.p>
                  )}
                </AnimatePresence>
                <ul className="space-y-0.5">
                  {visibleItems.map((item) => (
                    <SidebarItem
                      key={item.href}
                      item={item}
                      active={isActive(item.href)}
                      collapsed={collapsed}
                    />
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* Footer — User + Logout */}
        <div className="border-t border-[var(--sidebar-border)] p-2.5 shrink-0 space-y-1">
          <Link
            href="/profile"
            className={cn(
              "flex items-center gap-3 px-2.5 py-2 rounded-[var(--radius-lg)] transition-colors",
              "hover:bg-[var(--surface-raised)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
              "overflow-hidden"
            )}
          >
            <Avatar
              fallback={user ? `${user.firstName[0]}${user.lastName[0]}` : "?"}
              size="sm"
              status="online"
              className="shrink-0"
            />
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="min-w-0"
                >
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                    {user ? `${user.firstName} ${user.lastName}` : "Guest"}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] truncate capitalize">
                    {user?.role?.toLowerCase()}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>

          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-2.5 py-2 rounded-[var(--radius-lg)] transition-colors cursor-pointer",
              "text-[var(--text-muted)] hover:bg-[var(--danger-subtle)] hover:text-[var(--danger)]",
              collapsed ? "justify-center" : ""
            )}
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm font-medium"
                >
                  Sign Out
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "absolute top-[72px] -right-3 h-6 w-6 rounded-full",
            "bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-sm)]",
            "flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)]",
            "transition-colors z-40"
          )}
        >
          {collapsed
            ? <ChevronRight className="h-3 w-3" />
            : <ChevronLeft  className="h-3 w-3" />
          }
        </button>
      </motion.aside>
    </>
  );
}

/* ---- Single nav item ---- */
function SidebarItem({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <li>
      <Link
        href={item.href}
        title={collapsed ? item.label : undefined}
        className={cn(
          "relative flex items-center gap-3 px-2.5 py-2 rounded-[var(--radius-lg)]",
          "text-sm font-medium transition-all duration-150 overflow-hidden",
          collapsed ? "justify-center" : "",
          active
            ? "bg-[var(--accent-subtle)] text-[var(--accent)]"
            : "text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] hover:text-[var(--text-primary)]"
        )}
      >
        {active && (
          <motion.span
            layoutId="sidebar-active"
            className="absolute inset-0 rounded-[var(--radius-lg)] bg-[var(--accent-subtle)]"
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          />
        )}
        <item.icon className="relative h-4 w-4 shrink-0" />
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.15 }}
              className="relative whitespace-nowrap"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
        {item.badge && !collapsed && (
          <span className="relative ml-auto text-[10px] font-bold bg-[var(--accent)] text-white px-1.5 py-0.5 rounded-full">
            {item.badge}
          </span>
        )}
      </Link>
    </li>
  );
}
