import { listServices } from "@/lib/services/api";
import {
  SERVICE_STATUSES,
  isServiceStatus,
  type ServiceStatus,
} from "@/lib/services/types";
import Pagination from "./_components/Pagination";
import ServicesTable from "./_components/ServicesTable";
import ExportCsvButton from "@/app/_components/ExportCsvButton";
import {
  Alert,
  PageHeader,
  Panel,
  SearchInput,
  StatusSegments,
  type SegmentOption,
} from "@/app/_components/ui";

const LIMIT = 10;

const STATUS_OPTIONS: SegmentOption[] = SERVICE_STATUSES.map((s) => ({
  value: s,
  label: s.replace(/_/g, " "),
}));

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

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
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
      <div className="p-8 space-y-5">
        <PageHeader
          title="Services moderation"
          description="Review, publish and verify marketplace service listings."
        />
        <Alert variant="danger" data-testid="services-error">
          Failed to load services: {result.message}
        </Alert>
      </div>
    );
  }

  const { items, has_more, next_last_id, count } = result.data;
  const otherParams = {
    search,
    provider_id: providerId !== undefined ? String(providerId) : undefined,
  };

  return (
    <div className="p-8 space-y-5">
      <PageHeader
        title="Services moderation"
        description="Review, publish and verify marketplace service listings."
        actions={
          <ExportCsvButton
            surface="services"
            params={{ status, ...otherParams }}
          />
        }
      />
      <Panel
        title="All services"
        accent="primary"
        bodyClassName="p-0"
        action={
          <span className="text-xs text-ink-subtle" data-testid="services-count">
            {count} service{count === 1 ? "" : "s"} on this page
          </span>
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-4 py-3">
          <StatusSegments
            options={STATUS_OPTIONS}
            current={status}
            basePath="/services"
            searchParams={otherParams}
            testidPrefix="services-status"
          />
          <SearchInput
            param="search"
            testid="services-search"
            placeholder="Search services…"
          />
        </div>
        <ServicesTable rows={items} />
        <div className="px-4 py-3 border-t border-hairline">
          <Pagination
            nextLastId={next_last_id}
            hasMore={has_more}
            count={count}
            basePath="/services"
            searchParams={{ status, ...otherParams }}
            lastId={lastId}
          />
        </div>
      </Panel>
    </div>
  );
}
