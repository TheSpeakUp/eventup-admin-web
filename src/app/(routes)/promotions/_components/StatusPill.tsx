// src/app/(routes)/promotions/_components/StatusPill.tsx
// Generic status pill for free-form order / campaign statuses. Greens for
// paid/active, zinc for canceled/expired/pending — mirrors ActiveBadge's idiom.
const GREEN = new Set(["paid", "active"]);
const RED = new Set(["canceled", "cancelled", "failed", "refunded"]);

export default function StatusPill({ status }: { status: string }) {
  let cls = "bg-amber-100 text-amber-800 ring-amber-200";
  if (GREEN.has(status)) cls = "bg-emerald-100 text-emerald-800 ring-emerald-200";
  else if (RED.has(status)) cls = "bg-zinc-100 text-zinc-700 ring-zinc-200";
  return (
    <span
      data-testid="status-pill"
      data-status={status}
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {status}
    </span>
  );
}
