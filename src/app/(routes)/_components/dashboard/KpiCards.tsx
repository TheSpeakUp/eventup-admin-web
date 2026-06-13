import { formatMoneyMinor } from "@/lib/format";
import type { RevenueResponse, ContentGrowthResponse } from "@/lib/dashboard/types";

function Card({
  label,
  value,
  testid,
}: {
  label: string;
  value: string | null;
  testid: string;
}) {
  return (
    <div
      data-testid={testid}
      className="rounded-lg border border-zinc-200 bg-surface-1 px-5 py-4 transition-colors hover:border-hairline-strong"
    >
      <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-zinc-900">
        {value ?? "—"}
      </div>
    </div>
  );
}

export default function KpiCards({
  revenueData,
  growthData,
}: {
  revenueData: RevenueResponse | null;
  growthData: ContentGrowthResponse | null;
}) {
  // Aggregate revenue by currency (group by currency, sum gross_minor + payment_count)
  const revenueByCurrency: Map<string, { gross: number; payments: number }> =
    new Map();
  let totalPayments = 0;

  if (revenueData) {
    revenueData.buckets.forEach((b) => {
      const key = b.currency;
      if (!revenueByCurrency.has(key)) {
        revenueByCurrency.set(key, { gross: 0, payments: 0 });
      }
      const entry = revenueByCurrency.get(key)!;
      entry.gross += b.gross_minor;
      entry.payments += b.payment_count;
      totalPayments += b.payment_count;
    });
  }

  // Aggregate content growth
  let totalNewProviders = 0;
  let totalNewServices = 0;
  let totalNewOffers = 0;

  if (growthData) {
    growthData.buckets.forEach((b) => {
      totalNewProviders += b.new_providers;
      totalNewServices += b.new_services;
      totalNewOffers += b.new_offers;
    });
  }

  // Format revenue cards (one per currency) + growth cards
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="dashboard-kpi-cards">
      {/* Revenue by currency */}
      {Array.from(revenueByCurrency.entries()).map(([currency, entry]) => (
        <Card
          key={`revenue-${currency}`}
          testid={`kpi-revenue-${currency}`}
          label={`Gross Revenue (${currency})`}
          value={formatMoneyMinor(entry.gross, currency)}
        />
      ))}

      {/* Payment count */}
      {revenueData && (
        <Card
          testid="kpi-payments"
          label="Total Payments"
          value={totalPayments.toLocaleString()}
        />
      )}

      {/* Content growth */}
      {growthData && (
        <>
          <Card
            testid="kpi-new-providers"
            label="New Providers"
            value={totalNewProviders.toLocaleString()}
          />
          <Card
            testid="kpi-new-services"
            label="New Services"
            value={totalNewServices.toLocaleString()}
          />
          <Card
            testid="kpi-new-offers"
            label="New Offers"
            value={totalNewOffers.toLocaleString()}
          />
        </>
      )}
    </div>
  );
}
