"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, CalendarCheck, FileText, CreditCard,
  X, LogOut, Shield, Settings, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { logoutAction } from "@/actions/auth";
import { useRouter } from "next/navigation";
import type { AuthUserPayload } from "@/lib/auth";


const adminNavItems = [
  { label: "Dashboard",       href: "/admin/dashboard",  icon: LayoutDashboard },
  { label: "NexusAI Assistant", href: "/admin/ai-assistant", icon: Sparkles },
  { label: "Employees",       href: "/admin/employees",  icon: Users           },
  { label: "Departments",     href: "/admin/departments",icon: Shield          },
  { label: "Attendance",      href: "/attendance",       icon: CalendarCheck   },
  { label: "Leave Approvals", href: "/admin/leave",      icon: FileText        },
  { label: "Payroll Admin",   href: "/admin/payroll",    icon: CreditCard      },
  { label: "Document Board",  href: "/admin/documents",  icon: Shield          },
  { label: "Audit Reports",   href: "/admin/reports",    icon: Shield          },
  { label: "Admin Settings",  href: "/admin/settings",   icon: Settings        },
];

const employeeNavItems = [
  { label: "Dashboard",  href: "/dashboard",  icon: LayoutDashboard },
  { label: "Attendance", href: "/attendance", icon: CalendarCheck   },
  { label: "Leave",      href: "/leave",      icon: FileText        },
  { label: "Payroll",    href: "/payroll",    icon: CreditCard      },
  { label: "Settings",   href: "/settings",   icon: Settings        },
];


interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  user: AuthUserPayload | null;
}

export function MobileNav({ open, onClose, user }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = user?.role === "ADMIN";
  const initials = user
    ? `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase()
    : "?";

  const handleLogout = async () => {
    onClose();
    await logoutAction();
    router.push("/login");
    router.refresh();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
              "fixed left-0 top-0 bottom-0 z-50 w-72 lg:hidden",
              "bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)]",
              "flex flex-col"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between h-16 px-5 border-b border-[var(--sidebar-border)]">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-[var(--radius-lg)] bg-[var(--accent)] flex items-center justify-center">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-[var(--text-primary)]">
                  HR<span className="text-[var(--accent)]">MS</span>
                </span>
              </div>
              <button
                onClick={onClose}
                aria-label="Close navigation"
                className="h-8 w-8 flex items-center justify-center rounded-[var(--radius-lg)] text-[var(--text-muted)] hover:bg-[var(--surface-raised)] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {(isAdmin ? adminNavItems : employeeNavItems).map((item) => {
                  const active = item.href === "/dashboard" || item.href === "/admin/dashboard"
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-lg)]",
                        "text-sm font-medium transition-colors",
                        active
                          ? "bg-[var(--accent-subtle)] text-[var(--accent)]"
                          : "text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] hover:text-[var(--text-primary)]"
                      )}
                    >
                      <item.icon className="h-4.5 w-4.5 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-[var(--sidebar-border)] space-y-1">
              <div className="flex items-center gap-3 px-3 py-2.5">
                <Avatar fallback={initials} size="sm" status="online" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                    {user ? `${user.firstName} ${user.lastName}` : "Guest"}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] truncate capitalize">
                    {user?.role?.toLowerCase()}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-lg)] text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--danger-subtle)] hover:text-[var(--danger)] transition-colors"
              >
                <LogOut className="h-4.5 w-4.5" />
                Sign Out
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
