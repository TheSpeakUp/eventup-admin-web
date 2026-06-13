import type { QueueStatus } from "@/lib/offers/types";
import type { BadgeTone } from "@/app/_components/ui/Badge";

// Dark-safe queue badge. Keeps its own <span> so `data-testid="queue-status-badge"`
// + `data-queue-status` (asserted by Playwright) stay on the colored element.
const TONE_CLS: Record<BadgeTone, string> = {
  neutral: "bg-surface-2 text-ink-muted ring-hairline-strong",
  success: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  danger: "bg-red-500/10 text-red-400 ring-red-500/20",
  info: "bg-primary/10 text-primary-hover ring-primary/20",
};

const TONES: Record<QueueStatus, BadgeTone> = {
  in_sla: "success",
  warning: "warning",
  overdue_response: "danger",
  closed_without_response: "neutral",
};

export default function QueueStatusBadge({ status }: { status: QueueStatus }) {
  return (
    <span
      data-testid="queue-status-badge"
      data-queue-status={status}
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TONE_CLS[TONES[status]]}`}
    >
      {status}
    </span>
  );
}
