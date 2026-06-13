import Badge, { type BadgeTone } from "@/app/_components/ui/Badge";
import type { OfferStatus } from "@/lib/offers/types";

const TONES: Record<OfferStatus, BadgeTone> = {
  on_review: "warning",
  active: "success",
  disabled: "neutral",
  rejected: "danger",
  archived: "neutral",
};

export default function OfferStatusBadge({ status }: { status: OfferStatus }) {
  return (
    <Badge tone={TONES[status]} data-testid="status-badge" data-status={status}>
      {status}
    </Badge>
  );
}
