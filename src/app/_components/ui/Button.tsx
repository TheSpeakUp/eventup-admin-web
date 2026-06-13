import type { ButtonHTMLAttributes } from "react";

// Single button system. Lavender primary (the one chromatic accent), surface
// secondary, plain ghost, and a danger variant for destructive actions.
// Replaces ad-hoc bg-blue-600 / bg-zinc-900 buttons with inconsistent hover.
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus disabled:cursor-not-allowed disabled:opacity-50";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover",
  secondary:
    "border border-hairline bg-surface-1 text-ink hover:border-hairline-strong hover:bg-surface-2",
  ghost: "text-ink-muted hover:bg-surface-2 hover:text-ink",
  danger: "bg-red-600 text-white hover:bg-red-500",
};

const SIZES = {
  sm: "px-2.5 py-1 text-xs",
  md: "px-3 py-1.5",
} as const;

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: keyof typeof SIZES;
}) {
  return (
    <button
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    />
  );
}
