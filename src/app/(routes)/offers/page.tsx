import { getSlaSummary } from "@/lib/offers/api";
import { isQueueStatus, type QueueStatus, type SlaSummaryQuery } from "@/lib/offers/types";
import CountersCard from "./_components/CountersCard";
import OffersFilters from "./_components/OffersFilters";
import OffersTable from "./_components/OffersTable";
import Link from "next/link";

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
      <main className="space-y-3 p-6">
        <h1 className="text-xl font-semibold">Offers — SLA queue</h1>
        <p data-testid="offers-error" className="text-sm text-red-700">
          Failed to load: {result.message}
        </p>
      </main>
    );
  }
  const sorted = [...result.data.items].sort((a, b) => b.waiting_hours - a.waiting_hours);
  return (
    <main className="space-y-4 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Offers — SLA queue</h1>
        <Link href="/offers/ops" data-testid="offers-ops-link" className="text-sm underline">
          SLA ops →
        </Link>
      </header>
      <CountersCard counters={result.data.counters} />
      <OffersFilters />
      <OffersTable items={sorted} />
    </main>
  );
}
