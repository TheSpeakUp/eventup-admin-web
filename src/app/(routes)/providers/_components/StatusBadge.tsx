import type { ProviderStatus } from "@/lib/providers/types";

const STYLES: Record<ProviderStatus, { label: string; cls: string }> = {
  pending: {
    label: "Pending",
    cls: "bg-amber-100 text-amber-800 ring-amber-200",
  },
  verified: {
    label: "Verified",
    cls: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  },
  blocked: {
    label: "Blocked",
    cls: "bg-red-100 text-red-800 ring-red-200",
  },
  canceled: {
    label: "Canceled",
    cls: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  },
};

export default function StatusBadge({ status }: { status: ProviderStatus }) {
  const { label, cls } = STYLES[status];
  return (
    <span
      data-testid="status-badge"
      data-status={status}
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {label}
    </span>
  );
}
