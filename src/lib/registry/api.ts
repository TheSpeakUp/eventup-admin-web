import { apiFetch, type ApiFetchResult } from "@/lib/api";
import type {
  RegistrySnapshot,
  RegistrySnapshotCursorPage,
  RegistrySnapshotListQuery,
  RevalidationRunPayload,
  RevalidationRunResult,
  RollbackResponse,
} from "./types";

const BASE = "/eventup-admin/v1/marketplace";

// Snapshot list is a GET with querystring filters (NOT a POST body filter —
// unlike attribute-definitions). Build the query like lib/audit/api.ts.
function buildListPath(query: RegistrySnapshotListQuery): string {
  const params = new URLSearchParams();
  if (query.attribute_key) params.set("attribute_key", query.attribute_key);
  if (query.category_id !== undefined)
    params.set("category_id", String(query.category_id));
  if (query.entity_type) params.set("entity_type", query.entity_type);
  if (query.last_id !== undefined) params.set("last_id", String(query.last_id));
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  const qs = params.toString();
  const path = `${BASE}/attribute-registry/snapshots`;
  return qs ? `${path}?${qs}` : path;
}

export function listRegistrySnapshots(
  query: RegistrySnapshotListQuery = {},
): Promise<ApiFetchResult<RegistrySnapshotCursorPage>> {
  return apiFetch<RegistrySnapshotCursorPage>(buildListPath(query));
}

// There is NO GET /snapshots/{id}. The detail page reconstructs the row by
// listing (newest-first, capped at 100) and matching the id. Returns null if
// the id is absent from that window — the page then renders notFound().
export async function findRegistrySnapshot(
  id: number,
): Promise<
  | { ok: true; snapshot: RegistrySnapshot | null }
  | { ok: false; status: number; message: string }
> {
  const res = await listRegistrySnapshots({ limit: 100 });
  if (!res.ok) return { ok: false, status: res.status, message: res.message };
  const snapshot = res.data.items.find((s) => s.id === id) ?? null;
  return { ok: true, snapshot };
}

export function rollbackRegistrySnapshot(
  id: number,
): Promise<ApiFetchResult<RollbackResponse>> {
  return apiFetch<RollbackResponse>(
    `${BASE}/attribute-registry/snapshots/${id}/rollback`,
    { method: "POST", redirectOn401: false },
  );
}

export function runRevalidation(
  payload: RevalidationRunPayload,
): Promise<ApiFetchResult<RevalidationRunResult>> {
  return apiFetch<RevalidationRunResult>(
    `${BASE}/attribute-revalidation/run`,
    { method: "POST", body: JSON.stringify(payload), redirectOn401: false },
  );
}
