import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  /** Full width — no max-width cap */
  fluid?: boolean;
}

export function PageContainer({ children, className, fluid }: PageContainerProps) {
  return (
    <main
      className={cn(
        "flex-1 min-h-0 overflow-y-auto",
        "px-4 py-6 sm:px-6 lg:px-8",
        !fluid && "max-w-7xl mx-auto w-full",
        className
      )}
    >
      {children}
    </main>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4 mb-6", className)}>
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-[var(--text-muted)]">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  );
}
