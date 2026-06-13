import type {
  RegistrySnapshot,
  RegistrySnapshotCursorPage,
  RegistrySnapshotListQuery,
  RevalidationRunPayload,
  RevalidationRunResult,
  RollbackResponse,
} from "@/lib/registry/types";
import { buildFixtureRegistrySnapshots } from "./registry-fixtures";
import { globalSingleton } from "./global-store";

const snapshots = globalSingleton(
  "__eventupRegistrySnapshots",
  () => new Map<number, RegistrySnapshot>(),
);
let nextId = 0;

function ensureSeed(): void {
  if (snapshots.size > 0) return;
  for (const s of buildFixtureRegistrySnapshots()) snapshots.set(s.id, s);
  nextId = Math.max(...snapshots.keys()) + 1;
}

// Convention parity with the other stores (not wired to any endpoint today).
export function resetRegistrySnapshotsStore(): void {
  snapshots.clear();
  nextId = 0;
  ensureSeed();
}

// Cursor list: rows ordered id DESC (newest first). `last_id` excludes ids >=
// last_id (loads the next OLDER page). next_last_id = smallest id on the page;
// has_more = older rows remain below it.
export function listRegistrySnapshotsPage(
  query: RegistrySnapshotListQuery,
): RegistrySnapshotCursorPage {
  ensureSeed();
  let rows = Array.from(snapshots.values()).sort((a, b) => b.id - a.id);

  if (query.attribute_key) {
    const needle = query.attribute_key.toLowerCase();
    rows = rows.filter((r) => r.attribute_key.toLowerCase().includes(needle));
  }
  if (query.category_id !== undefined)
    rows = rows.filter((r) => r.category_id === query.category_id);
  if (query.entity_type) {
    const needle = query.entity_type.toLowerCase();
    rows = rows.filter((r) => r.entity_type.toLowerCase().includes(needle));
  }
  if (query.last_id !== undefined)
    rows = rows.filter((r) => r.id < query.last_id!);

  const limit = Math.max(1, Math.min(100, query.limit ?? 50));
  const page = rows.slice(0, limit);
  const hasMore = rows.length > limit;
  const nextLastId = page.length > 0 ? page[page.length - 1].id : null;
  return {
    items: page,
    next_last_id: hasMore ? nextLastId : null,
    has_more: hasMore,
    count: page.length,
  };
}

// Rollback APPENDS a new snapshot (action "rollback") whose
// rollback_source_snapshot_id points at the source. Mirrors backend semantics so
// the list grows and e2e can assert the new row. Returns null if id is unknown.
export function rollbackRegistrySnapshotRecord(
  id: number,
  actor: { admin_id: string | null; display_name: string | null },
): RollbackResponse | null {
  ensureSeed();
  const source = snapshots.get(id);
  if (!source) return null;
  const created: RegistrySnapshot = {
    id: nextId++,
    entity_type: source.entity_type,
    action: "rollback",
    attribute_key: source.attribute_key,
    category_id: source.category_id,
    attribute_definition_id: source.attribute_definition_id,
    binding_id: source.binding_id,
    // The rollback reverses the source mutation: new before = source.after,
    // new after = source.before.
    before_state: source.after_state,
    after_state: source.before_state,
    actor_admin_id: actor.admin_id,
    actor_display_name: actor.display_name,
    rollback_source_snapshot_id: source.id,
    created_at: "2026-06-10T12:00:00",
  };
  snapshots.set(created.id, created);
  return {
    success: true,
    message_key: "core.success.updated",
    message: "Registry snapshot rolled back successfully",
    snapshot: created,
  };
}

// Deterministic counts derived from the payload so e2e is stable. `only_pending`
// halves the processed set; an explicit category/service target shrinks it
// further. Pure function of the payload — no store mutation.
export function runRevalidationRecord(
  payload: RevalidationRunPayload,
): RevalidationRunResult {
  const targeted =
    (payload.category_ids?.length ?? 0) + (payload.service_ids?.length ?? 0);
  const base = targeted > 0 ? targeted * 3 : payload.only_pending ? 12 : 24;
  const processed = Math.min(base, payload.limit);
  const invalid = Math.floor(processed / 6);
  const valid = processed - invalid;
  const pending = payload.only_pending ? 0 : Math.floor(processed / 4);
  return {
    processed_count: processed,
    valid_count: valid,
    invalid_count: invalid,
    pending_count: pending,
  };
}
