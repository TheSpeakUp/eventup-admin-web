// src/app/(routes)/promo-codes/_components/PromoStatusBadge.tsx
// Keeps the data-testid + data-active hooks the e2e suite asserts, while
// adopting the shared Badge tone palette (success / neutral) so the pill is
// dark-safe and consistent with the other surfaces.
const TONES = {
  active: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  inactive: "bg-surface-2 text-ink-muted ring-hairline-strong",
};

export default function PromoStatusBadge({ isActive }: { isActive: boolean }) {
  const cls = isActive ? TONES.active : TONES.inactive;
  return (
    <span
      data-testid="promo-status-badge"
      data-active={isActive}
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}
