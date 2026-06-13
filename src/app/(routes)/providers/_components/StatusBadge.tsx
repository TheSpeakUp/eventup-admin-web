import type { ProviderStatus } from "@/lib/providers/types";
import Badge, { type BadgeTone } from "@/app/_components/ui/Badge";

const STYLES: Record<ProviderStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: "Pending", tone: "warning" },
  verified: { label: "Verified", tone: "success" },
  blocked: { label: "Blocked", tone: "danger" },
  canceled: { label: "Canceled", tone: "neutral" },
};

export default function StatusBadge({ status }: { status: ProviderStatus }) {
  const { label, tone } = STYLES[status];
  return (
    <span data-testid="status-badge" data-status={status}>
      <Badge tone={tone}>{label}</Badge>
    </span>
  );
}
