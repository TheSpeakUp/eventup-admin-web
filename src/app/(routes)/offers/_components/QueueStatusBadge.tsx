import Badge, { type BadgeTone } from "@/app/_components/ui/Badge";
import type { QueueStatus } from "@/lib/offers/types";

const TONES: Record<QueueStatus, BadgeTone> = {
  in_sla: "success",
  warning: "warning",
  overdue_response: "danger",
  closed_without_response: "neutral",
};

export default function QueueStatusBadge({ status }: { status: QueueStatus }) {
  return (
    <Badge
      tone={TONES[status]}
      data-testid="queue-status-badge"
      data-queue-status={status}
    >
      {status}
    </Badge>
  );
}
