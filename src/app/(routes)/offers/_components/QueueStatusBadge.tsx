import type { QueueStatus } from "@/lib/offers/types";

const STYLES: Record<QueueStatus, string> = {
  in_sla: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
  overdue_response: "bg-red-100 text-red-800",
  closed_without_response: "bg-zinc-200 text-zinc-700",
};

export default function QueueStatusBadge({ status }: { status: QueueStatus }) {
  return (
    <span
      data-testid="queue-status-badge"
      data-queue-status={status}
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {status}
    </span>
  );
}
