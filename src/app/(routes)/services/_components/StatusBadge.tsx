import type { ServiceStatus } from "@/lib/services/types";

const STYLES: Record<ServiceStatus, { label: string; cls: string }> = {
  pending_review: {
    label: "Pending review",
    cls: "bg-amber-100 text-amber-800 ring-amber-200",
  },
  published: {
    label: "Published",
    cls: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  },
  needs_changes: {
    label: "Needs changes",
    cls: "bg-orange-100 text-orange-800 ring-orange-200",
  },
  hidden: {
    label: "Hidden",
    cls: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  },
  rejected: {
    label: "Rejected",
    cls: "bg-red-100 text-red-800 ring-red-200",
  },
};

export default function StatusBadge({ status }: { status: ServiceStatus }) {
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
