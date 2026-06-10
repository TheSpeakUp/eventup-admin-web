// Mirrors providers/_components/StatusBadge.tsx but for payment statuses.
// The read path tolerates unknown status strings (backend doesn't enum them),
// so an unlisted value falls back to a neutral zinc badge instead of crashing.

const STYLES: Record<string, { label: string; cls: string }> = {
  pending: {
    label: "Pending",
    cls: "bg-amber-100 text-amber-800 ring-amber-200",
  },
  processing: {
    label: "Processing",
    cls: "bg-blue-100 text-blue-800 ring-blue-200",
  },
  succeeded: {
    label: "Succeeded",
    cls: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  },
  failed: {
    label: "Failed",
    cls: "bg-red-100 text-red-800 ring-red-200",
  },
  canceled: {
    label: "Canceled",
    cls: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  },
  partially_refunded: {
    label: "Partially refunded",
    cls: "bg-violet-50 text-violet-700 ring-violet-200",
  },
  refunded: {
    label: "Refunded",
    cls: "bg-violet-100 text-violet-800 ring-violet-200",
  },
};

const FALLBACK = { label: "", cls: "bg-zinc-100 text-zinc-700 ring-zinc-200" };

export default function PaymentStatusBadge({ status }: { status: string }) {
  const style = STYLES[status] ?? { ...FALLBACK, label: status };
  return (
    <span
      data-testid="payment-status-badge"
      data-status={status}
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${style.cls}`}
    >
      {style.label}
    </span>
  );
}
