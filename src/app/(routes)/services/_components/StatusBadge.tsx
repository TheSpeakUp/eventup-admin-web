import type { ServiceStatus } from "@/lib/services/types";
import type { BadgeTone } from "@/app/_components/ui/Badge";

// Dark-safe status badge. Tones mirror the shared <Badge> palette, but this keeps
// its own <span> so the `data-testid="status-badge"` + `data-status` attributes
// the Playwright suite asserts ride on the colored element itself.
const TONE_CLS: Record<BadgeTone, string> = {
  neutral: "bg-surface-2 text-ink-muted ring-hairline-strong",
  success: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  danger: "bg-red-500/10 text-red-400 ring-red-500/20",
  info: "bg-primary/10 text-primary-hover ring-primary/20",
};

const STYLES: Record<ServiceStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: "Draft", tone: "neutral" },
  on_review: { label: "On review", tone: "warning" },
  published: { label: "Published", tone: "success" },
  unpublished: { label: "Unpublished", tone: "warning" },
  archived: { label: "Archived", tone: "danger" },
};

export default function StatusBadge({ status }: { status: ServiceStatus }) {
  const { label, tone } = STYLES[status];
  return (
    <span
      data-testid="status-badge"
      data-status={status}
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TONE_CLS[tone]}`}
    >
      {label}
    </span>
  );
}
