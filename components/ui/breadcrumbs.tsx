import * as React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
  showHome?: boolean;
}

function Breadcrumbs({ items, showHome = true, className, ...props }: BreadcrumbsProps) {
  const allItems = showHome
    ? [{ label: "Home", href: "/dashboard" }, ...items]
    : items;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center", className)}
      {...props}
    >
      <ol className="flex items-center gap-1 text-sm">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          return (
            <li key={index} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight
                  className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0"
                  aria-hidden="true"
                />
              )}
              {index === 0 && showHome ? (
                <Link
                  href={item.href ?? "/dashboard"}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors rounded-[var(--radius-sm)] p-0.5"
                  aria-label="Home"
                >
                  <Home className="h-3.5 w-3.5" />
                </Link>
              ) : isLast ? (
                <span
                  className="font-medium text-[var(--text-primary)] truncate max-w-[200px]"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href ?? "#"}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors truncate max-w-[160px]"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export { Breadcrumbs };
