import { getSlaSummary } from "@/lib/offers/api";
import { isQueueStatus, type QueueStatus, type SlaSummaryQuery } from "@/lib/offers/types";
import CountersCard from "./_components/CountersCard";
import OffersFilters from "./_components/OffersFilters";
import OffersTable from "./_components/OffersTable";
import ExportCsvButton from "@/app/_components/ExportCsvButton";
import Link from "next/link";
import PageHeader from "@/app/_components/ui/PageHeader";
import Alert from "@/app/_components/ui/Alert";

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
  const query = parseQuery(sp);
  const result = await getSlaSummary(query);
  if (!result.ok) {
    return (
      <main className="space-y-4 p-8">
        <PageHeader title="Offers — SLA queue" />
        <div data-testid="offers-error">
          <Alert tone="danger">Failed to load: {result.message}</Alert>
        </div>
      </main>
    );
  }
  const sorted = [...result.data.items].sort((a, b) => b.waiting_hours - a.waiting_hours);
  return (
    <main className="space-y-4 p-8">
      <PageHeader
        title="Offers — SLA queue"
        actions={
          <>
            <ExportCsvButton
              surface="offers-queue"
              params={{
                service_id:
                  query.service_id !== undefined ? String(query.service_id) : undefined,
                provider_id:
                  query.provider_id !== undefined ? String(query.provider_id) : undefined,
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
      <OffersFilters />
      <OffersTable items={sorted} />
    </main>
  );
}
