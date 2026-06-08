import type {
  DispatchRunLogItem,
  DlqItem,
  OfferDetailCard,
  OfferStatus,
  ProviderHealthItem,
  QueueStatus,
  ServiceHealthItem,
  SlaSummaryItem,
} from "@/lib/offers/types";

export const CONFLICT_OFFER_ID = 999_000;

const STATUS_CYCLE: OfferStatus[] = ["on_review", "active", "disabled", "rejected", "archived"];
const QUEUE_CYCLE: QueueStatus[] = ["in_sla", "warning", "overdue_response", "closed_without_response"];

function pick<T>(arr: readonly T[], i: number): T {
  return arr[i % arr.length]!;
}

export function makeOfferDetailFixture(i: number): OfferDetailCard {
  const status = pick(STATUS_CYCLE, i);
  const queue = pick(QUEUE_CYCLE, i);
  const created = new Date(Date.UTC(2026, 5, 1 + (i % 7), 8, 0, 0)).toISOString();
  return {
    offer_id: i,
    service_id: 100 + (i % 50),
    service_title: `Service ${100 + (i % 50)}`,
    provider_id: 200 + (i % 30),
    provider_name: `Provider ${200 + (i % 30)}`,
    offer_title: `Offer ${i}`,
    offer_description: `Description for offer ${i}`,
    status,
    queue_status: queue,
    waiting_hours: ((i * 7) % 96),
    created_at: created,
    updated_at: created,
    start_at: created,
    deadline: created,
    is_permanent: i % 4 === 0,
    code: `OFFER${i}`,
    link: `https://example.com/offers/${i}`,
    kind: i % 2 === 0 ? "discount_percent" : "discount_fixed",
    recipient_type: 1,
    percent_value: i % 2 === 0 ? 10 : null,
    fixed_value_minor: i % 2 === 0 ? null : 5000,
    currency: "AED",
  };
}

export function makeSlaSummaryItem(offer: OfferDetailCard): SlaSummaryItem {
  return {
    offer_id: offer.offer_id,
    service_id: offer.service_id,
    service_title: offer.service_title,
    provider_id: offer.provider_id,
    provider_name: offer.provider_name,
    created_at: offer.created_at,
    waiting_hours: offer.waiting_hours,
    queue_status: offer.queue_status,
  };
}

export function makeServiceHealthItem(i: number): ServiceHealthItem {
  return {
    service_id: 100 + i,
    service_title: `Service ${100 + i}`,
    provider_id: 200 + i,
    provider_name: `Provider ${200 + i}`,
    total_on_review: i + 1,
    in_sla: 1,
    warning: 1,
    overdue_response: i,
    closed_without_response: 0,
    overdue_share: i / (i + 2),
    escalation_recommended: i >= 2,
  };
}

export function makeProviderHealthItem(i: number): ProviderHealthItem {
  return {
    provider_id: 200 + i,
    provider_name: `Provider ${200 + i}`,
    services_total: 3,
    total_on_review: i + 1,
    in_sla: 1,
    warning: 1,
    overdue_response: i,
    closed_without_response: 0,
    overdue_share: i / (i + 2),
    escalation_recommended: i >= 2,
  };
}

export function makeDispatchRunLogItem(i: number): DispatchRunLogItem {
  return {
    id: `run_${i}`,
    dispatch_scope: i % 2 === 0 ? "offer_review" : "provider_escalation",
    status: i % 3 === 0 ? "ok" : "partial_failure",
    actor_admin_id: "00000000-0000-0000-0000-000000000001",
    actor_email: "admin@example.com",
    idempotency_key: `idem_${i}`,
    created_at: new Date(Date.UTC(2026, 5, 5, 10, i, 0)).toISOString(),
    finished_at: new Date(Date.UTC(2026, 5, 5, 10, i, 30)).toISOString(),
    counts: { checked: 10, processed: 9, failed: 1 },
  };
}

export function makeDlqItem(i: number): DlqItem {
  return {
    dlq_key: `dlq_${i}`,
    source_run_id: `run_${i}`,
    dispatch_scope: "provider_escalation",
    provider_id: 200 + i,
    channel: i % 2 === 0 ? "email" : "push",
    detail: { error: "delivery_failed" },
    actor_admin_id: null,
    actor_email: null,
    operator_notes: null,
    incident_links: [],
    request_payload: {},
    delivery_outcome: { status: "failed", reason: "smtp_5xx" },
    created_at: new Date(Date.UTC(2026, 5, 6, 11, i, 0)).toISOString(),
  };
}
