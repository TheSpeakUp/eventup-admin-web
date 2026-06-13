import type { ReactNode } from "react";

// Dark-safe semantic badge. Replaces the light `-100` fills (bg-emerald-100 etc.)
// that wash out on the Linear dark canvas. Each tone is a translucent fill +
// bright-400 text + faint ring, readable on surface-1.
export type BadgeTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-surface-2 text-ink-muted ring-hairline-strong",
  success: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  danger: "bg-red-500/10 text-red-400 ring-red-500/20",
  info: "bg-primary/10 text-primary-hover ring-primary/20",
};

export default function Badge({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
