// src/app/(routes)/quality/_components/SeverityBadge.tsx
// Anomaly severity pill. Keeps the data-testid + data-severity hooks, restyled
// to the shared Badge tone palette: high → danger, medium → warning, low /
// unknown → neutral.
const STYLES: Record<string, string> = {
  high: "bg-red-500/10 text-red-400 ring-red-500/20",
  medium: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  low: "bg-surface-2 text-ink-muted ring-hairline-strong",
};

export default function SeverityBadge({ severity }: { severity: string }) {
  const cls = STYLES[severity] ?? "bg-surface-2 text-ink-muted ring-hairline-strong";
  return (
    <span
      data-testid="severity-badge"
      data-severity={severity}
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {severity}
    </span>
  );
}
