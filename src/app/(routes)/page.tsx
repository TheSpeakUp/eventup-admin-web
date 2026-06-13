import { getAdminSession } from "@/lib/auth/session";
import {
  getDashboardRevenue,
  getDashboardFunnel,
  getDashboardContentGrowth,
  getDashboardTops,
} from "@/lib/dashboard/api";
import { type DashboardWindow } from "@/lib/dashboard/types";
import DateRangeControls from "./_components/dashboard/DateRangeControls";
import KpiCards from "./_components/dashboard/KpiCards";
import RevenueChart from "./_components/dashboard/RevenueChart";
import ContentGrowthChart from "./_components/dashboard/ContentGrowthChart";
import FunnelSection from "./_components/dashboard/FunnelSection";
import TopsSection from "./_components/dashboard/TopsSection";

function ErrorMessage({ message, status }: { message: string; status: number }) {
  const isForbidden = status === 403;
  return (
    <div className="rounded border border-red-200 bg-red-50 p-3 text-red-800">
      {isForbidden
        ? "Viewing this dashboard requires an admin role."
        : `Failed to load: ${message}`}
    </div>
  );
}

function formatIsoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function isoToDatetime(dateStr: string): string {
  // Convert YYYY-MM-DD to ISO datetime (00:00:00Z)
  if (!dateStr) return "";
  return `${dateStr}T00:00:00Z`;
}

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

  // Defaults
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const to = sp.to || formatIsoDate(now);
  const from = sp.from || formatIsoDate(thirtyDaysAgo);
  const granularity =
    sp.granularity && ["day", "week", "month"].includes(sp.granularity)
      ? (sp.granularity as "day" | "week" | "month")
      : "day";
  const currency = sp.currency || undefined;

  // Auth
  const session = await getAdminSession();
  const role = session?.role ?? null;

  const canPayments = role === "ADMIN" || role === "SUPERADMIN";
  const canGrowth = canPayments || role === "MODERATOR";

  // Window for API calls (ISO datetime format)
  const window: DashboardWindow = {
    date_from: isoToDatetime(from),
    date_to: isoToDatetime(to),
    granularity,
    currency,
  };

  // Fetch data in parallel — only call endpoints we have permission for
  const [revenueRes, funnelRes, growthRes, topsRes] = await Promise.all([
    canPayments ? getDashboardRevenue(window) : Promise.resolve(null),
    canPayments ? getDashboardFunnel(window) : Promise.resolve(null),
    canGrowth ? getDashboardContentGrowth(window) : Promise.resolve(null),
    canPayments ? getDashboardTops(window, 10) : Promise.resolve(null),
  ]);

  return (
    <div className="p-8" data-testid="dashboard-page">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <span className="text-sm text-zinc-500" data-testid="dashboard-window">
          {from} → {to}
        </span>
      </div>

      <div className="mt-4">
        <DateRangeControls from={from} to={to} granularity={granularity} />
      </div>

      {/* KPI Cards */}
      <div className="mt-6" data-testid="dashboard-kpi-section">
        {canPayments && revenueRes && !revenueRes.ok ? (
          <ErrorMessage message={revenueRes.message} status={revenueRes.status} />
        ) : (
          <KpiCards
            revenueData={revenueRes?.ok ? revenueRes.data : null}
            growthData={growthRes?.ok ? growthRes.data : null}
          />
        )}
      </div>

      {/* Revenue Chart */}
      {canPayments && (
        <section className="mt-8" data-testid="dashboard-revenue-section">
          <h2 className="mb-4 text-sm font-semibold text-zinc-700">Revenue</h2>
          {revenueRes && !revenueRes.ok ? (
            <ErrorMessage message={revenueRes.message} status={revenueRes.status} />
          ) : revenueRes?.ok ? (
            <RevenueChart buckets={revenueRes.data.buckets} />
          ) : (
            <div className="text-sm text-zinc-500">No data available</div>
          )}
        </section>
      )}

      {/* Content Growth Chart */}
      {canGrowth && (
        <section className="mt-8" data-testid="dashboard-growth-section">
          <h2 className="mb-4 text-sm font-semibold text-zinc-700">
            Content Growth
          </h2>
          {growthRes && !growthRes.ok ? (
            <ErrorMessage message={growthRes.message} status={growthRes.status} />
          ) : growthRes?.ok ? (
            <ContentGrowthChart buckets={growthRes.data.buckets} />
          ) : (
            <div className="text-sm text-zinc-500">No data available</div>
          )}
        </section>
      )}

      {/* Funnel Section */}
      {canPayments && (
        <section className="mt-8" data-testid="dashboard-funnel-section">
          <h2 className="mb-4 text-sm font-semibold text-zinc-700">
            Booking Funnel
          </h2>
          {funnelRes && !funnelRes.ok ? (
            <ErrorMessage message={funnelRes.message} status={funnelRes.status} />
          ) : funnelRes?.ok ? (
            <FunnelSection data={funnelRes.data} />
          ) : (
            <div className="text-sm text-zinc-500">No data available</div>
          )}
        </section>
      )}

      {/* Tops Section */}
      {canPayments && (
        <section className="mt-8" data-testid="dashboard-tops-section">
          <h2 className="mb-4 text-sm font-semibold text-zinc-700">
            Top Performers
          </h2>
          {topsRes && !topsRes.ok ? (
            <ErrorMessage message={topsRes.message} status={topsRes.status} />
          ) : topsRes?.ok ? (
            <TopsSection data={topsRes.data} />
          ) : (
            <div className="text-sm text-zinc-500">No data available</div>
          )}
        </section>
      )}

      {!canPayments && !canGrowth && (
        <div className="mt-6 rounded border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
          <p className="text-sm">
            You don&apos;t have permission to view the dashboard. Contact an administrator.
          </p>
        </div>
      )}
    </div>
  );
}
