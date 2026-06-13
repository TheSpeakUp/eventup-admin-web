import type { ComponentPropsWithoutRef } from "react";

/**
 * Single button spec for the admin shell. Replaces the ad-hoc mix of
 * `bg-blue-600` (no hover), `bg-zinc-900`, bare `border` buttons. Lavender
 * primary, surface secondary, transparent ghost, red danger.
 *
 * `buttonClass()` is exported separately so `<Link className={buttonClass(...)}>`
 * gets the same look without forcing a real <button> element.
 */
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

const BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus disabled:cursor-not-allowed";

const SIZES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-hover disabled:bg-zinc-300 disabled:text-zinc-500",
  secondary:
    "border border-hairline-strong bg-surface-2 text-ink hover:bg-surface-3 disabled:opacity-50",
  ghost: "text-ink-subtle hover:bg-surface-2 hover:text-ink disabled:opacity-50",
  danger:
    "bg-red-600 text-white hover:bg-red-700 disabled:bg-zinc-300 disabled:text-zinc-500",
};

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className = "",
): string {
  return `${BASE} ${SIZES[size]} ${VARIANTS[variant]} ${className}`;
}

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...rest
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
} & ComponentPropsWithoutRef<"button">) {
  return (
    <button
      type={type}
      className={buttonClass(variant, size, className)}
      {...rest}
    />
  );
}
