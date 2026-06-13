import type { ComponentPropsWithoutRef } from "react";

/**
 * Dark-safe status pill. Tones map to the translucent-fill + bright-text
 * pattern (`bg-<c>-500/10 text-<c>-400`) that reads correctly on the Linear
 * dark canvas — unlike the legacy light `-100/-800` fills which wash out.
 *
 * Spreads `...rest` onto the span so callers keep their `data-testid` and
 * `data-status` / `data-queue-status` attributes (the Playwright suite asserts
 * on those).
 */
export type BadgeTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "violet"
  | "orange"
  | "primary";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-surface-3 text-ink-subtle",
  success: "bg-emerald-500/10 text-emerald-400",
  warning: "bg-amber-500/10 text-amber-400",
  danger: "bg-red-500/10 text-red-400",
  info: "bg-blue-500/10 text-blue-400",
  violet: "bg-violet-500/10 text-violet-400",
  orange: "bg-orange-500/10 text-orange-400",
  primary: "bg-primary/15 text-primary-hover",
};

export default function Badge({
  tone = "neutral",
  className = "",
  ...rest
}: { tone?: BadgeTone } & ComponentPropsWithoutRef<"span">) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TONES[tone]} ${className}`}
      {...rest}
    />
  );
}
