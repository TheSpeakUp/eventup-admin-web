// src/app/(routes)/quality/page.tsx
//
// Tabbed quality / ranking surface (M4). Tab selection rides the ?tab=
// searchParam (server component; QualityTabs links flip it). Only the active
// tab's list is fetched per render. A 403 from any list surfaces the
// admin-role panel. Write controls (formula activate/rollback, anomaly review,
// and the service-override controls on the detail route) render only for a
// SUPERADMIN session — defense-in-depth alongside the backend permission gate.
import {
  listAnomalies,
  listFormulaConfigs,
  listProviderMetrics,
  listServiceMetrics,
} from "@/lib/quality/api";
import { isQualityTab, type QualityTab } from "@/lib/quality/types";
import { getAdminSession } from "@/lib/auth/session";
import QualityTabs from "./_components/QualityTabs";
import ExportCsvButton from "@/app/_components/ExportCsvButton";
import PageHeader from "@/app/_components/ui/PageHeader";
import { Panel } from "@/app/_components/ui";
import ServiceMetricsTable from "./_components/ServiceMetricsTable";
import ProviderMetricsTable from "./_components/ProviderMetricsTable";
import FormulaConfigsTable from "./_components/FormulaConfigsTable";
import AnomaliesTable from "./_components/AnomaliesTable";
import AnomaliesFilter from "./_components/AnomaliesFilter";

function ErrorPanel({ message, status }: { message: string; status: number }) {
  return (
    <div
      data-testid="quality-error"
      className="mt-4 rounded border border-red-500/30 bg-red-500/10 p-3 text-red-300"
    >
      {status === 403
        ? "Viewing quality metrics requires an admin role."
        : `Failed to load quality data: ${message}`}
    </div>
  );
}

type Filters = { resolved?: boolean };

async function TabContent({
  tab,
  canManage,
  filters,
}: {
  tab: QualityTab;
  canManage: boolean;
  filters: Filters;
}) {
  if (tab === "services") {
    const res = await listServiceMetrics({ limit: 200 });
    if (!res.ok) return <ErrorPanel message={res.message} status={res.status} />;
    return (
      <div className="mt-4">
        <Panel title="Service metrics" accent="primary" bodyClassName="p-0">
          <ServiceMetricsTable rows={res.data.items} />
        </Panel>
      </div>
    );
  }
  if (tab === "providers") {
    const res = await listProviderMetrics({ limit: 200 });
    if (!res.ok) return <ErrorPanel message={res.message} status={res.status} />;
    return (
      <div className="mt-4">
        <Panel title="Provider metrics" accent="primary" bodyClassName="p-0">
          <ProviderMetricsTable rows={res.data.items} />
        </Panel>
      </div>
    );
  }
  if (tab === "formula-configs") {
    const res = await listFormulaConfigs({ limit: 200 });
    if (!res.ok) return <ErrorPanel message={res.message} status={res.status} />;
    return (
      <div className="mt-4">
        <Panel title="Formula configs" accent="primary" bodyClassName="p-0">
          <FormulaConfigsTable rows={res.data.items} canManage={canManage} />
        </Panel>
      </div>
    );
  }
  // anomalies
  const res = await listAnomalies({ limit: 200, resolved: filters.resolved });
  if (!res.ok) return <ErrorPanel message={res.message} status={res.status} />;
  return (
    <div className="mt-4">
      <Panel title="Anomalies" accent="primary" bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-hairline">
          <AnomaliesFilter resolved={filters.resolved} />
        </div>
        <AnomaliesTable rows={res.data.items} canManage={canManage} />
      </Panel>
    </div>
  );
}

export default async function QualityPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; resolved?: string }>;
}) {
  const sp = await searchParams;
  const tab: QualityTab =
    sp.tab && isQualityTab(sp.tab) ? sp.tab : "services";
  const filters: Filters = {
    resolved:
      sp.resolved === "true"
        ? true
        : sp.resolved === "false"
          ? false
          : undefined,
  };

  const session = await getAdminSession();
  const canManage = session?.role === "SUPERADMIN";

  return (
    <div className="p-8">
      <PageHeader
        title="Quality & ranking"
        actions={
          tab === "services" ? (
            <ExportCsvButton surface="quality-services" />
          ) : null
        }
      />
      <div className="mt-4">
        <QualityTabs active={tab} />
      </div>
      <TabContent tab={tab} canManage={canManage} filters={filters} />
    </div>
  );
}
