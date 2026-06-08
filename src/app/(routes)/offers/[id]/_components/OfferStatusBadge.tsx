import type { OfferStatus } from "@/lib/offers/types";

const STYLES: Record<OfferStatus, string> = {
  on_review: "bg-amber-100 text-amber-800",
  active: "bg-emerald-100 text-emerald-800",
  disabled: "bg-zinc-200 text-zinc-700",
  rejected: "bg-red-100 text-red-800",
  archived: "bg-zinc-100 text-zinc-500",
};

export default function OfferStatusBadge({ status }: { status: OfferStatus }) {
  return (
    <span
      data-testid="status-badge"
      data-status={status}
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {status}
    </span>
  );
}
