// src/lib/search/api.ts
import { listProviders } from "@/lib/providers/api";
import { listServices } from "@/lib/services/api";
import type { GlobalSearchResults } from "./types";

// Per-source cap. The header search is a quick-jump, not a full listing — each
// surface has its own page for exhaustive browsing/pagination.
const PER_SOURCE_LIMIT = 8;

/**
 * Global operator search. Backend exposes no dedicated `/search` endpoint yet
 * (that is Layer-4), so we fan out across the existing `search`-filtered list
 * endpoints in parallel and group the results. Offers are intentionally
 * excluded — that domain has no text-search list endpoint (SLA/queue only).
 *
 * Each group fails independently: one source erroring does not blank the others.
 */
export async function globalSearch(
  rawQuery: string,
): Promise<GlobalSearchResults> {
  const query = rawQuery.trim();
  if (!query) {
    return {
      query: "",
      providers: { items: [], error: null },
      services: { items: [], error: null },
    };
  }

  const [providersRes, servicesRes] = await Promise.all([
    listProviders({ search: query, limit: PER_SOURCE_LIMIT }),
    listServices({ search: query, limit: PER_SOURCE_LIMIT }),
  ]);

  return {
    query,
    providers: providersRes.ok
      ? { items: providersRes.data.items, error: null }
      : { items: [], error: providersRes.message },
    services: servicesRes.ok
      ? { items: servicesRes.data.items, error: null }
      : { items: [], error: servicesRes.message },
  };
}
