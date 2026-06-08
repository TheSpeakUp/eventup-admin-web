import { listProviders } from "@/lib/providers/api";
import Pagination from "./_components/Pagination";
import ProvidersFilters from "./_components/ProvidersFilters";
import ProvidersTable from "./_components/ProvidersTable";

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
        <div
          data-testid="providers-error"
          className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          Failed to load providers: {result.message}
        </div>
      </div>
    );
  }

  const { items, has_more, next_last_id, count } = result.data;

  return (
    <div className="p-8 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Providers moderation</h1>
        <span className="text-xs text-zinc-500" data-testid="providers-count">
          {count} provider{count === 1 ? "" : "s"} on this page
        </span>
      </div>
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
