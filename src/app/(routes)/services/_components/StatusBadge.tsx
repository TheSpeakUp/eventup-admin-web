import Badge, { type BadgeTone } from "@/app/_components/ui/Badge";
import type { ServiceStatus } from "@/lib/services/types";

const STYLES: Record<ServiceStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: "Draft", tone: "neutral" },
  on_review: { label: "On review", tone: "warning" },
  published: { label: "Published", tone: "success" },
  unpublished: { label: "Unpublished", tone: "orange" },
  archived: { label: "Archived", tone: "danger" },
};

export default function StatusBadge({ status }: { status: ServiceStatus }) {
  const { label, tone } = STYLES[status];
  return (
    <Badge tone={tone} data-testid="status-badge" data-status={status}>
      {label}
    </Badge>
  );
}
