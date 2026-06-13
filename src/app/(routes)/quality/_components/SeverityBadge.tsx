// src/app/(routes)/quality/_components/SeverityBadge.tsx
// Anomaly severity pill. high → red, medium → amber, low/unknown → neutral.
import Badge, { type BadgeTone } from "@/app/_components/ui/Badge";

const TONES: Record<string, BadgeTone> = {
  high: "danger",
  medium: "warning",
  low: "neutral",
};

export default function SeverityBadge({ severity }: { severity: string }) {
  return (
    <Badge
      tone={TONES[severity] ?? "neutral"}
      data-testid="severity-badge"
      data-severity={severity}
    >
      {severity}
    </Badge>
  );
}
