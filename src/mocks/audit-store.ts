import type {
  AuditEventDetail,
  AuditEventListItem,
  AuditListQuery,
} from "@/lib/audit/types";
import { buildFixtureAuditEvents } from "./audit-fixtures";

const events = new Map<string, AuditEventDetail>();

function ensureSeed(): void {
  if (events.size > 0) return;
  for (const e of buildFixtureAuditEvents()) {
    events.set(e.id, e);
  }
}

export function resetAuditStore(): void {
  events.clear();
  ensureSeed();
}

export function getAuditEventById(id: string): AuditEventDetail | null {
  ensureSeed();
  return events.get(id) ?? null;
}

function toListItem(e: AuditEventDetail): AuditEventListItem {
  return {
    id: e.id,
    occurred_at: e.occurred_at,
    realm: e.realm,
    action: e.action,
    event_type: e.event_type,
    outcome: e.outcome,
    success: e.success,
    actor_email: e.actor_email,
    entity_type: e.entity_type,
    entity_id: e.entity_id,
    request_path: e.request_path,
    ip_address: e.ip_address,
  };
}

// Offset/limit listing mirroring the backend AuditFilter: actor_email / action
// / entity_type are case-insensitive substring matches; success / realm /
// actor_id are exact; occurred_from / occurred_to bound the timestamp. Rows are
// ordered occurred_at DESC (newest first).
export function listAuditEventsPage(query: AuditListQuery): {
  items: AuditEventListItem[];
  total: number;
} {
  ensureSeed();
  let rows = Array.from(events.values()).sort((a, b) =>
    b.occurred_at.localeCompare(a.occurred_at),
  );

  if (query.actor_id) rows = rows.filter((r) => r.actor_id === query.actor_id);
  if (query.realm) rows = rows.filter((r) => r.realm === query.realm);
  if (query.success !== undefined)
    rows = rows.filter((r) => r.success === query.success);
  if (query.actor_email) {
    const needle = query.actor_email.toLowerCase();
    rows = rows.filter((r) =>
      (r.actor_email ?? "").toLowerCase().includes(needle),
    );
  }
  if (query.action) {
    const needle = query.action.toLowerCase();
    rows = rows.filter((r) => r.action.toLowerCase().includes(needle));
  }
  if (query.entity_type) {
    const needle = query.entity_type.toLowerCase();
    rows = rows.filter((r) =>
      (r.entity_type ?? "").toLowerCase().includes(needle),
    );
  }
  if (query.occurred_from)
    rows = rows.filter((r) => r.occurred_at >= query.occurred_from!);
  if (query.occurred_to)
    rows = rows.filter((r) => r.occurred_at <= query.occurred_to!);

  const total = rows.length;
  const offset = Math.max(0, query.offset ?? 0);
  const limit = Math.max(1, Math.min(200, query.limit ?? 50));
  const items = rows.slice(offset, offset + limit).map(toListItem);
  return { items, total };
}
