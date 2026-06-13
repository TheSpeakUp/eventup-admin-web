import { getAdminSession } from "@/lib/auth/session";
import {
  getDashboardRevenue,
  getDashboardFunnel,
  getDashboardContentGrowth,
  getDashboardTops,
} from "@/lib/dashboard/api";
import { type DashboardWindow } from "@/lib/dashboard/types";
import {
  computeDelta,
  dominantCurrency,
  failedRate,
  growthTotals,
  paymentSeries,
  previousWindow,
  revenueByCurrency,
  revenueSeries,
  totalPayments,
  type Delta,
} from "@/lib/dashboard/metrics";
import { formatMoneyMinor } from "@/lib/format";
import { formatCompactMoney } from "@/lib/dashboard/format";
import DateRangeControls from "./_components/dashboard/DateRangeControls";
import KpiCard from "./_components/dashboard/KpiCard";
import RevenueChart from "./_components/dashboard/RevenueChart";
import ContentGrowthChart from "./_components/dashboard/ContentGrowthChart";
import FunnelSection from "./_components/dashboard/FunnelSection";
import TopsSection from "./_components/dashboard/TopsSection";

function ErrorMessage({ message, status }: { message: string; status: number }) {
  const isForbidden = status === 403;
  return (
    <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
      {isForbidden
        ? "Viewing this dashboard requires an admin role."
        : `Failed to load: ${message}`}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-subtle">
      {children}
    </h2>
  );
}

function formatIsoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function isoToDatetime(dateStr: string): string {
  if (!dateStr) return "";
  return `${dateStr}T00:00:00Z`;
}

function signed(n: number): string {
  return n > 0 ? `+${n.toLocaleString()}` : n.toLocaleString();
}

function signedMoney(minor: number, currency: string): string {
  const formatted = formatMoneyMinor(Math.abs(minor), currency);
  return minor >= 0 ? `+${formatted}` : `−${formatted}`;
}

