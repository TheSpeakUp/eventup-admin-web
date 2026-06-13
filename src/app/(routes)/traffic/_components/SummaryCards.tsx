import {
  formatCount,
  formatCtr,
  type AdminAnalyticsSummary,
} from "@/lib/traffic/types";

function Card({
  label,
  value,
  testid,
}: {
  label: string;
  value: string;
  testid: string;
}) {
  return (
    <div
      data-testid={testid}
      className="rounded border border-zinc-200 bg-surface-1 px-4 py-3"
    >
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900">
        {value}
      </div>
    </div>
  );
}

export default function SummaryCards({
  summary,
}: {
  summary: AdminAnalyticsSummary;
}) {
  return (
    <div className="grid grid-cols-3 gap-3" data-testid="traffic-summary-cards">
      <Card
        testid="card-views"
        label="Views"
        value={formatCount(summary.total_views)}
      />
      <Card
        testid="card-clicks"
        label="Clicks"
        value={formatCount(summary.total_clicks)}
      />
      <Card testid="card-ctr" label="CTR" value={formatCtr(summary.ctr)} />
    </div>
  );
}
