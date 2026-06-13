import type { ComponentPropsWithoutRef } from "react";

/**
 * Dark-safe inline notice. Extracted from the dashboard's translucent
 * `border-<c>-500/30 bg-<c>-500/10 text-<c>-300` pattern, replacing the legacy
 * light `border-red-200 bg-red-50 text-red-800` boxes that glare on dark.
 */
export type AlertVariant = "danger" | "warning" | "info" | "success";

const VARIANTS: Record<AlertVariant, string> = {
  danger: "border-red-500/30 bg-red-500/10 text-red-300",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  info: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
};

export default function Alert({
  variant = "info",
  className = "",
  ...rest
}: { variant?: AlertVariant } & ComponentPropsWithoutRef<"div">) {
  return (
    <div
      role={variant === "danger" ? "alert" : undefined}
      className={`rounded-lg border p-3 text-sm ${VARIANTS[variant]} ${className}`}
      {...rest}
    />
  );
}
