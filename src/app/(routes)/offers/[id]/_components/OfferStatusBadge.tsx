import type { OfferStatus } from "@/lib/offers/types";
import type { BadgeTone } from "@/app/_components/ui/Badge";

// Dark-safe offer-status badge. Keeps its own <span> so `data-testid="status-badge"`
// + `data-status` (asserted by Playwright) stay on the colored element.
const TONE_CLS: Record<BadgeTone, string> = {
  neutral: "bg-surface-2 text-ink-muted ring-hairline-strong",
  success: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  danger: "bg-red-500/10 text-red-400 ring-red-500/20",
  info: "bg-primary/10 text-primary-hover ring-primary/20",
};

const TONES: Record<OfferStatus, BadgeTone> = {
  on_review: "warning",
  active: "success",
  disabled: "neutral",
  rejected: "danger",
  archived: "neutral",
};

export default function OfferStatusBadge({ status }: { status: OfferStatus }) {
  return (
    <span
      data-testid="status-badge"
      data-status={status}
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TONE_CLS[TONES[status]]}`}
    >
      {status}
    </span>
  );
}
