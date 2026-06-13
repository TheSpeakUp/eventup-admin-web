import type { ReactNode } from "react";

// Compact metric tile for use inside Panels: value on top, muted label below,
// optional delta/aside on the right. Lighter than the dashboard KpiCard (no
// card chrome of its own) — meant to sit several-up inside a Panel body.
export default function StatTile({
  label,
  value,
  aside,
  testid,
}: {
  label: ReactNode;
  value: ReactNode;
  aside?: ReactNode;
  testid?: string;
}) {
  return (
    <div data-testid={testid} className="min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate text-2xl font-semibold tabular-nums tracking-tight text-ink">
          {value}
        </span>
        {aside ? <span className="shrink-0 text-xs">{aside}</span> : null}
      </div>
      <div className="mt-0.5 text-xs text-ink-subtle">{label}</div>
    </div>
  );
}
