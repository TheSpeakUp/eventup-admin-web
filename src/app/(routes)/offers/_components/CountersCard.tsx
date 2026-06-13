import type { SlaCounters } from "@/lib/offers/types";

const LABELS: { key: keyof SlaCounters; label: string }[] = [
  { key: "total_on_review", label: "On review" },
  { key: "in_sla", label: "In SLA" },
  { key: "warning", label: "Warning" },
  { key: "overdue_response", label: "Overdue" },
  { key: "closed_without_response_candidates", label: "Auto-close candidates" },
];

export default function CountersCard({ counters }: { counters: SlaCounters }) {
  return (
    <div data-testid="counters-card" className="grid grid-cols-2 gap-2 rounded-md border border-zinc-200 bg-surface-1 p-3 sm:grid-cols-5">
      {LABELS.map((l) => (
        <div key={l.key} className="flex flex-col">
          <span className="text-xs text-zinc-500">{l.label}</span>
          <span data-testid={`counter-${l.key}`} className="text-lg font-semibold text-zinc-900">
            {counters[l.key]}
          </span>
        </div>
      ))}
    </div>
  );
}
