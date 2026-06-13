// src/app/(routes)/quality/_components/TierBadge.tsx
// Quality-tier pill. Keeps the data-testid + data-tier hooks the e2e suite
// relies on, restyled to the shared Badge tone palette: gold/bronze → warning
// (amber), silver → neutral, fallback → info.
const STYLES: Record<string, string> = {
  gold: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  silver: "bg-surface-2 text-ink-muted ring-hairline-strong",
  bronze: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
};

export default function TierBadge({ tier }: { tier: string }) {
  const cls = STYLES[tier] ?? "bg-primary/10 text-primary-hover ring-primary/20";
  return (
    <span
      data-testid="tier-badge"
      data-tier={tier}
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {tier}
    </span>
  );
}
