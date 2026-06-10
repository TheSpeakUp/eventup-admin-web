// src/app/(routes)/promotions/_components/ActiveBadge.tsx
// Active / inactive status pill — mirrors providers/_components/StatusBadge.tsx.
export default function ActiveBadge({ isActive }: { isActive: boolean }) {
  const cls = isActive
    ? "bg-emerald-100 text-emerald-800 ring-emerald-200"
    : "bg-zinc-100 text-zinc-700 ring-zinc-200";
  return (
    <span
      data-testid="active-badge"
      data-active={isActive}
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}
