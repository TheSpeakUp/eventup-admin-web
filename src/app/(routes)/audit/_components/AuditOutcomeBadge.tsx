// Outcome chip for an audit event. The read path tolerates unknown outcome
// strings (backend doesn't enum them on read), so an unlisted value falls back
// to a neutral badge instead of crashing.
import Badge, { type BadgeTone } from "@/app/_components/ui/Badge";

const STYLES: Record<string, { label: string; tone: BadgeTone }> = {
  success: { label: "Success", tone: "success" },
  failure: { label: "Failure", tone: "danger" },
  denied: { label: "Denied", tone: "warning" },
  error: { label: "Error", tone: "danger" },
};

export default function AuditOutcomeBadge({ outcome }: { outcome: string }) {
  const style = STYLES[outcome] ?? { label: outcome, tone: "neutral" as const };
  return (
    <Badge
      tone={style.tone}
      data-testid="audit-outcome-badge"
      data-outcome={outcome}
    >
      {style.label}
    </Badge>
  );
}
