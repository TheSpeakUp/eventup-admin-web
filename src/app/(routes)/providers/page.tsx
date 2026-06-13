import { listProviders } from "@/lib/providers/api";
import Pagination from "./_components/Pagination";
import ProvidersTable from "./_components/ProvidersTable";
import ProvidersGrid from "./_components/ProvidersGrid";
import { loadMoreProviders } from "./load-more-action";
import { PROVIDERS_GRID_LIMIT } from "./grid-config";
import ExportCsvButton from "@/app/_components/ExportCsvButton";
import {
  Alert,
  PageHeader,
  Panel,
  SearchInput,
  ViewToggle,
  parseView,
} from "@/app/_components/ui";

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

export default async function ProvidersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const search = pickString(sp.search)?.trim() || undefined;
  const view = parseView(sp.view);
  // The grid accumulates client-side from page one, so it ignores any URL
  // cursor; the table is URL-cursor paginated.
  const lastId =
    view === "grid" ? undefined : pickPositiveInt(pickString(sp.last_id));

  const result = await listProviders({
    search,
    last_id: lastId,
    limit: view === "grid" ? PROVIDERS_GRID_LIMIT : LIMIT,
  });

  if (!result.ok) {
    return (
      <div className="p-8 space-y-5">
        <PageHeader
          title="Providers moderation"
          description="Moderate provider profiles and verification status."
        />
        <Alert variant="danger" data-testid="providers-error">
          Failed to load providers: {result.message}
        </Alert>
      </div>
    );
  }

  const { items, has_more, next_last_id, count } = result.data;

  return (
    <div className="p-8 space-y-5">
      <PageHeader
        title="Providers moderation"
        description="Moderate provider profiles and verification status."
        actions={<ExportCsvButton surface="providers" params={{ search }} />}
      />
      <Panel
        title="All providers"
        accent="primary"
        bodyClassName="p-0"
        action={
          <span
            className="text-xs text-ink-subtle"
            data-testid="providers-count"
          >
            {count} provider{count === 1 ? "" : "s"} on this page
          </span>
        }
      >
        <div className="flex flex-wrap items-center justify-end gap-3 border-b border-hairline px-4 py-3">
          <div className="flex items-center gap-2">
            <SearchInput
              param="search"
              testid="providers-search"
              placeholder="Search providers…"
            />
            <ViewToggle
              current={view}
              basePath="/providers"
              searchParams={{ search }}
              testidPrefix="providers-view"
            />
          </div>
        </div>
        {view === "grid" ? (
          <ProvidersGrid
            initial={{
              items,
              nextCursor: next_last_id != null ? String(next_last_id) : null,
              hasMore: has_more,
            }}
            loadAction={loadMoreProviders.bind(null, { search })}
          />
        ) : (
          <>
            <ProvidersTable rows={items} />
            <div className="px-4 py-3 border-t border-hairline">
              <Pagination
                nextLastId={next_last_id}
                hasMore={has_more}
                count={count}
                basePath="/providers"
                searchParams={{ search }}
                lastId={lastId}
              />
            </div>
          </>
        )}
      </Panel>
    </div>
  );
}
