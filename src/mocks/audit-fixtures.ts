import type { AuditEventDetail } from "@/lib/audit/types";

// A realistic spread across actions, actors, entity types, outcomes and dates
// so the list / filter / detail surfaces have something to exercise. Event ids
// are deterministic UUID strings (mock backend; not random) so specs can deep
// link by id. Each event carries a metadata payload and most carry a details
// blob so the detail view's JSON rendering is exercised.

type Seed = {
  action: string;
  event_domain: string;
  event_name: string;
  event_type: string;
  outcome: string;
  success: boolean;
  realm: string;
  actor_email: string | null;
  actor_id: string | null;
  entity_type: string | null;
  entity_id: string | null;
  request_method: string | null;
  request_path: string | null;
  ip_address: string | null;
  metadata: Record<string, unknown> | null;
  details: Record<string, unknown> | null;
  error_message?: string | null;
};

const SEEDS: Seed[] = [
  {
    action: "service.approve",
    event_domain: "marketplace",
    event_name: "service_approved",
    event_type: "moderation",
    outcome: "success",
    success: true,
    realm: "admin",
    actor_email: "admin@example.com",
    actor_id: "11111111-1111-4111-8111-111111111111",
    entity_type: "service",
    entity_id: "1042",
    request_method: "POST",
    request_path: "/eventup-admin/v1/marketplace/services/1042/approve",
    ip_address: "203.0.113.10",
    metadata: { previous_status: "on_review", new_status: "published" },
    details: { reviewer_note: "Looks complete, photos verified." },
  },
  {
    action: "provider.block",
    event_domain: "marketplace",
    event_name: "provider_blocked",
    event_type: "moderation",
    outcome: "success",
    success: true,
    realm: "admin",
    actor_email: "mod@example.com",
    actor_id: "22222222-2222-4222-8222-222222222222",
    entity_type: "provider",
    entity_id: "318",
    request_method: "POST",
    request_path: "/eventup-admin/v1/marketplace/providers/318/block",
    ip_address: "203.0.113.22",
    metadata: { reason: "Repeated policy violations", strikes: 3 },
    details: null,
  },
  {
    action: "admin.login",
    event_domain: "auth",
    event_name: "admin_authenticated",
    event_type: "session",
    outcome: "success",
    success: true,
    realm: "admin",
    actor_email: "admin@example.com",
    actor_id: "11111111-1111-4111-8111-111111111111",
    entity_type: "admin",
    entity_id: "11111111-1111-4111-8111-111111111111",
    request_method: "POST",
    request_path: "/eventup-admin/v1/auth/login",
    ip_address: "198.51.100.5",
    metadata: { mfa: false },
    details: null,
  },
  {
    action: "admin.login",
    event_domain: "auth",
    event_name: "admin_authentication_failed",
    event_type: "session",
    outcome: "failure",
    success: false,
    realm: "admin",
    actor_email: "intruder@example.com",
    actor_id: null,
    entity_type: null,
    entity_id: null,
    request_method: "POST",
    request_path: "/eventup-admin/v1/auth/login",
    ip_address: "192.0.2.66",
    metadata: { attempts: 5 },
    details: null,
    error_message: "Invalid credentials",
  },
  {
    action: "category.update",
    event_domain: "marketplace",
    event_name: "category_updated",
    event_type: "catalog",
    outcome: "success",
    success: true,
    realm: "admin",
    actor_email: "admin@example.com",
    actor_id: "11111111-1111-4111-8111-111111111111",
    entity_type: "category",
    entity_id: "7",
    request_method: "PUT",
    request_path: "/eventup-admin/v1/marketplace/categories/7",
    ip_address: "203.0.113.10",
    metadata: {
      changed_fields: ["name", "sort_order"],
      before: { name: "Catering", sort_order: 4 },
      after: { name: "Catering & Bar", sort_order: 2 },
    },
    details: null,
  },
  {
    action: "discount_rule.create",
    event_domain: "marketplace",
    event_name: "discount_rule_created",
    event_type: "promotions",
    outcome: "success",
    success: true,
    realm: "admin",
    actor_email: "ops@example.com",
    actor_id: "33333333-3333-4333-8333-333333333333",
    entity_type: "discount_rule",
    entity_id: "55",
    request_method: "POST",
    request_path: "/eventup-admin/v1/marketplace/promotions/discount-rules",
    ip_address: "203.0.113.40",
    metadata: { product_id: 12, min_units: 5, discount_percent: 15 },
    details: { campaign: "Spring launch" },
  },
  {
    action: "quality.override",
    event_domain: "marketplace",
    event_name: "ranking_override_set",
    event_type: "quality",
    outcome: "success",
    success: true,
    realm: "admin",
    actor_email: "admin@example.com",
    actor_id: "11111111-1111-4111-8111-111111111111",
    entity_type: "service",
    entity_id: "1042",
    request_method: "POST",
    request_path: "/eventup-admin/v1/marketplace/quality/services/1042/override",
    ip_address: "203.0.113.10",
    metadata: { coefficient: 1.25, until: "2026-12-31T00:00:00Z" },
    details: { reason: "Featured for seasonal campaign" },
  },
  {
    action: "provider.delete",
    event_domain: "marketplace",
    event_name: "provider_delete_denied",
    event_type: "moderation",
    outcome: "denied",
    success: false,
    realm: "admin",
    actor_email: "mod@example.com",
    actor_id: "22222222-2222-4222-8222-222222222222",
    entity_type: "provider",
    entity_id: "201",
    request_method: "DELETE",
    request_path: "/eventup-admin/v1/marketplace/providers/201",
    ip_address: "203.0.113.22",
    metadata: { required_role: "ADMIN", actor_role: "MODERATOR" },
    details: null,
    error_message: "Requires ADMIN role",
  },
  {
    action: "service.reject",
    event_domain: "marketplace",
    event_name: "service_rejected",
    event_type: "moderation",
    outcome: "success",
    success: true,
    realm: "admin",
    actor_email: "mod@example.com",
    actor_id: "22222222-2222-4222-8222-222222222222",
    entity_type: "service",
    entity_id: "988",
    request_method: "POST",
    request_path: "/eventup-admin/v1/marketplace/services/988/reject",
    ip_address: "203.0.113.22",
    metadata: { reason: "Incomplete portfolio" },
    details: null,
  },
  {
    action: "admin.invite",
    event_domain: "admin",
    event_name: "admin_invited",
    event_type: "team",
    outcome: "success",
    success: true,
    realm: "admin",
    actor_email: "admin@example.com",
    actor_id: "11111111-1111-4111-8111-111111111111",
    entity_type: "admin_invitation",
    entity_id: "inv-771",
    request_method: "POST",
    request_path: "/eventup-admin/v1/admins/invitations",
    ip_address: "198.51.100.5",
    metadata: { invited_email: "newmod@example.com", role: "MODERATOR" },
    details: null,
  },
  {
    action: "campaign.cancel",
    event_domain: "marketplace",
    event_name: "campaign_canceled",
    event_type: "promotions",
    outcome: "success",
    success: true,
    realm: "admin",
    actor_email: "ops@example.com",
    actor_id: "33333333-3333-4333-8333-333333333333",
    entity_type: "campaign",
    entity_id: "4120",
    request_method: "POST",
    request_path: "/eventup-admin/v1/marketplace/promotions/campaigns/4120/cancel",
    ip_address: "203.0.113.40",
    metadata: { refund_issued: false },
    details: { reason: "Provider request" },
  },
  {
    action: "anomaly.review",
    event_domain: "marketplace",
    event_name: "anomaly_reviewed",
    event_type: "quality",
    outcome: "success",
    success: true,
    realm: "admin",
    actor_email: "admin@example.com",
    actor_id: "11111111-1111-4111-8111-111111111111",
    entity_type: "anomaly",
    entity_id: "9007",
    request_method: "POST",
    request_path: "/eventup-admin/v1/marketplace/quality/anomalies/9007/review",
    ip_address: "203.0.113.10",
    metadata: { severity: "high", resolution: "false_positive" },
    details: null,
  },
];

