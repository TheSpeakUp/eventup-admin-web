// src/lib/search/api.ts
import { apiFetch } from "@/lib/api";
import type { GlobalSearchApiResponse, GlobalSearchResults } from "./types";

const BASE = "/eventup-admin/v1/marketplace/search";

// Per-group cap. The header search is a quick-jump, not a full listing — each
// surface has its own page for exhaustive browsing/pagination.
const PER_GROUP_LIMIT = 8;

const EMPTY: GlobalSearchResults = {
  query: "",
  providers: { items: [], total: 0, error: null },
  services: { items: [], total: 0, error: null },
  offers: { items: [], total: 0, error: null },
};

/**
 * Global operator search via the dedicated Layer-4 backend endpoint — one
 * round-trip returning grouped providers/services/offers hits (replaces the
 * old client-side fan-out across the list endpoints, which could not search
 * offers at all).
 *
 * The single call failing sets the same error on every group so the page keeps
 * its per-group failure rendering.
 */
export async function globalSearch(
  rawQuery: string,
): Promise<GlobalSearchResults> {
  const query = rawQuery.trim();
  if (!query) return EMPTY;

  const params = new URLSearchParams({
    q: query,
    limit: String(PER_GROUP_LIMIT),
  });
  const res = await apiFetch<GlobalSearchApiResponse>(
    `${BASE}?${params.toString()}`,
  );

  if (!res.ok) {
    return {
      query,
      providers: { items: [], total: 0, error: res.message },
      services: { items: [], total: 0, error: res.message },
      offers: { items: [], total: 0, error: res.message },
    };
  }

  return {
    query,
    providers: { ...res.data.providers, error: null },
    services: { ...res.data.services, error: null },
    offers: { ...res.data.offers, error: null },
  };
}
