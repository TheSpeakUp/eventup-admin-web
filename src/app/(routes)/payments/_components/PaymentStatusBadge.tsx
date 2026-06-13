// Mirrors providers/_components/StatusBadge.tsx but for payment statuses.
// The read path tolerates unknown status strings (backend doesn't enum them),
// so an unlisted value falls back to a neutral badge instead of crashing.
import Badge, { type BadgeTone } from "@/app/_components/ui/Badge";

const STYLES: Record<string, { label: string; tone: BadgeTone }> = {
  pending: { label: "Pending", tone: "warning" },
  processing: { label: "Processing", tone: "info" },
  succeeded: { label: "Succeeded", tone: "success" },
  failed: { label: "Failed", tone: "danger" },
  canceled: { label: "Canceled", tone: "neutral" },
  partially_refunded: { label: "Partially refunded", tone: "violet" },
  refunded: { label: "Refunded", tone: "violet" },
};

export default function PaymentStatusBadge({ status }: { status: string }) {
  const style = STYLES[status] ?? { label: status, tone: "neutral" as const };
  return (
    <Badge
      tone={style.tone}
      data-testid="payment-status-badge"
      data-status={status}
    >
      {style.label}
    </Badge>
  );
}
