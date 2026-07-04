import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]"
          >
            {label}
            {props.required && <span className="text-[var(--danger)] ml-0.5">*</span>}
          </label>
        )}
        <div className="relative group">
          {leftIcon && (
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "w-full rounded-[var(--radius-lg)] bg-[var(--surface-raised)]",
              "border text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
              "py-2.5 transition-all duration-150 outline-none",
              "focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-0 focus:border-[var(--accent)]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              leftIcon ? "pl-10" : "pl-3.5",
              rightIcon ? "pr-10" : "pr-3.5",
              error
                ? "border-[var(--danger)] focus:ring-[var(--danger)]"
                : "border-[var(--border)] hover:border-[var(--text-muted)]",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-muted)] transition-colors">
              {rightIcon}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-[var(--danger)] font-medium">{error}</p>}
        {hint && !error && <p className="text-xs text-[var(--text-muted)]">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
