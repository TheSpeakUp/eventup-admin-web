import Link from "next/link";
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
import {
  Alert,
  PageHeader,
  Panel,
  StatTile,
  Tabs,
  buttonClass,
  type TabItem,
} from "@/app/_components/ui";
import DateRangeControls from "./_components/dashboard/DateRangeControls";
import KpiCard from "./_components/dashboard/KpiCard";
import BadgeDelta from "./_components/dashboard/BadgeDelta";
import Sparkline from "./_components/dashboard/Sparkline";
import BarList, { type BarListItem } from "./_components/dashboard/BarList";
import RevenueChart from "./_components/dashboard/RevenueChart";
import ContentGrowthChart from "./_components/dashboard/ContentGrowthChart";
import FunnelSection from "./_components/dashboard/FunnelSection";
import TopsSection from "./_components/dashboard/TopsSection";

function loadError(res: { ok: false; message: string; status: number }) {
  return (
    <Alert variant="danger">
      {res.status === 403
        ? "Viewing this requires an admin role."
        : `Failed to load: ${res.message}`}
    </Alert>
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
    tab?: string;
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

  // ---- Derived metrics ----
  const cur = dominantCurrency(revenue) ?? currency ?? "USD";
  const curGross = revenueByCurrency(revenue).get(cur)?.gross ?? 0;
  const prevGross = revenueByCurrency(prevRevenue).get(cur)?.gross ?? 0;
  const revenueDelta: Delta = computeDelta(curGross, prevGross);

  const curPayments = totalPayments(revenue);
  const paymentsDelta = computeDelta(curPayments, totalPayments(prevRevenue));

  const gt = growthTotals(growth);
  const pg = growthTotals(prevGrowth);
  const providersDelta = computeDelta(gt.providers, pg.providers);
  const servicesDelta = computeDelta(gt.services, pg.services);
  const offersDelta = computeDelta(gt.offers, pg.offers);

  const curFailRate = failedRate(funnel);
  const prevFailRate = failedRate(prevFunnel);
  const failRateDelta =
    curFailRate !== null
      ? computeDelta(curFailRate, prevFailRate ?? curFailRate)
      : null;

  const revenueSpark = revenueSeries(revenue, cur);
  const paymentsSpark = paymentSeries(revenue);

  const topProviders: BarListItem[] = (topsRes?.ok ? topsRes.data.providers : [])
    .slice(0, 3)
    .map((p) => ({
      label: p.provider_name || `Provider #${p.provider_id}`,
      value: p.gross_minor,
      valueLabel: formatMoneyMinor(p.gross_minor, p.currency),
    }));

  const funnelTop = funnel
    ? [...funnel.status_counts].sort((a, b) => b.count - a.count).slice(0, 3)
    : [];

  // ---- Tabs (URL-driven; only the zones this role can see) ----
  const qs = (tab: string) => {
    const p = new URLSearchParams();
    p.set("from", from);
    p.set("to", to);
    p.set("granularity", granularity);
    if (currency) p.set("currency", currency);
    p.set("tab", tab);
    return `/?${p.toString()}`;
  };

  const tabs: TabItem[] = [
    { key: "overview", label: "Overview", href: qs("overview") },
    ...(canPayments
      ? [{ key: "revenue", label: "Revenue", href: qs("revenue") }]
      : []),
    ...(canGrowth
      ? [{ key: "growth", label: "Growth", href: qs("growth") }]
      : []),
    ...(canPayments
      ? [{ key: "operations", label: "Operations", href: qs("operations") }]
      : []),
  ];
  const validKeys = new Set(tabs.map((t) => t.key));
  const tab = sp.tab && validKeys.has(sp.tab) ? sp.tab : "overview";

  const openLink = (key: string) => (
    <Link href={qs(key)} className={buttonClass("ghost", "sm")}>
      Open →
    </Link>
  );

  return (
    <div className="p-8" data-testid="dashboard-page">
      <PageHeader
        title="Dashboard"
        description={
          <span data-testid="dashboard-window">
            {from} → {to}
          </span>
        }
        actions={
          <DateRangeControls
            from={from}
            to={to}
            granularity={granularity}
            tab={tab}
          />
        }
      />

      <div className="mt-5">
        <Tabs items={tabs} current={tab} />
      </div>

      {/* ---- Overview: calm summary, one bounded panel per zone ---- */}
      {tab === "overview" && (
        <div
          className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2"
          data-testid="dashboard-kpi-section"
        >
          {canPayments && (
            <Panel
              title="Revenue & payments"
              accent="success"
              action={openLink("revenue")}
            >
              {revenueRes && !revenueRes.ok ? (
                loadError(revenueRes)
              ) : (
                <>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-3xl font-semibold tabular-nums tracking-tight text-ink">
                      {formatMoneyMinor(curGross, cur)}
                    </span>
                    <BadgeDelta delta={revenueDelta} />
                  </div>
                  <div className="mt-0.5 text-xs text-ink-subtle">
                    Gross revenue ({cur}) · {COMPARE} ·{" "}
                    {formatCompactMoney(prevGross, cur)}
                  </div>
                  {revenueSpark.length >= 2 && (
                    <div className="mt-3">
                      <Sparkline data={revenueSpark} color="#5e6ad2" height={44} />
                    </div>
                  )}
                  <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3 text-sm">
                    <span className="text-ink-subtle">Successful payments</span>
                    <span className="flex items-center gap-2">
                      <span className="font-medium tabular-nums text-ink">
                        {curPayments.toLocaleString()}
                      </span>
                      <BadgeDelta delta={paymentsDelta} />
                    </span>
                  </div>
                </>
              )}
            </Panel>
          )}

          {canGrowth && (
            <Panel
              title="Marketplace growth"
              accent="info"
              action={openLink("growth")}
            >
              {growthRes && !growthRes.ok ? (
                loadError(growthRes)
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  <StatTile label="Providers" value={gt.providers.toLocaleString()} />
                  <StatTile label="Services" value={gt.services.toLocaleString()} />
                  <StatTile label="Offers" value={gt.offers.toLocaleString()} />
                </div>
              )}
            </Panel>
          )}

          {canPayments && (
            <Panel
              title="Booking operations"
              accent="warning"
              action={openLink("operations")}
            >
              {funnelRes && !funnelRes.ok ? (
                loadError(funnelRes)
              ) : funnelTop.length > 0 ? (
                <>
                  <div className="space-y-2 text-sm">
                    {funnelTop.map((s) => (
                      <div
                        key={s.status}
                        className="flex items-center justify-between"
                      >
                        <span className="capitalize text-ink-subtle">
                          {s.status}
                        </span>
                        <span className="font-medium tabular-nums text-ink">
                          {s.count.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                  {curFailRate !== null && (
                    <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3 text-sm">
                      <span className="text-ink-subtle">Failed-payment rate</span>
                      <span className="font-medium tabular-nums text-ink">
                        {curFailRate.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-ink-subtle">No booking data</p>
              )}
            </Panel>
          )}

          {canPayments && (
            <Panel
              title="Top performers"
              accent="violet"
              action={openLink("operations")}
            >
              {topsRes && !topsRes.ok ? (
                loadError(topsRes)
              ) : (
                <BarList items={topProviders} emptyMessage="No revenue yet" />
              )}
            </Panel>
          )}

          {!canPayments && !canGrowth && (
            <Alert variant="warning" className="lg:col-span-2">
              You don&apos;t have permission to view the dashboard. Contact an
              administrator.
            </Alert>
          )}
        </div>
      )}

      {/* ---- Revenue zone ---- */}
      {tab === "revenue" && canPayments && (
        <div className="mt-5 space-y-4" data-testid="dashboard-revenue-section">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
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
          <div>
            <SectionHeading>Revenue trend</SectionHeading>
            {revenueRes && !revenueRes.ok ? (
              loadError(revenueRes)
            ) : revenue ? (
              <RevenueChart
                buckets={revenue.buckets}
                granularity={granularity}
                currency={cur}
              />
            ) : (
              <p className="text-sm text-ink-subtle">No data available</p>
            )}
          </div>
        </div>
      )}

      {/* ---- Growth zone ---- */}
      {tab === "growth" && canGrowth && (
        <div className="mt-5 space-y-4" data-testid="dashboard-growth-section">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <KpiCard
              testid="kpi-new-providers"
              label="New providers"
              value={gt.providers.toLocaleString()}
              delta={providersDelta}
              deltaAbsLabel={signed(providersDelta.absolute)}
              comparisonLabel={COMPARE}
            />
            <KpiCard
              testid="kpi-new-services"
              label="New services"
              value={gt.services.toLocaleString()}
              delta={servicesDelta}
              deltaAbsLabel={signed(servicesDelta.absolute)}
              comparisonLabel={COMPARE}
            />
            <KpiCard
              testid="kpi-new-offers"
              label="New offers"
              value={gt.offers.toLocaleString()}
              delta={offersDelta}
              deltaAbsLabel={signed(offersDelta.absolute)}
              comparisonLabel={COMPARE}
            />
          </div>
          <div>
            <SectionHeading>Content growth</SectionHeading>
            {growthRes && !growthRes.ok ? (
              loadError(growthRes)
            ) : growth ? (
              <ContentGrowthChart
                buckets={growth.buckets}
                granularity={granularity}
              />
            ) : (
              <p className="text-sm text-ink-subtle">No data available</p>
            )}
          </div>
        </div>
      )}

      {/* ---- Operations zone ---- */}
      {tab === "operations" && canPayments && (
        <div className="mt-5 space-y-4">
          {curFailRate !== null && failRateDelta && (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <KpiCard
                testid="kpi-fail-rate"
                label="Failed-payment rate"
                value={`${curFailRate.toFixed(1)}%`}
                delta={failRateDelta}
                invertDelta
                comparisonLabel="of terminal bookings"
              />
            </div>
          )}
          <div data-testid="dashboard-funnel-section">
            <SectionHeading>Booking funnel</SectionHeading>
            {funnelRes && !funnelRes.ok ? (
              loadError(funnelRes)
            ) : funnel ? (
              <FunnelSection data={funnel} />
            ) : (
              <p className="text-sm text-ink-subtle">No data available</p>
            )}
          </div>
          <div data-testid="dashboard-tops-section">
            <SectionHeading>Top performers</SectionHeading>
            {topsRes && !topsRes.ok ? (
              loadError(topsRes)
            ) : topsRes?.ok ? (
              <TopsSection data={topsRes.data} />
            ) : (
              <p className="text-sm text-ink-subtle">No data available</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
