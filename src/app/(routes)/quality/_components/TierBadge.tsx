// src/app/(routes)/quality/_components/TierBadge.tsx
// Quality-tier pill. Gold / silver / bronze get distinct hues; anything else
// falls back to info.
import Badge, { type BadgeTone } from "@/app/_components/ui/Badge";

const TONES: Record<string, BadgeTone> = {
  gold: "warning",
  silver: "neutral",
  bronze: "orange",
};

export default function TierBadge({ tier }: { tier: string }) {
  return (
    <Badge tone={TONES[tier] ?? "info"} data-testid="tier-badge" data-tier={tier}>
      {tier}
    </Badge>
  );
}