// A detail-only event id used by the spec to deep-link a row carrying a rich
// metadata payload. Deterministic so the test can navigate straight to it.
export const RICH_EVENT_ID = "aaaaaaaa-0000-4000-8000-000000000099";

function seedId(i: number): string {
  const n = String(i + 1).padStart(2, "0");
  return `aaaaaaaa-0000-4000-8000-0000000000${n}`;
}

export function buildFixtureAuditEvents(): AuditEventDetail[] {
  const out: AuditEventDetail[] = [];

  for (let i = 0; i < SEEDS.length; i++) {
    const s = SEEDS[i] as Seed;
    // Spread occurrences across May 2026, newest last in the seed array.
    const day = String((i % 28) + 1).padStart(2, "0");
    const hour = String((i % 12) + 8).padStart(2, "0");
    const occurred = `2026-05-${day}T${hour}:15:00.000Z`;
    out.push({
      id: seedId(i),
      event_domain: s.event_domain,
      event_name: s.event_name,
      outcome: s.outcome,
      event_type: s.event_type,
      action: s.action,
      realm: s.realm,
      actor_id: s.actor_id,
      actor_email: s.actor_email,
      success: s.success,
      correlation_id: `corr-${String(i + 1).padStart(4, "0")}`,
      entity_type: s.entity_type,
      entity_id: s.entity_id,
      request_path: s.request_path,
      request_method: s.request_method,
      ip_address: s.ip_address,
      user_agent: "Mozilla/5.0 (Macintosh) EventUpAdmin/1.0",
      metadata: s.metadata,
      details: s.details,
      error_message: s.error_message ?? null,
      occurred_at: occurred,
      created_at: occurred,
    });
  }

  // The rich full-reference event (every field populated, nested metadata) so
  // the detail spec can assert the JSON payload renders.
  out.push({
    id: RICH_EVENT_ID,
    event_domain: "marketplace",
    event_name: "service_field_patched",
    outcome: "success",
    event_type: "field_edit",
    action: "service.field.update",
    realm: "admin",
    actor_id: "11111111-1111-4111-8111-111111111111",
    actor_email: "admin@example.com",
    success: true,
    correlation_id: "corr-rich-0001",
    entity_type: "service",
    entity_id: "1042",
    request_path: "/eventup-admin/v1/marketplace/services/1042/fields",
    request_method: "PATCH",
    ip_address: "203.0.113.10",
    user_agent: "Mozilla/5.0 (Macintosh) EventUpAdmin/1.0",
    metadata: {
      changed_fields: ["title", "base_price_minor"],
      before: { title: "DJ set", base_price_minor: 50000 },
      after: { title: "Premium DJ set (4h)", base_price_minor: 65000 },
      nested: { reviewer: { id: 11, name: "Admin" }, tags: ["price", "title"] },
    },
    details: {
      note: "Operator-initiated field correction.",
      approved_by: "admin@example.com",
    },
    error_message: null,
    occurred_at: "2026-05-29T09:15:00.000Z",
    created_at: "2026-05-29T09:15:00.000Z",
  });

  return out;
}