const COMPARE = "vs prev period";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    granularity?: string;
    currency?: string;
  }>;
}) {
  const sp = await searchParams;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const to = sp.to || formatIsoDate(now);
  const from = sp.from || formatIsoDate(thirtyDaysAgo);
  const granularity =
    sp.granularity && ["day", "week", "month"].includes(sp.granularity)
      ? (sp.granularity as "day" | "week" | "month")
      : "day";
  const currency = sp.currency || undefined;

  const session = await getAdminSession();
  const role = session?.role ?? null;
  const canPayments = role === "ADMIN" || role === "SUPERADMIN";
  const canGrowth = canPayments || role === "MODERATOR";

  const window: DashboardWindow = {
    date_from: isoToDatetime(from),
    date_to: isoToDatetime(to),
    granularity,
    currency,
  };
  const prev = previousWindow(window.date_from!, window.date_to!);
  const prevWindow: DashboardWindow = {
    date_from: prev.from,
    date_to: prev.to,
    granularity,
    currency,
  };

  const [
    revenueRes,
    funnelRes,
    growthRes,
    topsRes,
    prevRevenueRes,
    prevGrowthRes,
    prevFunnelRes,
  ] = await Promise.all([
    canPayments ? getDashboardRevenue(window) : Promise.resolve(null),
    canPayments ? getDashboardFunnel(window) : Promise.resolve(null),
    canGrowth ? getDashboardContentGrowth(window) : Promise.resolve(null),
    canPayments ? getDashboardTops(window, 10) : Promise.resolve(null),
    canPayments ? getDashboardRevenue(prevWindow) : Promise.resolve(null),
    canGrowth ? getDashboardContentGrowth(prevWindow) : Promise.resolve(null),
    canPayments ? getDashboardFunnel(prevWindow) : Promise.resolve(null),
  ]);

  const revenue = revenueRes?.ok ? revenueRes.data : null;
  const prevRevenue = prevRevenueRes?.ok ? prevRevenueRes.data : null;
  const growth = growthRes?.ok ? growthRes.data : null;
  const prevGrowth = prevGrowthRes?.ok ? prevGrowthRes.data : null;
  const funnel = funnelRes?.ok ? funnelRes.data : null;
  const prevFunnel = prevFunnelRes?.ok ? prevFunnelRes.data : null;

  // ---- Hero + KPI derived metrics ----
  const cur = dominantCurrency(revenue) ?? currency ?? "USD";
  const curGross = revenueByCurrency(revenue).get(cur)?.gross ?? 0;
  const prevGross = revenueByCurrency(prevRevenue).get(cur)?.gross ?? 0;
  const revenueDelta: Delta = computeDelta(curGross, prevGross);

  const curPayments = totalPayments(revenue);
  const paymentsDelta = computeDelta(curPayments, totalPayments(prevRevenue));

  const g = growthTotals(growth);
  const pg = growthTotals(prevGrowth);
  const providersDelta = computeDelta(g.providers, pg.providers);
  const servicesDelta = computeDelta(g.services, pg.services);
  const offersDelta = computeDelta(g.offers, pg.offers);

  const curFailRate = failedRate(funnel);
  const prevFailRate = failedRate(prevFunnel);
  const failRateDelta =
    curFailRate !== null
      ? computeDelta(curFailRate, prevFailRate ?? curFailRate)
      : null;

  const revenueSpark = revenueSeries(revenue, cur);
  const paymentsSpark = paymentSeries(revenue);

  return (
    <div className="p-8" data-testid="dashboard-page">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Dashboard</h1>
          <span
            className="mt-1 block text-sm text-ink-subtle"
            data-testid="dashboard-window"
          >
            {from} → {to}
          </span>
        </div>
        <DateRangeControls from={from} to={to} granularity={granularity} />
      </div>

      {/* Hero + KPI cards */}
      <div className="mt-6" data-testid="dashboard-kpi-section">
        {canPayments && revenueRes && !revenueRes.ok ? (
          <ErrorMessage message={revenueRes.message} status={revenueRes.status} />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {canPayments ? (
              <>
                <div className="sm:col-span-2">
                  <KpiCard
                    testid={`kpi-revenue-${cur}`}
                    label={`Gross revenue (${cur})`}
                    value={formatMoneyMinor(curGross, cur)}
                    delta={revenueDelta}
                    deltaAbsLabel={signedMoney(revenueDelta.absolute, cur)}
                    comparisonLabel={`${COMPARE} · ${formatCompactMoney(prevGross, cur)}`}
                    sparkData={revenueSpark}
                    sparkColor="#5e6ad2"
                    hero
                  />
                </div>
                <div className="sm:col-span-2">
                  <KpiCard
                    testid="kpi-payments"
                    label="Successful payments"
                    value={curPayments.toLocaleString()}
                    delta={paymentsDelta}
                    deltaAbsLabel={signed(paymentsDelta.absolute)}
                    comparisonLabel={COMPARE}
                    sparkData={paymentsSpark}
                    sparkColor="#5dcaa5"
                    hero
                  />
                </div>
              </>
            ) : null}

            {canGrowth ? (
              <>
                <KpiCard
                  testid="kpi-new-providers"
                  label="New providers"
                  value={g.providers.toLocaleString()}
                  delta={providersDelta}
                  deltaAbsLabel={signed(providersDelta.absolute)}
                  comparisonLabel={COMPARE}
                />
                <KpiCard
                  testid="kpi-new-services"
                  label="New services"
                  value={g.services.toLocaleString()}
                  delta={servicesDelta}
                  deltaAbsLabel={signed(servicesDelta.absolute)}
                  comparisonLabel={COMPARE}
                />
                <KpiCard
                  testid="kpi-new-offers"
                  label="New offers"
                  value={g.offers.toLocaleString()}
                  delta={offersDelta}
                  deltaAbsLabel={signed(offersDelta.absolute)}
                  comparisonLabel={COMPARE}
                />
              </>
            ) : null}

            {canPayments && curFailRate !== null && failRateDelta ? (
              <KpiCard
                testid="kpi-fail-rate"
                label="Failed-payment rate"
                value={`${curFailRate.toFixed(1)}%`}
                delta={failRateDelta}
                invertDelta
                comparisonLabel="of terminal bookings"
              />
            ) : null}
          </div>
        )}
      </div>

      {/* Revenue chart */}
      {canPayments && (
        <section className="mt-8" data-testid="dashboard-revenue-section">
          <SectionHeading>Revenue trend</SectionHeading>
          {revenueRes && !revenueRes.ok ? (
            <ErrorMessage message={revenueRes.message} status={revenueRes.status} />
          ) : revenue ? (
            <RevenueChart
              buckets={revenue.buckets}
              granularity={granularity}
              currency={cur}
            />
          ) : (
            <div className="text-sm text-ink-subtle">No data available</div>
          )}
        </section>
      )}

      {/* Content growth */}
      {canGrowth && (
        <section className="mt-8" data-testid="dashboard-growth-section">
          <SectionHeading>Content growth</SectionHeading>
          {growthRes && !growthRes.ok ? (
            <ErrorMessage message={growthRes.message} status={growthRes.status} />
          ) : growth ? (
            <ContentGrowthChart buckets={growth.buckets} granularity={granularity} />
          ) : (
            <div className="text-sm text-ink-subtle">No data available</div>
          )}
        </section>
      )}

      {/* Funnel */}
      {canPayments && (
        <section className="mt-8" data-testid="dashboard-funnel-section">
          <SectionHeading>Booking funnel</SectionHeading>
          {funnelRes && !funnelRes.ok ? (
            <ErrorMessage message={funnelRes.message} status={funnelRes.status} />
          ) : funnel ? (
            <FunnelSection data={funnel} />
          ) : (
            <div className="text-sm text-ink-subtle">No data available</div>
          )}
        </section>
      )}

      {/* Tops */}
      {canPayments && (
        <section className="mt-8" data-testid="dashboard-tops-section">
          <SectionHeading>Top performers</SectionHeading>
          {topsRes && !topsRes.ok ? (
            <ErrorMessage message={topsRes.message} status={topsRes.status} />
          ) : topsRes?.ok ? (
            <TopsSection data={topsRes.data} />
          ) : (
            <div className="text-sm text-ink-subtle">No data available</div>
          )}
        </section>
      )}

      {!canPayments && !canGrowth && (
        <div className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          You don&apos;t have permission to view the dashboard. Contact an administrator.
        </div>
      )}
    </div>
  );
}
