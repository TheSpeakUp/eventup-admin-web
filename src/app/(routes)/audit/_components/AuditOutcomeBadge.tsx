// Outcome chip for an audit event. The read path tolerates unknown outcome
// strings (backend doesn't enum them on read), so an unlisted value falls back
// to a neutral zinc badge instead of crashing.

const STYLES: Record<string, { label: string; cls: string }> = {
  success: {
    label: "Success",
    cls: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  },
  failure: {
    label: "Failure",
    cls: "bg-red-100 text-red-800 ring-red-200",
  },
  denied: {
    label: "Denied",
    cls: "bg-amber-100 text-amber-800 ring-amber-200",
  },
  error: {
    label: "Error",
    cls: "bg-red-100 text-red-800 ring-red-200",
  },
};

const FALLBACK = { label: "", cls: "bg-zinc-100 text-zinc-700 ring-zinc-200" };

export default function AuditOutcomeBadge({ outcome }: { outcome: string }) {
  const style = STYLES[outcome] ?? { ...FALLBACK, label: outcome };
  return (
    <span
      data-testid="audit-outcome-badge"
      data-outcome={outcome}
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${style.cls}`}
    >
      {style.label}
    </span>
  );
}
