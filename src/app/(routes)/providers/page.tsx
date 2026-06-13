import { listProviders } from "@/lib/providers/api";
import Pagination from "./_components/Pagination";
import ProvidersFilters from "./_components/ProvidersFilters";
import ProvidersTable from "./_components/ProvidersTable";
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

export default async function ProvidersPage({ searchParams }: { searchParams: SearchParams }) {
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
      <div className="p-8">
        <h1 className="text-2xl font-semibold">Providers moderation</h1>
        <div data-testid="providers-error" className="mt-6">
          <Alert tone="danger">
            Failed to load providers: {result.message}
          </Alert>
        </div>
      </div>
    );
  }

  const { items, has_more, next_last_id, count } = result.data;

  return (
    <div className="p-8 space-y-5">
      <PageHeader
        title="Providers moderation"
        actions={
          <>
            <ExportCsvButton surface="providers" params={{ search }} />
            <span
              className="text-xs text-ink-subtle"
              data-testid="providers-count"
            >
              {count} provider{count === 1 ? "" : "s"} on this page
            </span>
          </>
        }
      />
      <ProvidersFilters />
      <ProvidersTable rows={items} />
      <Pagination
        nextLastId={next_last_id}
        hasMore={has_more}
        count={count}
        basePath="/providers"
        searchParams={{ search }}
        lastId={lastId}
      />
    </div>
  );
}
