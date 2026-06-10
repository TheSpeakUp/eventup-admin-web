// src/app/(routes)/promo-codes/_components/PromoStatusBadge.tsx
export default function PromoStatusBadge({ isActive }: { isActive: boolean }) {
  const cls = isActive
    ? "bg-emerald-100 text-emerald-800 ring-emerald-200"
    : "bg-zinc-100 text-zinc-700 ring-zinc-200";
  return (
    <span
      data-testid="promo-status-badge"
      data-active={isActive}
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}
