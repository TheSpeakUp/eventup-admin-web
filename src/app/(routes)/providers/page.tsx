import { listProviders } from "@/lib/providers/api";
import { isProviderStatus, type ProviderStatus } from "@/lib/providers/types";
import Pagination from "./_components/Pagination";
import ProvidersFilters from "./_components/ProvidersFilters";
import ProvidersTable from "./_components/ProvidersTable";

const PAGE_SIZE = 10;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function pickString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function ProvidersPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = pickString(sp.q)?.trim() ?? undefined;
  const statusRaw = pickString(sp.status);
  const status: ProviderStatus | undefined =
    statusRaw && isProviderStatus(statusRaw) ? statusRaw : undefined;
  const pageRaw = Number(pickString(sp.page) ?? "1");
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1;

  const result = await listProviders({ q, status, page, page_size: PAGE_SIZE });

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

  const { items, total, page: pageOut, page_size } = result.data;

  return (
    <div className="p-8 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Providers moderation</h1>
        <span className="text-xs text-zinc-500" data-testid="providers-total">
          {total} provider{total === 1 ? "" : "s"}
        </span>
      </div>
      <ProvidersFilters />
      <ProvidersTable rows={items} />
      <Pagination
        page={pageOut}
        pageSize={page_size}
        total={total}
        basePath="/providers"
        searchParams={{ q, status }}
      />
    </div>
  );
}
