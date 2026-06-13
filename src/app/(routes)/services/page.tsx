import { listServices } from "@/lib/services/api";
import { isServiceStatus, type ServiceStatus } from "@/lib/services/types";
import Pagination from "./_components/Pagination";
import ServicesFilters from "./_components/ServicesFilters";
import ServicesTable from "./_components/ServicesTable";
import ExportCsvButton from "@/app/_components/ExportCsvButton";
import PageHeader from "@/app/_components/ui/PageHeader";
import { Panel } from "@/app/_components/ui";

const LIMIT = 10;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function pickString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function pickPositiveInt(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

export default async function ServicesPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const search = pickString(sp.search)?.trim() || undefined;
  const statusRaw = pickString(sp.status);
  const status: ServiceStatus | undefined =
    statusRaw && isServiceStatus(statusRaw) ? statusRaw : undefined;
  const lastId = pickPositiveInt(pickString(sp.last_id));
  const providerId = pickPositiveInt(pickString(sp.provider_id));

  const result = await listServices({
    search,
    status,
    last_id: lastId,
    provider_id: providerId,
    limit: LIMIT,
  });

  if (!result.ok) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Services moderation
        </h1>
        <div
          data-testid="services-error"
          className="mt-6 rounded-md border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
        >
          Failed to load services: {result.message}
        </div>
      </div>
    );
  }

  const { items, has_more, next_last_id, count } = result.data;

  return (
    <div className="p-8 space-y-5">
      <PageHeader title="Services moderation" />
      <Panel
        title="All services"
        accent="primary"
        bodyClassName="p-0"
        action={
          <div className="flex items-center gap-3">
            <ExportCsvButton
              surface="services"
              params={{
                search,
                status,
                provider_id: providerId !== undefined ? String(providerId) : undefined,
              }}
            />
            <span className="text-xs text-zinc-500" data-testid="services-count">
              {count} service{count === 1 ? "" : "s"} on this page
            </span>
          </div>
        }
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-hairline">
          <ServicesFilters />
        </div>
        <ServicesTable rows={items} />
        <div className="px-4 py-3 border-t border-hairline">
          <Pagination
            nextLastId={next_last_id}
            hasMore={has_more}
            count={count}
            basePath="/services"
            searchParams={{
              search,
              status,
              provider_id: providerId !== undefined ? String(providerId) : undefined,
            }}
            lastId={lastId}
          />
        </div>
      </Panel>
    </div>
  );
}
