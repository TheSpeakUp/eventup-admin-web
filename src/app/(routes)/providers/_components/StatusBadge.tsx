import Badge, { type BadgeTone } from "@/app/_components/ui/Badge";
import type { ProviderStatus } from "@/lib/providers/types";

const STYLES: Record<ProviderStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: "Pending", tone: "warning" },
  verified: { label: "Verified", tone: "success" },
  blocked: { label: "Blocked", tone: "danger" },
  canceled: { label: "Canceled", tone: "neutral" },
};

export default function StatusBadge({ status }: { status: ProviderStatus }) {
  const { label, tone } = STYLES[status];
  return (
    <Badge tone={tone} data-testid="status-badge" data-status={status}>
      {label}
    </Badge>
  );
}
