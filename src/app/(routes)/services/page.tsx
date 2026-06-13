import { listServices } from "@/lib/services/api";
import {
  SERVICE_STATUSES,
  isServiceStatus,
  type ServiceStatus,
} from "@/lib/services/types";
import Pagination from "./_components/Pagination";
import ServicesTable from "./_components/ServicesTable";
import ServicesGrid from "./_components/ServicesGrid";
import { loadMoreServices } from "./load-more-action";
import { SERVICES_GRID_LIMIT } from "./grid-config";
import ExportCsvButton from "@/app/_components/ExportCsvButton";
import {
  Alert,
  PageHeader,
  Panel,
  SearchInput,
  StatusSegments,
  ViewToggle,
  parseView,
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
  const view = parseView(sp.view);
  // The grid accumulates client-side from page one, so it ignores any URL
  // cursor; the table is URL-cursor paginated.
  const lastId = view === "grid" ? undefined : pickPositiveInt(pickString(sp.last_id));
  const providerId = pickPositiveInt(pickString(sp.provider_id));

  const result = await listServices({
    search,
    status,
    last_id: lastId,
    provider_id: providerId,
    limit: view === "grid" ? SERVICES_GRID_LIMIT : LIMIT,
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
  // Status segments + search must keep the active view; the view toggle must
  // keep the active status + filters.
  const filterParams = {
    ...otherParams,
    view: view === "grid" ? "grid" : undefined,
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
            searchParams={filterParams}
            testidPrefix="services-status"
          />
          <div className="flex items-center gap-2">
            <SearchInput
              param="search"
              testid="services-search"
              placeholder="Search services…"
            />
            <ViewToggle
              current={view}
              basePath="/services"
              searchParams={{ status, ...otherParams }}
              testidPrefix="services-view"
            />
          </div>
        </div>
        {view === "grid" ? (
          // Re-key on the filter signature so a soft-nav filter change (search /
          // segment) remounts the grid and reseeds the accumulator instead of
          // appending onto a stale first page.
          <ServicesGrid
            key={`${search ?? ""}|${status ?? ""}|${providerId ?? ""}`}
            initial={{
              items,
              nextCursor:
                next_last_id != null ? String(next_last_id) : null,
              hasMore: has_more,
            }}
            loadAction={loadMoreServices.bind(null, {
              search,
              status,
              providerId,
            })}
          />
        ) : (
          <>
            <ServicesTable rows={items} />
            <div className="px-4 py-3 border-t border-hairline">
              <Pagination
                nextLastId={next_last_id}
                hasMore={has_more}
                count={count}
                basePath="/services"
                searchParams={{ status, ...filterParams }}
                lastId={lastId}
              />
            </div>
          </>
        )}
      </Panel>
    </div>
  );
}
