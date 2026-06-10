// src/app/(routes)/quality/_components/SeverityBadge.tsx
// Anomaly severity pill. high → red, medium → amber, low → zinc; unknown falls
// back to zinc.
const STYLES: Record<string, string> = {
  high: "bg-red-100 text-red-800 ring-red-200",
  medium: "bg-amber-100 text-amber-800 ring-amber-200",
  low: "bg-zinc-100 text-zinc-700 ring-zinc-200",
};

export default function SeverityBadge({ severity }: { severity: string }) {
  const cls = STYLES[severity] ?? "bg-zinc-100 text-zinc-700 ring-zinc-200";
  return (
    <span
      data-testid="severity-badge"
      data-severity={severity}
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {severity}
    </span>
  );
}
