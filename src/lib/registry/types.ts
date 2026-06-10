// Mirrors eventup-backend origin/main
// src/eventup/admin/marketplace/attribute_registry_admin_schemas.py
// (MarketplaceAttributeRegistrySnapshot* + Revalidation* models).
//
// Snapshots are a READ-ONLY audit/rollback log. The list is cursor-paginated
// (next_last_id / has_more, id DESC — newest first), NOT offset/total. There is
// NO GET-by-id endpoint: the detail view reconstructs a row from a capped list
// (see lib/registry/api.ts findRegistrySnapshot).

// Free-form JSON blobs captured before/after a registry mutation.
export type RegistryStateDoc = Record<string, unknown>;

export type RegistrySnapshot = {
  id: number;
  entity_type: string;
  action: string;
  attribute_key: string;
  category_id: number | null;
  attribute_definition_id: number | null;
  binding_id: number | null;
  before_state: RegistryStateDoc | null;
  after_state: RegistryStateDoc | null;
  actor_admin_id: string | null;
  actor_display_name: string | null;
  rollback_source_snapshot_id: number | null;
  created_at: string;
};

export type RegistrySnapshotCursorPage = {
  items: RegistrySnapshot[];
  next_last_id: number | null;
  has_more: boolean;
  count: number;
};

export type RegistrySnapshotListQuery = {
  attribute_key?: string;
  category_id?: number;
  entity_type?: string;
  last_id?: number;
  limit?: number;
};

// POST .../rollback response. `snapshot` is the NEW snapshot the rollback wrote;
// its rollback_source_snapshot_id points at the snapshot that was rolled back.
export type RollbackResponse = {
  success: boolean;
  message_key: string;
  message: string;
  snapshot: RegistrySnapshot;
};

// POST /attribute-revalidation/run body. Omitted id lists = no targeting filter.
export type RevalidationRunPayload = {
  category_ids?: number[];
  service_ids?: number[];
  only_pending: boolean;
  limit: number;
  source: string;
};

export type RevalidationRunResult = {
  processed_count: number;
  valid_count: number;
  invalid_count: number;
  pending_count: number;
};
