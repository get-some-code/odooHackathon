import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const avatarVariants = cva(
  "relative inline-flex shrink-0 overflow-hidden rounded-full select-none",
  {
    variants: {
      size: {
        xs:  "h-6 w-6 text-[10px]",
        sm:  "h-8 w-8 text-xs",
        md:  "h-9 w-9 text-sm",
        lg:  "h-11 w-11 text-base",
        xl:  "h-14 w-14 text-lg",
        "2xl": "h-20 w-20 text-2xl",
      },
    },
    defaultVariants: { size: "md" },
  }
);

export interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {
  src?: string;
  alt?: string;
  fallback?: string;
  status?: "online" | "offline" | "away" | "busy";
}

const statusColors = {
  online:  "bg-[var(--success)]",
  offline: "bg-[var(--text-muted)]",
  away:    "bg-[var(--warning)]",
  busy:    "bg-[var(--danger)]",
};

function Avatar({ className, size, src, alt, fallback, status, ...props }: AvatarProps) {
  return (
    <div className="relative inline-flex">
      <AvatarPrimitive.Root
        className={cn(avatarVariants({ size, className }))}
        {...props}
      >
        <AvatarPrimitive.Image
          src={src}
          alt={alt ?? ""}
          className="h-full w-full object-cover"
        />
        <AvatarPrimitive.Fallback
          className="flex h-full w-full items-center justify-center bg-[var(--accent-subtle)] text-[var(--accent)] font-semibold"
        >
          {fallback ?? "?"}
        </AvatarPrimitive.Fallback>
      </AvatarPrimitive.Root>
      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-[var(--surface)]",
            size === "xs" || size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5",
            statusColors[status]
          )}
        />
      )}
    </div>
  );
}

export { Avatar };
