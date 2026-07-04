"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Settings, LogOut, User, ChevronDown, Shield } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { logoutAction } from "@/actions/auth";
import { cn } from "@/lib/utils";
import type { AuthUserPayload } from "@/lib/auth";

interface ProfileDropdownProps {
  user: AuthUserPayload | null;
}

export function ProfileDropdown({ user }: ProfileDropdownProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await logoutAction();
    router.push("/login");
    router.refresh();
  };

  const initials = user
    ? `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase()
    : "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2.5 rounded-[var(--radius-xl)] px-2.5 py-1.5",
            "bg-[var(--surface-raised)] border border-[var(--border)]",
            "hover:bg-[var(--border)] transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          )}
          aria-label="Open user menu"
        >
          <Avatar fallback={initials} size="sm" status="online" />
          <div className="hidden sm:flex flex-col items-start text-left leading-none">
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              {user ? `${user.firstName} ${user.lastName}` : "Guest"}
            </span>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)] hidden sm:block" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        {/* User info header */}
        <div className="px-3 py-3 flex items-center gap-3 border-b border-[var(--border)] mb-1">
          <Avatar fallback={initials} size="md" status="online" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
              {user ? `${user.firstName} ${user.lastName}` : "Guest"}
            </p>
            <p className="text-xs text-[var(--text-muted)] truncate">{user?.email}</p>
            <Badge
              variant={user?.role === "ADMIN" ? "primary" : "default"}
              className="mt-1 text-[10px]"
            >
              {user?.role === "ADMIN" ? (
                <><Shield className="h-3 w-3" /> Admin</>
              ) : (
                "Employee"
              )}
            </Badge>
          </div>
        </div>

        <DropdownMenuLabel>Account</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User /> My Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings /> Settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem destructive onClick={handleLogout}>
          <LogOut /> Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
