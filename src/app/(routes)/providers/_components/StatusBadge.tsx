import type { ProviderStatus } from "@/lib/providers/types";

const STYLES: Record<ProviderStatus, { label: string; cls: string }> = {
  pending_review: {
    label: "Pending review",
    cls: "bg-amber-100 text-amber-800 ring-amber-200",
  },
  approved: {
    label: "Approved",
    cls: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  },
  suspended: {
    label: "Suspended",
    cls: "bg-orange-100 text-orange-800 ring-orange-200",
  },
  rejected: {
    label: "Rejected",
    cls: "bg-red-100 text-red-800 ring-red-200",
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
