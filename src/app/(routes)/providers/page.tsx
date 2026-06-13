import { listProviders } from "@/lib/providers/api";
import Pagination from "./_components/Pagination";
import ProvidersTable from "./_components/ProvidersTable";
import ExportCsvButton from "@/app/_components/ExportCsvButton";
import { Alert, PageHeader, Panel, SearchInput } from "@/app/_components/ui";

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
  const lastId = pickPositiveInt(pickString(sp.last_id));

  const result = await listProviders({
    search,
    last_id: lastId,
    limit: LIMIT,
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-4 py-3">
          <SearchInput
            param="search"
            testid="providers-search"
            placeholder="Search providers…"
          />
        </div>
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
      </Panel>
    </div>
  );
}
