// src/app/(routes)/quality/_components/TierBadge.tsx
// Quality-tier pill. Gold / silver / bronze get distinct hues; anything else
// falls back to zinc — mirrors StatusBadge's ring idiom.
const STYLES: Record<string, string> = {
  gold: "bg-amber-100 text-amber-800 ring-amber-200",
  silver: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  bronze: "bg-orange-100 text-orange-800 ring-orange-200",
};

export default function TierBadge({ tier }: { tier: string }) {
  const cls = STYLES[tier] ?? "bg-blue-100 text-blue-800 ring-blue-200";
  return (
    <span
      data-testid="tier-badge"
      data-tier={tier}
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {tier}
    </span>
  );
}
