import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base styles
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "font-semibold text-sm leading-none",
    "rounded-[var(--radius-lg)]",
    "border border-transparent",
    "transition-all duration-150 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-40",
    "select-none cursor-pointer",
    "[&_svg]:size-4 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-[var(--accent)] text-[var(--accent-fg)]",
          "hover:bg-[var(--accent-hover)]",
          "shadow-sm hover:shadow-md active:shadow-none",
          "active:scale-[0.98]",
        ],
        secondary: [
          "bg-[var(--surface-raised)] text-[var(--text-primary)]",
          "border-[var(--border)]",
          "hover:bg-[var(--border)] hover:border-[var(--text-muted)]",
          "active:scale-[0.98]",
        ],
        ghost: [
          "bg-transparent text-[var(--text-secondary)]",
          "hover:bg-[var(--surface-raised)] hover:text-[var(--text-primary)]",
          "active:scale-[0.98]",
        ],
        outline: [
          "bg-transparent text-[var(--text-primary)]",
          "border-[var(--border)]",
          "hover:bg-[var(--surface-raised)]",
          "active:scale-[0.98]",
        ],
        destructive: [
          "bg-[var(--danger)] text-white",
          "hover:opacity-90",
          "shadow-sm active:scale-[0.98]",
        ],
        success: [
          "bg-[var(--success)] text-white",
          "hover:opacity-90",
          "shadow-sm active:scale-[0.98]",
        ],
        link: [
          "text-[var(--accent)] underline-offset-4 hover:underline",
          "h-auto p-0",
        ],
      },
      size: {
        xs:  "h-7  px-2.5 text-xs  rounded-[var(--radius-md)]",
        sm:  "h-8  px-3   text-sm",
        md:  "h-10 px-4   text-sm",
        lg:  "h-11 px-5   text-base",
        xl:  "h-12 px-6   text-base",
        icon: "h-9  w-9  p-0",
        "icon-sm": "h-7  w-7  p-0 rounded-[var(--radius-md)]",
        "icon-lg": "h-11 w-11 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin size-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Loading…</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
