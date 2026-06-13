import { listServices } from "@/lib/services/api";
import { isServiceStatus, type ServiceStatus } from "@/lib/services/types";
import Pagination from "./_components/Pagination";
import ServicesFilters from "./_components/ServicesFilters";
import ServicesTable from "./_components/ServicesTable";
import ExportCsvButton from "@/app/_components/ExportCsvButton";
import PageHeader from "@/app/_components/ui/PageHeader";
import Alert from "@/app/_components/ui/Alert";

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
      <div className="p-8 space-y-6">
        <PageHeader title="Services moderation" />
        <div data-testid="services-error">
          <Alert tone="danger">Failed to load services: {result.message}</Alert>
        </div>
      </div>
    );
  }

  const { items, has_more, next_last_id, count } = result.data;

  return (
    <div className="p-8 space-y-5">
      <PageHeader
        title="Services moderation"
        meta={
          <span data-testid="services-count">
            {count} service{count === 1 ? "" : "s"} on this page
          </span>
        }
        actions={
          <ExportCsvButton
            surface="services"
            params={{
              search,
              status,
              provider_id: providerId !== undefined ? String(providerId) : undefined,
            }}
          />
        }
      />
      <ServicesFilters />
      <ServicesTable rows={items} />
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
  );
}
