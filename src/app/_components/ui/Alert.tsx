import type { ReactNode } from "react";

// Dark-safe alert panel. One radius/padding baseline for every page (replaces the
// rounded-md p-4 vs rounded p-3 drift). Extracted from the dashboard ErrorMessage.
export type AlertTone = "danger" | "warning" | "info" | "success";

const TONES: Record<AlertTone, string> = {
  danger: "border-red-500/30 bg-red-500/10 text-red-300",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  info: "border-primary/30 bg-primary/10 text-primary-hover",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
};

export default function Alert({
  tone = "danger",
  children,
  className = "",
}: {
  tone?: AlertTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={`rounded-lg border p-3 text-sm ${TONES[tone]} ${className}`}
    >
      {children}
    </div>
  );
}
