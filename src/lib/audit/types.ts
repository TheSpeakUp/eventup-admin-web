// Mirrors src/eventup/admin/audit/audit_read_schemas.py.
//
// Read-only view over `unified_audit_events`. The list endpoint is offset/limit
// paginated and returns a `total` alongside the page `items` (same envelope as
// payments — NOT a cursor). Event ids are UUID strings, not integers.
//
// The detail carries a free-form `metadata` JSON column (mapped on the ORM as
// `audit_metadata` but serialized back out under the JSON key `metadata`) and a
// separate `details` JSON blob — both are rendered readably at the edge, never
// pre-stringified into the type.

// Outcomes the backend surfaces. The read path does not constrain `outcome` to
// an enum, so callers must tolerate an unknown string — OUTCOME_STYLES falls
// back to a neutral badge for anything unlisted.
export const AUDIT_OUTCOMES = [
  "success",
  "failure",
  "denied",
  "error",
] as const;

export type AuditOutcome = (typeof AUDIT_OUTCOMES)[number];

export type AuditEventListItem = {
  id: string;
  occurred_at: string;
  realm: string;
  action: string;
  event_type: string;
  outcome: string;
  success: boolean;
  actor_email: string | null;
  entity_type: string | null;
  entity_id: string | null;
  request_path: string | null;
  ip_address: string | null;
};

export type AuditEventDetail = {
  id: string;
  event_domain: string;
  event_name: string;
  outcome: string;
  event_type: string;
  action: string;
  realm: string;
  actor_id: string | null;
  actor_email: string | null;
  success: boolean;
  correlation_id: string | null;
  entity_type: string | null;
  entity_id: string | null;
  request_path: string | null;
  request_method: string | null;
  ip_address: string | null;
  user_agent: string | null;
  // The ORM column `metadata` (Python attr `audit_metadata`) serialized under
  // the JSON key `metadata`. Free-form — rendered as pretty JSON.
  metadata: Record<string, unknown> | null;
  details: Record<string, unknown> | null;
  error_message: string | null;
  occurred_at: string;
  created_at: string;
};

export type AuditListResponse = {
  items: AuditEventListItem[];
  total: number;
};

export type AuditListQuery = {
  actor_id?: string;
  actor_email?: string;
  action?: string;
  entity_type?: string;
  success?: boolean;
  realm?: string;
  occurred_from?: string;
  occurred_to?: string;
  limit?: number;
  offset?: number;
};
