import { getSlaSummary } from "@/lib/offers/api";
import { isQueueStatus, type QueueStatus, type SlaSummaryQuery } from "@/lib/offers/types";
import CountersCard from "./_components/CountersCard";
import OffersFilters from "./_components/OffersFilters";
import OffersTable from "./_components/OffersTable";
import OffersGrid from "./_components/OffersGrid";
import ExportCsvButton from "@/app/_components/ExportCsvButton";
import { Alert, PageHeader, Panel, ViewToggle, parseView } from "@/app/_components/ui";
import Link from "next/link";

const DESCRIPTION = "Provider review-response SLA queue and escalations.";

const DEFAULT_QUEUE: QueueStatus[] = ["overdue_response", "warning"];
const LIMIT = 200;

type SearchParams = Record<string, string | string[] | undefined>;

function parseQuery(sp: SearchParams): SlaSummaryQuery {
  const raw = sp.queue_status;
  const arr = Array.isArray(raw) ? raw : raw != null ? [raw] : [];
  const queue = arr.filter((v): v is string => typeof v === "string").filter(isQueueStatus) as QueueStatus[];
  const out: SlaSummaryQuery = {
    queue_status: queue.length > 0 ? queue : DEFAULT_QUEUE,
    limit: LIMIT,
  };
  const serviceId = Number(sp.service_id);
  if (Number.isFinite(serviceId) && serviceId > 0) out.service_id = serviceId;
  const providerId = Number(sp.provider_id);
  if (Number.isFinite(providerId) && providerId > 0) out.provider_id = providerId;
  const minHours = Number(sp.min_waiting_hours);
  if (Number.isFinite(minHours) && minHours >= 0) out.min_waiting_hours = minHours;
  return out;
}

export default async function OffersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const view = parseView(sp.view);
  const query = parseQuery(sp);
  const result = await getSlaSummary(query);
  if (!result.ok) {
    return (
      <main className="space-y-5 p-6">
        <PageHeader title="Offers — SLA queue" description={DESCRIPTION} />
        <Alert variant="danger" data-testid="offers-error">
          Failed to load: {result.message}
        </Alert>
      </main>
    );
  }
  const sorted = [...result.data.items].sort((a, b) => b.waiting_hours - a.waiting_hours);
  return (
    <main className="space-y-5 p-6">
      <PageHeader
        title="Offers — SLA queue"
        description={DESCRIPTION}
        actions={
          <>
            <ExportCsvButton
              surface="offers-queue"
              params={{
                service_id:
                  query.service_id !== undefined
                    ? String(query.service_id)
                    : undefined,
                provider_id:
                  query.provider_id !== undefined
                    ? String(query.provider_id)
                    : undefined,
              }}
            />
            <Link
              href="/offers/ops"
              data-testid="offers-ops-link"
              className="text-sm text-ink-subtle underline hover:text-ink"
            >
              SLA ops →
            </Link>
          </>
        }
      />
      <CountersCard counters={result.data.counters} />
      <Panel title="SLA queue" accent="primary" bodyClassName="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-hairline">
          <OffersFilters />
          <ViewToggle
            current={view}
            basePath="/offers"
            searchParams={{
              service_id:
                query.service_id !== undefined
                  ? String(query.service_id)
                  : undefined,
              provider_id:
                query.provider_id !== undefined
                  ? String(query.provider_id)
                  : undefined,
              min_waiting_hours:
                query.min_waiting_hours !== undefined
                  ? String(query.min_waiting_hours)
                  : undefined,
            }}
            multiParams={(query.queue_status ?? []).map((q) => [
              "queue_status",
              q,
            ])}
            testidPrefix="offers-view"
          />
        </div>
        {view === "grid" ? (
          <OffersGrid items={sorted} />
        ) : (
          <OffersTable items={sorted} />
        )}
      </Panel>
    </main>
  );
}
