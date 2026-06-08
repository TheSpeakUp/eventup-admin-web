# F7 — Offer Moderation UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/offers`, `/offers/[id]`, `/offers/ops` routes in admin-marketplace.speakup.ltd that drive the backend SLA queue and the 5 offer moderation actions (approve / reject / archive / disable / enable) + 3 SLA ops actions (force offer dispatch / force provider dispatch / DLQ replay).

**Architecture:** Mirror F5 (providers) and F6 (services) patterns: a `lib/offers/` module (api + types) calling the new namespace `/eventup-admin/v1/marketplace/offers/*`, a `lib/moderation/transitions.ts` extension for the offer matrix, three Next.js App Router pages under `(routes)/offers/`, Next server actions for writes, and Playwright e2e tests against MSW mocks.

**Tech Stack:** Next.js 15 App Router (RSC + server actions), TypeScript, MSW (handlers + fixtures), Playwright (single test runner — no unit framework in this repo), Zod (server-action validation).

**Reference spec:** [`docs/superpowers/specs/2026-06-08-f7-offer-moderation-design.md`](../specs/2026-06-08-f7-offer-moderation-design.md).

---

## Task 1: Offer types + status enum

**Files:**
- Create: `src/lib/offers/types.ts`

- [ ] **Step 1: Write file**

```ts
export const OFFER_STATUSES = [
  "on_review",
  "active",
  "disabled",
  "rejected",
  "archived",
] as const;

export type OfferStatus = (typeof OFFER_STATUSES)[number];

export function isOfferStatus(value: string): value is OfferStatus {
  return (OFFER_STATUSES as readonly string[]).includes(value);
}

export const QUEUE_STATUSES = [
  "in_sla",
  "warning",
  "overdue_response",
  "closed_without_response",
] as const;

export type QueueStatus = (typeof QUEUE_STATUSES)[number];

export function isQueueStatus(value: string): value is QueueStatus {
  return (QUEUE_STATUSES as readonly string[]).includes(value);
}

export type OfferModerationResponse = {
  offer_id: number;
  new_status: string;
  message_key: string | null;
  message: string;
};

export type SlaSummaryItem = {
  offer_id: number;
  service_id: number;
  service_title: string | null;
  provider_id: number | null;
  provider_name: string | null;
  created_at: string;
  waiting_hours: number;
  queue_status: QueueStatus;
};

export type SlaCounters = {
  total_on_review: number;
  in_sla: number;
  warning: number;
  overdue_response: number;
  closed_without_response_candidates: number;
};

export type SlaSummary = {
  generated_at: string;
  counters: SlaCounters;
  items: SlaSummaryItem[];
};

export type SlaSummaryQuery = {
  service_id?: number;
  service_ids?: number[];
  provider_id?: number;
  queue_status?: QueueStatus[];
  min_waiting_hours?: number;
  max_waiting_hours?: number;
  only_degraded_services?: boolean;
  min_overdue_share?: number;
  limit?: number;
};

export type OfferDetailCard = {
  offer_id: number;
  service_id: number;
  service_title: string | null;
  provider_id: number | null;
  provider_name: string | null;
  offer_title: string | null;
  offer_description: string | null;
  status: OfferStatus;
  queue_status: QueueStatus;
  waiting_hours: number;
  created_at: string;
  updated_at: string | null;
  start_at: string | null;
  deadline: string | null;
  is_permanent: boolean;
  code: string | null;
  link: string | null;
  kind: string | null;
  recipient_type: number | null;
  percent_value: number | null;
  fixed_value_minor: number | null;
  currency: string | null;
};

export type ServiceHealthItem = {
  service_id: number;
  service_title: string | null;
  provider_id: number | null;
  provider_name: string | null;
  total_on_review: number;
  in_sla: number;
  warning: number;
  overdue_response: number;
  closed_without_response: number;
  overdue_share: number;
  escalation_recommended: boolean;
};

export type ServiceHealthResponse = {
  generated_at: string;
  items: ServiceHealthItem[];
};

export type ProviderHealthItem = {
  provider_id: number;
  provider_name: string | null;
  services_total: number;
  total_on_review: number;
  in_sla: number;
  warning: number;
  overdue_response: number;
  closed_without_response: number;
  overdue_share: number;
  escalation_recommended: boolean;
};

export type ProviderHealthResponse = {
  generated_at: string;
  items: ProviderHealthItem[];
};

export type DispatchRunLogItem = {
  id: string;
  dispatch_scope: string;
  status: string;
  actor_admin_id: string | null;
  actor_email: string | null;
  idempotency_key: string | null;
  created_at: string;
  finished_at: string | null;
  counts: Record<string, number>;
};

export type DispatchRunLogResponse = {
  items: DispatchRunLogItem[];
  total: number;
};

export type DispatchRunsQuery = {
  dispatch_scope?: string;
  status?: string;
  actor_admin_id?: string;
  idempotency_key?: string;
  limit?: number;
  offset?: number;
};

export type DlqItem = {
  dlq_key: string;
  source_run_id: string;
  dispatch_scope: string;
  provider_id: number;
  channel: string;
  detail: unknown;
  actor_admin_id: string | null;
  actor_email: string | null;
  operator_notes: string | null;
  incident_links: string[];
  request_payload: unknown;
  delivery_outcome: Record<string, unknown>;
  created_at: string;
};

export type DlqResponse = {
  items: DlqItem[];
  total: number;
};

export type DlqQuery = {
  source_run_id?: string;
  channel?: string;
  provider_id?: number;
  exclude_replayed_successes?: boolean;
  limit?: number;
  offset?: number;
};

export type OfferDispatchResponse = {
  generated_at: string;
  auto_close_enabled: boolean;
  checked_offers: number;
  reminders_sent: number;
  auto_closed: number;
  reminder_offer_ids: number[];
  auto_closed_offer_ids: number[];
  escalations_sent: number;
  escalated_service_ids: number[];
};

export type ProviderDispatchResponse = {
  generated_at: string;
  checked_providers: number;
  escalations_sent: number;
  escalated_provider_ids: number[];
  channels: string[];
  delivery_outcomes: Array<Record<string, unknown>>;
};

export type DlqReplayMode = "dry_run" | "apply";

export type DlqReplayRequest = {
  mode: DlqReplayMode;
  source_run_id?: string;
  channel?: string;
  provider_id?: number;
};

export type DlqReplayResponse = {
  mode: DlqReplayMode;
  total_candidates: number;
  processed_items: number;
  sent_replays: number;
  failed_replays: number;
  skipped_replays: number;
  channels: string[];
  replayed_keys: string[];
  candidates: Array<Record<string, unknown>>;
  delivery_outcomes: Array<Record<string, unknown>>;
  replay_run_id: string | null;
};
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: PASS (no compilation errors)

- [ ] **Step 3: Commit**

```bash
git add src/lib/offers/types.ts
git commit -m "feat(offers): types for SLA queue, detail card, health, dispatch, DLQ"
```

---

## Task 2: Extend transitions matrix with offer actions

**Files:**
- Modify: `src/lib/moderation/transitions.ts`

- [ ] **Step 1: Append offer matrix below provider matrix**

Edit `src/lib/moderation/transitions.ts`. After the `providerActionUnavailableReason` export, add:

```ts
import type { OfferStatus } from "@/lib/offers/types";

export type OfferActionKind =
  | "approve"
  | "reject"
  | "archive"
  | "disable"
  | "enable";

const OFFER_REQUIRED_STATUSES: Record<OfferActionKind, OfferStatus[]> = {
  approve: ["on_review"],
  reject: ["on_review"],
  archive: ["active", "disabled", "rejected"],
  disable: ["active"],
  enable: ["disabled"],
};

export function offerActionsForStatus(
  status: OfferStatus,
): ReadonlySet<OfferActionKind> {
  const out = new Set<OfferActionKind>();
  for (const [kind, statuses] of Object.entries(OFFER_REQUIRED_STATUSES) as [
    OfferActionKind,
    OfferStatus[],
  ][]) {
    if (statuses.includes(status)) out.add(kind);
  }
  return out;
}

export function offerActionUnavailableReason(
  kind: OfferActionKind,
  status: OfferStatus,
): string {
  const allowed = OFFER_REQUIRED_STATUSES[kind];
  return `${kind[0]?.toUpperCase()}${kind.slice(1)} applies only when status is ${allowed.join(" or ")} (current: ${status}).`;
}
```

Also add the offer types import at the top of the file (next to the existing provider/service imports).

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/lib/moderation/transitions.ts
git commit -m "feat(offers): extend transitions matrix with offer action kinds"
```

---

## Task 3: Offer API — read endpoints

**Files:**
- Create: `src/lib/offers/api.ts`

- [ ] **Step 1: Write reads + force-dispatch + moderation in one file**

```ts
import { apiFetch, type ApiFetchResult } from "@/lib/api";
import type {
  DispatchRunLogResponse,
  DispatchRunsQuery,
  DlqQuery,
  DlqReplayRequest,
  DlqReplayResponse,
  DlqResponse,
  OfferDetailCard,
  OfferDispatchResponse,
  OfferModerationResponse,
  ProviderDispatchResponse,
  ProviderHealthResponse,
  ServiceHealthResponse,
  SlaSummary,
  SlaSummaryQuery,
} from "./types";

const BASE = "/eventup-admin/v1/marketplace/offers";

function append(params: URLSearchParams, key: string, value: string | number | boolean | undefined): void {
  if (value === undefined || value === null) return;
  params.set(key, String(value));
}

function appendArray(params: URLSearchParams, key: string, values: readonly (string | number)[] | undefined): void {
  if (!values || values.length === 0) return;
  for (const v of values) params.append(key, String(v));
}

function withQs(path: string, params: URLSearchParams): string {
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export function getSlaSummary(query: SlaSummaryQuery = {}): Promise<ApiFetchResult<SlaSummary>> {
  const p = new URLSearchParams();
  append(p, "service_id", query.service_id);
  appendArray(p, "service_ids", query.service_ids);
  append(p, "provider_id", query.provider_id);
  appendArray(p, "queue_status", query.queue_status);
  append(p, "min_waiting_hours", query.min_waiting_hours);
  append(p, "max_waiting_hours", query.max_waiting_hours);
  append(p, "only_degraded_services", query.only_degraded_services);
  append(p, "min_overdue_share", query.min_overdue_share);
  append(p, "limit", query.limit);
  return apiFetch<SlaSummary>(withQs(`${BASE}/review-sla/summary`, p));
}

export function getOfferDetailCard(id: number): Promise<ApiFetchResult<OfferDetailCard>> {
  return apiFetch<OfferDetailCard>(`${BASE}/${id}/detail-card`);
}

export function getServiceHealth(query: { limit?: number; service_id?: number; only_degraded?: boolean } = {}): Promise<ApiFetchResult<ServiceHealthResponse>> {
  const p = new URLSearchParams();
  append(p, "limit", query.limit);
  append(p, "service_id", query.service_id);
  append(p, "only_degraded", query.only_degraded);
  return apiFetch<ServiceHealthResponse>(withQs(`${BASE}/review-sla/health`, p));
}

export function getProviderHealth(query: { limit?: number; provider_id?: number; only_degraded?: boolean } = {}): Promise<ApiFetchResult<ProviderHealthResponse>> {
  const p = new URLSearchParams();
  append(p, "limit", query.limit);
  append(p, "provider_id", query.provider_id);
  append(p, "only_degraded", query.only_degraded);
  return apiFetch<ProviderHealthResponse>(withQs(`${BASE}/review-sla/providers/health`, p));
}

export function getDispatchRuns(query: DispatchRunsQuery = {}): Promise<ApiFetchResult<DispatchRunLogResponse>> {
  const p = new URLSearchParams();
  append(p, "dispatch_scope", query.dispatch_scope);
  append(p, "status", query.status);
  append(p, "actor_admin_id", query.actor_admin_id);
  append(p, "idempotency_key", query.idempotency_key);
  append(p, "limit", query.limit);
  append(p, "offset", query.offset);
  return apiFetch<DispatchRunLogResponse>(withQs(`${BASE}/review-sla/dispatch-runs`, p));
}

export function getDlq(query: DlqQuery = {}): Promise<ApiFetchResult<DlqResponse>> {
  const p = new URLSearchParams();
  append(p, "source_run_id", query.source_run_id);
  append(p, "channel", query.channel);
  append(p, "provider_id", query.provider_id);
  append(p, "exclude_replayed_successes", query.exclude_replayed_successes);
  append(p, "limit", query.limit);
  append(p, "offset", query.offset);
  return apiFetch<DlqResponse>(withQs(`${BASE}/review-sla/providers/dlq`, p));
}

export function approveOffer(id: number): Promise<ApiFetchResult<OfferModerationResponse>> {
  return apiFetch<OfferModerationResponse>(`${BASE}/${id}/approve`, {
    method: "POST",
    redirectOn401: false,
  });
}

export function rejectOffer(id: number, reason: string): Promise<ApiFetchResult<OfferModerationResponse>> {
  return apiFetch<OfferModerationResponse>(`${BASE}/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
    redirectOn401: false,
  });
}

export function archiveOffer(id: number, reason?: string): Promise<ApiFetchResult<OfferModerationResponse>> {
  return apiFetch<OfferModerationResponse>(`${BASE}/${id}/archive`, {
    method: "POST",
    body: JSON.stringify(reason ? { reason } : {}),
    redirectOn401: false,
  });
}

export function disableOffer(id: number, reason?: string): Promise<ApiFetchResult<OfferModerationResponse>> {
  return apiFetch<OfferModerationResponse>(`${BASE}/${id}/disable`, {
    method: "POST",
    body: JSON.stringify(reason ? { reason } : {}),
    redirectOn401: false,
  });
}

export function enableOffer(id: number): Promise<ApiFetchResult<OfferModerationResponse>> {
  return apiFetch<OfferModerationResponse>(`${BASE}/${id}/enable`, {
    method: "POST",
    redirectOn401: false,
  });
}

export function forceOfferDispatch(idempotencyKey: string): Promise<ApiFetchResult<OfferDispatchResponse>> {
  return apiFetch<OfferDispatchResponse>(`${BASE}/review-sla/dispatch`, {
    method: "POST",
    headers: { "X-Idempotency-Key": idempotencyKey },
    redirectOn401: false,
  });
}

export function forceProviderDispatch(idempotencyKey: string): Promise<ApiFetchResult<ProviderDispatchResponse>> {
  return apiFetch<ProviderDispatchResponse>(`${BASE}/review-sla/providers/dispatch`, {
    method: "POST",
    headers: { "X-Idempotency-Key": idempotencyKey },
    redirectOn401: false,
  });
}

export function replayDlq(body: DlqReplayRequest): Promise<ApiFetchResult<DlqReplayResponse>> {
  return apiFetch<DlqReplayResponse>(`${BASE}/review-sla/providers/dlq/replay`, {
    method: "POST",
    body: JSON.stringify(body),
    redirectOn401: false,
  });
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/lib/offers/api.ts
git commit -m "feat(offers): api module for SLA queue, detail, health, dispatch, moderation"
```

---

## Task 4: MSW fixtures for offers

**Files:**
- Create: `src/mocks/offers-fixtures.ts`
- Create: `src/mocks/offers-store.ts`

- [ ] **Step 1: Write `src/mocks/offers-fixtures.ts`**

```ts
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
```

- [ ] **Step 2: Write `src/mocks/offers-store.ts`**

```ts
import { makeOfferDetailFixture } from "./offers-fixtures";
import type { OfferDetailCard, OfferStatus } from "@/lib/offers/types";

const OFFERS = new Map<number, OfferDetailCard>();

function seed(): void {
  if (OFFERS.size > 0) return;
  for (let i = 1; i <= 40; i++) {
    OFFERS.set(i, makeOfferDetailFixture(i));
  }
}

export function getOffer(id: number): OfferDetailCard | undefined {
  seed();
  return OFFERS.get(id);
}

export function getAllOffers(): OfferDetailCard[] {
  seed();
  return Array.from(OFFERS.values());
}

export function setOfferStatus(id: number, status: OfferStatus): OfferDetailCard | undefined {
  seed();
  const cur = OFFERS.get(id);
  if (!cur) return undefined;
  const next: OfferDetailCard = { ...cur, status };
  OFFERS.set(id, next);
  return next;
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/mocks/offers-fixtures.ts src/mocks/offers-store.ts
git commit -m "test(offers): MSW fixtures + in-memory store for offers"
```

---

## Task 5: MSW handlers for offer endpoints

**Files:**
- Modify: `src/mocks/handlers.ts`

- [ ] **Step 1: Add handlers**

In `src/mocks/handlers.ts`, add new imports at the top:

```ts
import {
  CONFLICT_OFFER_ID,
  makeDispatchRunLogItem,
  makeDlqItem,
  makeProviderHealthItem,
  makeServiceHealthItem,
  makeSlaSummaryItem,
} from "./offers-fixtures";
import { getAllOffers, getOffer, setOfferStatus } from "./offers-store";
import { isOfferStatus, type OfferStatus, type QueueStatus } from "@/lib/offers/types";
```

Then add a constant near the existing BASEs:

```ts
const OFFERS_BASE = buildApiUrl("/eventup-admin/v1/marketplace/offers");
```

Then append the following handlers to the exported `handlers` array (export site — keep the existing entries above):

```ts
http.get(`${OFFERS_BASE}/review-sla/summary`, ({ request }) => {
  const url = new URL(request.url);
  const queueFilter = url.searchParams.getAll("queue_status") as QueueStatus[];
  const offers = getAllOffers().filter((o) => o.status === "on_review");
  const items = offers
    .filter((o) => queueFilter.length === 0 || queueFilter.includes(o.queue_status))
    .map(makeSlaSummaryItem);
  const counters = {
    total_on_review: offers.length,
    in_sla: offers.filter((o) => o.queue_status === "in_sla").length,
    warning: offers.filter((o) => o.queue_status === "warning").length,
    overdue_response: offers.filter((o) => o.queue_status === "overdue_response").length,
    closed_without_response_candidates: offers.filter((o) => o.queue_status === "closed_without_response").length,
  };
  return HttpResponse.json({ generated_at: new Date(0).toISOString(), counters, items });
}),
http.get(`${OFFERS_BASE}/:id/detail-card`, ({ params }) => {
  const id = Number(params.id);
  const offer = getOffer(id);
  if (!offer) return HttpResponse.json({ message: "not found" }, { status: 404 });
  return HttpResponse.json(offer);
}),
http.get(`${OFFERS_BASE}/review-sla/health`, () =>
  HttpResponse.json({
    generated_at: new Date(0).toISOString(),
    items: [0, 1, 2, 3].map(makeServiceHealthItem),
  }),
),
http.get(`${OFFERS_BASE}/review-sla/providers/health`, () =>
  HttpResponse.json({
    generated_at: new Date(0).toISOString(),
    items: [0, 1, 2, 3].map(makeProviderHealthItem),
  }),
),
http.get(`${OFFERS_BASE}/review-sla/dispatch-runs`, () =>
  HttpResponse.json({
    items: [0, 1, 2].map(makeDispatchRunLogItem),
    total: 3,
  }),
),
http.get(`${OFFERS_BASE}/review-sla/providers/dlq`, () =>
  HttpResponse.json({
    items: [0, 1].map(makeDlqItem),
    total: 2,
  }),
),
http.post(`${OFFERS_BASE}/:id/approve`, ({ params }) => moderate(params.id, "active", "approve")),
http.post(`${OFFERS_BASE}/:id/reject`, async ({ params, request }) => {
  const body = (await request.json().catch(() => ({}))) as { reason?: string };
  if (!body.reason || body.reason.trim().length < 10) {
    return HttpResponse.json({ message: "reason must be at least 10 characters" }, { status: 422 });
  }
  return moderate(params.id, "rejected", "reject");
}),
http.post(`${OFFERS_BASE}/:id/archive`, ({ params }) => moderate(params.id, "archived", "archive")),
http.post(`${OFFERS_BASE}/:id/disable`, ({ params }) => moderate(params.id, "disabled", "disable")),
http.post(`${OFFERS_BASE}/:id/enable`, ({ params }) => moderate(params.id, "active", "enable")),
http.post(`${OFFERS_BASE}/review-sla/dispatch`, () =>
  HttpResponse.json({
    generated_at: new Date(0).toISOString(),
    auto_close_enabled: true,
    checked_offers: 10,
    reminders_sent: 3,
    auto_closed: 1,
    reminder_offer_ids: [1, 2, 3],
    auto_closed_offer_ids: [4],
    escalations_sent: 0,
    escalated_service_ids: [],
  }),
),
http.post(`${OFFERS_BASE}/review-sla/providers/dispatch`, () =>
  HttpResponse.json({
    generated_at: new Date(0).toISOString(),
    checked_providers: 5,
    escalations_sent: 1,
    escalated_provider_ids: [201],
    channels: ["email"],
    delivery_outcomes: [],
  }),
),
http.post(`${OFFERS_BASE}/review-sla/providers/dlq/replay`, async ({ request }) => {
  const body = (await request.json().catch(() => ({ mode: "dry_run" }))) as { mode?: string };
  const mode = body.mode === "apply" ? "apply" : "dry_run";
  return HttpResponse.json({
    mode,
    total_candidates: 2,
    processed_items: 2,
    sent_replays: mode === "apply" ? 2 : 0,
    failed_replays: 0,
    skipped_replays: 0,
    channels: ["email"],
    replayed_keys: mode === "apply" ? ["dlq_0", "dlq_1"] : [],
    candidates: [],
    delivery_outcomes: [],
    replay_run_id: mode === "apply" ? "replay_run_1" : null,
  });
}),
```

Add this helper right after the existing similar helpers (above the handlers array):

```ts
function moderate(rawId: string | readonly string[] | undefined, newStatus: OfferStatus, key: string) {
  const id = Number(rawId);
  if (Number.isNaN(id) || !isOfferStatus(newStatus)) {
    return HttpResponse.json({ message: "bad input" }, { status: 400 });
  }
  if (id === CONFLICT_OFFER_ID) {
    return HttpResponse.json(
      { error: { meta: { original_detail: "conflicting status" } } },
      { status: 409 },
    );
  }
  const updated = setOfferStatus(id, newStatus);
  if (!updated) return HttpResponse.json({ message: "not found" }, { status: 404 });
  return HttpResponse.json({
    offer_id: id,
    new_status: newStatus,
    message_key: `offers.${key}`,
    message: `Offer ${key}d`,
  });
}
```

- [ ] **Step 2: Typecheck + start mock server**

Run: `pnpm exec tsc --noEmit`
Expected: PASS

Then `NEXT_PUBLIC_USE_MOCK_BACKEND=true NEXT_PUBLIC_USE_MOCK_AUTH=true pnpm exec next dev` and verify `curl http://localhost:3000/api/...` not needed — handlers are intercepted by MSW server. Skip if running offline; the smoke happens later in the Playwright suite.

- [ ] **Step 3: Commit**

```bash
git add src/mocks/handlers.ts
git commit -m "test(offers): MSW handlers for SLA queue, moderation, force-dispatch, DLQ"
```

---

## Task 6: `/offers` queue page

**Files:**
- Create: `src/app/(routes)/offers/page.tsx`
- Create: `src/app/(routes)/offers/_components/CountersCard.tsx`
- Create: `src/app/(routes)/offers/_components/QueueStatusBadge.tsx`
- Create: `src/app/(routes)/offers/_components/OffersFilters.tsx`
- Create: `src/app/(routes)/offers/_components/OffersTable.tsx`

- [ ] **Step 1: Write `CountersCard.tsx`**

```tsx
import type { SlaCounters } from "@/lib/offers/types";

const LABELS: { key: keyof SlaCounters; label: string }[] = [
  { key: "total_on_review", label: "On review" },
  { key: "in_sla", label: "In SLA" },
  { key: "warning", label: "Warning" },
  { key: "overdue_response", label: "Overdue" },
  { key: "closed_without_response_candidates", label: "Auto-close candidates" },
];

export default function CountersCard({ counters }: { counters: SlaCounters }) {
  return (
    <div data-testid="counters-card" className="grid grid-cols-2 gap-2 rounded-md border border-zinc-200 bg-white p-3 sm:grid-cols-5">
      {LABELS.map((l) => (
        <div key={l.key} className="flex flex-col">
          <span className="text-xs text-zinc-500">{l.label}</span>
          <span data-testid={`counter-${l.key}`} className="text-lg font-semibold text-zinc-900">
            {counters[l.key]}
          </span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Write `QueueStatusBadge.tsx`**

```tsx
import type { QueueStatus } from "@/lib/offers/types";

const STYLES: Record<QueueStatus, string> = {
  in_sla: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
  overdue_response: "bg-red-100 text-red-800",
  closed_without_response: "bg-zinc-200 text-zinc-700",
};

export default function QueueStatusBadge({ status }: { status: QueueStatus }) {
  return (
    <span
      data-testid="queue-status-badge"
      data-queue-status={status}
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {status}
    </span>
  );
}
```

- [ ] **Step 3: Write `OffersFilters.tsx`**

```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { QUEUE_STATUSES, type QueueStatus } from "@/lib/offers/types";

export default function OffersFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [serviceId, setServiceId] = useState(params.get("service_id") ?? "");
  const [providerId, setProviderId] = useState(params.get("provider_id") ?? "");
  const [minHours, setMinHours] = useState(params.get("min_waiting_hours") ?? "");
  const [queue, setQueue] = useState<Set<QueueStatus>>(
    new Set((params.getAll("queue_status") as QueueStatus[])),
  );

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams();
    if (serviceId) next.set("service_id", serviceId);
    if (providerId) next.set("provider_id", providerId);
    if (minHours) next.set("min_waiting_hours", minHours);
    for (const q of queue) next.append("queue_status", q);
    router.push(`/offers?${next.toString()}`);
  }

  function toggle(q: QueueStatus) {
    const next = new Set(queue);
    if (next.has(q)) next.delete(q);
    else next.add(q);
    setQueue(next);
  }

  return (
    <form data-testid="offers-filters" onSubmit={apply} className="flex flex-wrap items-end gap-3 rounded-md border border-zinc-200 bg-white p-3">
      <label className="flex flex-col text-xs">
        <span className="text-zinc-600">Service ID</span>
        <input data-testid="filter-service-id" value={serviceId} onChange={(e) => setServiceId(e.target.value)} className="rounded border px-2 py-1 text-sm" />
      </label>
      <label className="flex flex-col text-xs">
        <span className="text-zinc-600">Provider ID</span>
        <input data-testid="filter-provider-id" value={providerId} onChange={(e) => setProviderId(e.target.value)} className="rounded border px-2 py-1 text-sm" />
      </label>
      <label className="flex flex-col text-xs">
        <span className="text-zinc-600">Min waiting hours</span>
        <input data-testid="filter-min-hours" value={minHours} onChange={(e) => setMinHours(e.target.value)} className="rounded border px-2 py-1 text-sm" />
      </label>
      <div className="flex flex-col gap-1 text-xs">
        <span className="text-zinc-600">Queue status</span>
        <div className="flex flex-wrap gap-1">
          {QUEUE_STATUSES.map((q) => (
            <button
              type="button"
              key={q}
              data-testid={`filter-queue-${q}`}
              data-active={queue.has(q) ? "true" : "false"}
              onClick={() => toggle(q)}
              className={`rounded-full border px-2 py-0.5 text-xs ${queue.has(q) ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-white text-zinc-700"}`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
      <button type="submit" data-testid="filter-apply" className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800">
        Apply
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Write `OffersTable.tsx`**

```tsx
import Link from "next/link";
import type { SlaSummaryItem } from "@/lib/offers/types";
import QueueStatusBadge from "./QueueStatusBadge";

export default function OffersTable({ items }: { items: SlaSummaryItem[] }) {
  return (
    <table data-testid="offers-table" className="w-full table-auto text-sm">
      <thead className="text-left text-xs uppercase text-zinc-500">
        <tr>
          <th className="px-2 py-1">Offer</th>
          <th className="px-2 py-1">Service</th>
          <th className="px-2 py-1">Provider</th>
          <th className="px-2 py-1">Created</th>
          <th className="px-2 py-1">Waiting</th>
          <th className="px-2 py-1">Queue</th>
        </tr>
      </thead>
      <tbody>
        {items.map((it) => (
          <tr key={it.offer_id} data-testid={`offers-row-${it.offer_id}`} className="border-t border-zinc-100 hover:bg-zinc-50">
            <td className="px-2 py-1">
              <Link href={`/offers/${it.offer_id}`} className="text-zinc-900 underline">
                #{it.offer_id}
              </Link>
            </td>
            <td className="px-2 py-1">{it.service_title ?? `#${it.service_id}`}</td>
            <td className="px-2 py-1">{it.provider_name ?? (it.provider_id ? `#${it.provider_id}` : "—")}</td>
            <td className="px-2 py-1">{new Date(it.created_at).toISOString().slice(0, 16).replace("T", " ")}</td>
            <td className="px-2 py-1">{it.waiting_hours.toFixed(1)}h</td>
            <td className="px-2 py-1">
              <QueueStatusBadge status={it.queue_status} />
            </td>
          </tr>
        ))}
        {items.length === 0 ? (
          <tr>
            <td colSpan={6} data-testid="offers-empty" className="px-2 py-6 text-center text-zinc-500">
              No offers match the current filters.
            </td>
          </tr>
        ) : null}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 5: Write `page.tsx`**

```tsx
import { getSlaSummary } from "@/lib/offers/api";
import { QUEUE_STATUSES, isQueueStatus, type QueueStatus, type SlaSummaryQuery } from "@/lib/offers/types";
import CountersCard from "./_components/CountersCard";
import OffersFilters from "./_components/OffersFilters";
import OffersTable from "./_components/OffersTable";
import Link from "next/link";

const DEFAULT_QUEUE: QueueStatus[] = ["overdue_response", "warning"];
const LIMIT = 200;

type SearchParams = Record<string, string | string[] | undefined>;

function parseQuery(sp: SearchParams): SlaSummaryQuery {
  const queue = ([] as QueueStatus[]).concat(
    ...[sp.queue_status]
      .flat()
      .filter((v): v is string => typeof v === "string")
      .filter(isQueueStatus)
      .map((v) => [v] as QueueStatus[]),
  );
  const out: SlaSummaryQuery = {
    queue_status: queue.length > 0 ? queue : DEFAULT_QUEUE,
    limit: LIMIT,
  };
  const serviceId = Number(sp.service_id);
  if (Number.isFinite(serviceId) && serviceId > 0) out.service_id = serviceId;
  const providerId = Number(sp.provider_id);
  if (Number.isFinite(providerId) && providerId > 0) out.provider_id = providerId;
  const minHours = Number(sp.min_waiting_hours);
  if (Number.isFinite(minHours) && minHours >= 0) out.min_waiting_hours = minHours;
  return out;
}

export default async function OffersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const query = parseQuery(sp);
  const result = await getSlaSummary(query);
  if (!result.ok) {
    return (
      <main className="space-y-3 p-6">
        <h1 className="text-xl font-semibold">Offers — SLA queue</h1>
        <p data-testid="offers-error" className="text-sm text-red-700">
          Failed to load: {result.message}
        </p>
      </main>
    );
  }
  const sorted = [...result.data.items].sort((a, b) => b.waiting_hours - a.waiting_hours);
  return (
    <main className="space-y-4 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Offers — SLA queue</h1>
        <Link href="/offers/ops" data-testid="offers-ops-link" className="text-sm underline">
          SLA ops →
        </Link>
      </header>
      <CountersCard counters={result.data.counters} />
      <OffersFilters />
      <OffersTable items={sorted} />
    </main>
  );
}
```

- [ ] **Step 6: Typecheck + build**

Run: `pnpm exec tsc --noEmit && pnpm build`
Expected: PASS (production build green)

- [ ] **Step 7: Commit**

```bash
git add src/app/\(routes\)/offers/page.tsx src/app/\(routes\)/offers/_components/
git commit -m "feat(offers): SLA queue page with filters, counters, and table"
```

---

## Task 7: `/offers/[id]` detail + moderation

**Files:**
- Create: `src/app/(routes)/offers/[id]/action-types.ts`
- Create: `src/app/(routes)/offers/[id]/actions.ts`
- Create: `src/app/(routes)/offers/[id]/page.tsx`
- Create: `src/app/(routes)/offers/[id]/_components/OfferDetail.tsx`
- Create: `src/app/(routes)/offers/[id]/_components/OfferModerationPanel.tsx`
- Create: `src/app/(routes)/offers/[id]/_components/OfferStatusBadge.tsx`

- [ ] **Step 1: Write `action-types.ts`**

```ts
export type ActionState = { ok: boolean; error: string | null };
export const EMPTY_STATE: ActionState = { ok: false, error: null };
```

- [ ] **Step 2: Write `actions.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  approveOffer,
  archiveOffer,
  disableOffer,
  enableOffer,
  rejectOffer,
} from "@/lib/offers/api";
import type { ActionState } from "./action-types";

const idSchema = z.coerce.number().int().positive("offer id is required");
const reasonSchema = z.string().trim().min(10, "Reason must be at least 10 characters");
const reasonOptionalSchema = z.string().trim().min(10, "Reason must be at least 10 characters").optional();

function revalidate(id: number) {
  revalidatePath(`/offers/${id}`);
  revalidatePath("/offers");
}

function fail(message: string): ActionState {
  return { ok: false, error: message };
}

function parseOfferId(formData: FormData): { ok: true; id: number } | { ok: false; state: ActionState } {
  const parsed = idSchema.safeParse(formData.get("offerId"));
  if (!parsed.success) return { ok: false, state: fail(parsed.error.issues[0]?.message ?? "Invalid id") };
  return { ok: true, id: parsed.data };
}

function parseOptionalReason(value: FormDataEntryValue | null): { ok: true; reason: string | undefined } | { ok: false; state: ActionState } {
  if (value == null || value === "") return { ok: true, reason: undefined };
  const parsed = reasonOptionalSchema.safeParse(value);
  if (!parsed.success) return { ok: false, state: fail(parsed.error.issues[0]?.message ?? "Invalid reason") };
  return { ok: true, reason: parsed.data };
}

export async function approveOfferAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const idR = parseOfferId(formData);
  if (!idR.ok) return idR.state;
  const result = await approveOffer(idR.id);
  if (!result.ok) return fail(result.message ?? `Request failed (${result.status})`);
  revalidate(idR.id);
  return { ok: true, error: null };
}

export async function rejectOfferAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const idR = parseOfferId(formData);
  if (!idR.ok) return idR.state;
  const reasonR = reasonSchema.safeParse(formData.get("reason"));
  if (!reasonR.success) return fail(reasonR.error.issues[0]?.message ?? "Invalid reason");
  const result = await rejectOffer(idR.id, reasonR.data);
  if (!result.ok) return fail(result.message ?? `Request failed (${result.status})`);
  revalidate(idR.id);
  return { ok: true, error: null };
}

export async function archiveOfferAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const idR = parseOfferId(formData);
  if (!idR.ok) return idR.state;
  const reasonR = parseOptionalReason(formData.get("reason"));
  if (!reasonR.ok) return reasonR.state;
  const result = await archiveOffer(idR.id, reasonR.reason);
  if (!result.ok) return fail(result.message ?? `Request failed (${result.status})`);
  revalidate(idR.id);
  return { ok: true, error: null };
}

export async function disableOfferAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const idR = parseOfferId(formData);
  if (!idR.ok) return idR.state;
  const reasonR = parseOptionalReason(formData.get("reason"));
  if (!reasonR.ok) return reasonR.state;
  const result = await disableOffer(idR.id, reasonR.reason);
  if (!result.ok) return fail(result.message ?? `Request failed (${result.status})`);
  revalidate(idR.id);
  return { ok: true, error: null };
}

export async function enableOfferAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const idR = parseOfferId(formData);
  if (!idR.ok) return idR.state;
  const result = await enableOffer(idR.id);
  if (!result.ok) return fail(result.message ?? `Request failed (${result.status})`);
  revalidate(idR.id);
  return { ok: true, error: null };
}
```

- [ ] **Step 3: Write `OfferStatusBadge.tsx`**

```tsx
import type { OfferStatus } from "@/lib/offers/types";

const STYLES: Record<OfferStatus, string> = {
  on_review: "bg-amber-100 text-amber-800",
  active: "bg-emerald-100 text-emerald-800",
  disabled: "bg-zinc-200 text-zinc-700",
  rejected: "bg-red-100 text-red-800",
  archived: "bg-zinc-100 text-zinc-500",
};

export default function OfferStatusBadge({ status }: { status: OfferStatus }) {
  return (
    <span
      data-testid="status-badge"
      data-status={status}
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {status}
    </span>
  );
}
```

- [ ] **Step 4: Write `OfferDetail.tsx`**

```tsx
import type { OfferDetailCard } from "@/lib/offers/types";
import OfferStatusBadge from "./OfferStatusBadge";
import QueueStatusBadge from "../../_components/QueueStatusBadge";

function formatMoney(minor: number | null, currency: string | null): string {
  if (minor == null || !currency) return "—";
  return `${(minor / 100).toFixed(2)} ${currency}`;
}

export default function OfferDetail({ offer }: { offer: OfferDetailCard }) {
  return (
    <section data-testid="offer-detail" className="space-y-3 rounded-md border border-zinc-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <OfferStatusBadge status={offer.status} />
        <QueueStatusBadge status={offer.queue_status} />
        <span className="text-sm text-zinc-600">waiting {offer.waiting_hours.toFixed(1)}h</span>
      </div>
      <h2 className="text-lg font-semibold text-zinc-900">{offer.offer_title ?? `Offer #${offer.offer_id}`}</h2>
      {offer.offer_description ? <p className="text-sm text-zinc-700">{offer.offer_description}</p> : null}
      <dl className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
        <Row label="Service" value={offer.service_title ? `${offer.service_title} (#${offer.service_id})` : `#${offer.service_id}`} />
        <Row label="Provider" value={offer.provider_name ?? (offer.provider_id ? `#${offer.provider_id}` : "—")} />
        <Row label="Code" value={offer.code ?? "—"} />
        <Row label="Kind" value={offer.kind ?? "—"} />
        <Row label="Percent" value={offer.percent_value != null ? `${offer.percent_value}%` : "—"} />
        <Row label="Fixed" value={formatMoney(offer.fixed_value_minor, offer.currency)} />
        <Row label="Permanent" value={offer.is_permanent ? "yes" : "no"} />
        <Row label="Created at" value={offer.created_at} />
        <Row label="Start at" value={offer.start_at ?? "—"} />
        <Row label="Deadline" value={offer.deadline ?? "—"} />
        <Row label="Link" value={offer.link ?? "—"} />
      </dl>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 border-b border-zinc-100 py-1 sm:border-b-0">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-zinc-900">{value}</dd>
    </div>
  );
}
```

- [ ] **Step 5: Write `OfferModerationPanel.tsx`**

Mirror `ServiceModerationPanel` exactly (same `useActionState` + dialog pattern). Key differences: 5 kinds (`approve`/`reject`/`archive`/`disable`/`enable`), uses `offerActionsForStatus` / `offerActionUnavailableReason`, hidden field name is `offerId`.

```tsx
"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import ErrorToast from "@/app/_components/ErrorToast";
import {
  offerActionUnavailableReason,
  offerActionsForStatus,
  type OfferActionKind,
} from "@/lib/moderation/transitions";
import type { OfferStatus } from "@/lib/offers/types";
import {
  approveOfferAction,
  archiveOfferAction,
  disableOfferAction,
  enableOfferAction,
  rejectOfferAction,
} from "../actions";
import { EMPTY_STATE, type ActionState } from "../action-types";

type Kind = OfferActionKind;

type DialogConfig = {
  title: string;
  body: string;
  needsReason: boolean;
  reasonOptional?: boolean;
  confirmLabel: string;
};

const DIALOGS: Record<Kind, DialogConfig> = {
  approve: { title: "Approve offer?", body: "Transition on_review → active. Offer becomes live in the marketplace.", needsReason: false, confirmLabel: "Approve" },
  reject: { title: "Reject offer", body: "Reason required (10+ chars). Offer transitions to rejected.", needsReason: true, confirmLabel: "Reject" },
  archive: { title: "Archive offer?", body: "Optional reason (10+ chars if provided). Archived offers stay hidden.", needsReason: true, reasonOptional: true, confirmLabel: "Archive" },
  disable: { title: "Disable offer?", body: "Optional reason (10+ chars if provided). Offer becomes invisible to users.", needsReason: true, reasonOptional: true, confirmLabel: "Disable" },
  enable: { title: "Enable offer?", body: "Restore active state.", needsReason: false, confirmLabel: "Enable" },
};

const ACTIONS: Record<Kind, (prev: ActionState, fd: FormData) => Promise<ActionState>> = {
  approve: approveOfferAction,
  reject: rejectOfferAction,
  archive: archiveOfferAction,
  disable: disableOfferAction,
  enable: enableOfferAction,
};

function ActionForm({ kind, offerId, onSettled }: { kind: Kind; offerId: number; onSettled: (ok: boolean, error: string | null) => void }) {
  const [state, formAction, pending] = useActionState(ACTIONS[kind], EMPTY_STATE);
  const lastReported = useRef<{ ok: boolean; error: string | null } | null>(null);
  useEffect(() => {
    if (pending) return;
    if (state === EMPTY_STATE) return;
    const prev = lastReported.current;
    if (prev && prev.ok === state.ok && prev.error === state.error) return;
    lastReported.current = { ok: state.ok, error: state.error };
    onSettled(state.ok, state.error);
  }, [state, pending, onSettled]);
  const cfg = DIALOGS[kind];
  return (
    <form action={formAction} className="space-y-3" data-testid={`moderation-form-${kind}`}>
      <input type="hidden" name="offerId" value={offerId} />
      {cfg.needsReason ? (
        <textarea
          name="reason"
          required={!cfg.reasonOptional}
          minLength={10}
          rows={4}
          data-testid={`moderation-reason-${kind}`}
          placeholder={cfg.reasonOptional ? "Reason (optional, min 10 chars)…" : "Reason (min 10 chars)…"}
          className="w-full rounded-md border border-zinc-300 p-2 text-sm focus:border-zinc-500 focus:outline-none"
        />
      ) : null}
      {state.error ? <p data-testid={`moderation-error-${kind}`} className="text-sm text-red-700">{state.error}</p> : null}
      <div className="flex justify-end gap-2">
        <button type="submit" disabled={pending} data-testid={`moderation-submit-${kind}`} className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:bg-zinc-400">
          {pending ? "Submitting…" : cfg.confirmLabel}
        </button>
      </div>
    </form>
  );
}

const ALL_KINDS: { kind: Kind; label: string; className: string }[] = [
  { kind: "approve", label: "Approve", className: "bg-emerald-600 text-white hover:bg-emerald-700" },
  { kind: "reject", label: "Reject", className: "bg-red-600 text-white hover:bg-red-700" },
  { kind: "archive", label: "Archive", className: "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50" },
  { kind: "disable", label: "Disable", className: "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50" },
  { kind: "enable", label: "Enable", className: "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50" },
];

const DISABLED_CLASS = "w-full rounded-md border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-400 cursor-not-allowed";

export default function OfferModerationPanel({ offerId, status }: { offerId: number; status: OfferStatus }) {
  const [open, setOpen] = useState<Kind | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const allowed = offerActionsForStatus(status);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    if (!open && dlg.open) dlg.close();
  }, [open]);

  const onSettled = (ok: boolean, error: string | null) => {
    if (ok) {
      setOpen(null);
      return;
    }
    if (error) setToast(error);
  };

  const current = open ? DIALOGS[open] : null;

  return (
    <section data-testid="moderation-panel" data-status={status} className="space-y-2 rounded-md border border-zinc-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-zinc-900">Moderation</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {ALL_KINDS.map((k) =>
          allowed.has(k.kind) ? (
            <button
              type="button"
              key={k.kind}
              data-testid={`moderation-open-${k.kind}`}
              onClick={() => setOpen(k.kind)}
              className={`w-full rounded-md px-3 py-2 text-sm font-medium ${k.className}`}
            >
              {k.label}
            </button>
          ) : (
            <button
              type="button"
              key={k.kind}
              disabled
              data-testid={`moderation-open-${k.kind}`}
              data-disabled-reason={offerActionUnavailableReason(k.kind, status)}
              title={offerActionUnavailableReason(k.kind, status)}
              className={DISABLED_CLASS}
            >
              {k.label}
            </button>
          ),
        )}
      </div>

      <dialog ref={dialogRef} data-testid="moderation-dialog" onClose={() => setOpen(null)} className="w-full max-w-md rounded-lg bg-white p-4 shadow-xl">
        {current && open ? (
          <div className="space-y-3">
            <h4 className="text-base font-semibold">{current.title}</h4>
            <p className="text-sm text-zinc-700">{current.body}</p>
            <ActionForm kind={open} offerId={offerId} onSettled={onSettled} />
            <div className="flex justify-end">
              <button type="button" data-testid="moderation-cancel" onClick={() => setOpen(null)} className="text-sm text-zinc-600 underline">
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </dialog>

      <ErrorToast message={toast} onClose={() => setToast(null)} />
    </section>
  );
}
```

- [ ] **Step 6: Write `page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { getOfferDetailCard } from "@/lib/offers/api";
import { isOfferStatus } from "@/lib/offers/types";
import OfferDetail from "./_components/OfferDetail";
import OfferModerationPanel from "./_components/OfferModerationPanel";

export default async function OfferDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const offerId = Number(id);
  if (!Number.isFinite(offerId) || offerId <= 0) notFound();
  const result = await getOfferDetailCard(offerId);
  if (!result.ok) {
    if (result.status === 404) notFound();
    return (
      <main className="space-y-3 p-6">
        <h1 className="text-xl font-semibold">Offer #{offerId}</h1>
        <p data-testid="offer-error" className="text-sm text-red-700">{result.message}</p>
      </main>
    );
  }
  const offer = result.data;
  if (!isOfferStatus(offer.status)) {
    return (
      <main className="space-y-3 p-6">
        <h1 className="text-xl font-semibold">Offer #{offerId}</h1>
        <p className="text-sm text-red-700">Unknown offer status: {offer.status}</p>
      </main>
    );
  }
  return (
    <main className="space-y-4 p-6">
      <h1 className="text-xl font-semibold">Offer #{offerId}</h1>
      <OfferDetail offer={offer} />
      <OfferModerationPanel offerId={offerId} status={offer.status} />
    </main>
  );
}
```

- [ ] **Step 7: Typecheck + build**

Run: `pnpm exec tsc --noEmit && pnpm build`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/app/\(routes\)/offers/\[id\]/
git commit -m "feat(offers): detail page + moderation panel with 5 actions"
```

---

## Task 8: `/offers/ops` SLA ops dashboard

**Files:**
- Create: `src/app/(routes)/offers/ops/action-types.ts`
- Create: `src/app/(routes)/offers/ops/actions.ts`
- Create: `src/app/(routes)/offers/ops/page.tsx`
- Create: `src/app/(routes)/offers/ops/_components/ServiceHealthSection.tsx`
- Create: `src/app/(routes)/offers/ops/_components/ProviderHealthSection.tsx`
- Create: `src/app/(routes)/offers/ops/_components/DispatchRunsSection.tsx`
- Create: `src/app/(routes)/offers/ops/_components/DlqSection.tsx`
- Create: `src/app/(routes)/offers/ops/_components/ForceDispatchButtons.tsx`

- [ ] **Step 1: Write `action-types.ts`**

```ts
export type OpsActionState = {
  ok: boolean;
  error: string | null;
  message: string | null;
};
export const EMPTY_OPS_STATE: OpsActionState = { ok: false, error: null, message: null };
```

- [ ] **Step 2: Write `actions.ts`**

```ts
"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { forceOfferDispatch, forceProviderDispatch, replayDlq } from "@/lib/offers/api";
import type { DlqReplayMode } from "@/lib/offers/types";
import type { OpsActionState } from "./action-types";

function fail(message: string): OpsActionState {
  return { ok: false, error: message, message: null };
}

export async function forceOfferDispatchAction(_prev: OpsActionState, _fd: FormData): Promise<OpsActionState> {
  const key = randomUUID();
  const result = await forceOfferDispatch(key);
  if (!result.ok) return fail(result.message ?? `Request failed (${result.status})`);
  revalidatePath("/offers/ops");
  return {
    ok: true,
    error: null,
    message: `Checked ${result.data.checked_offers} offers · reminded ${result.data.reminders_sent} · auto-closed ${result.data.auto_closed} · escalated ${result.data.escalations_sent}`,
  };
}

export async function forceProviderDispatchAction(_prev: OpsActionState, _fd: FormData): Promise<OpsActionState> {
  const key = randomUUID();
  const result = await forceProviderDispatch(key);
  if (!result.ok) return fail(result.message ?? `Request failed (${result.status})`);
  revalidatePath("/offers/ops");
  return {
    ok: true,
    error: null,
    message: `Checked ${result.data.checked_providers} providers · escalated ${result.data.escalations_sent}`,
  };
}

export async function replayDlqAction(_prev: OpsActionState, formData: FormData): Promise<OpsActionState> {
  const raw = formData.get("mode");
  const mode: DlqReplayMode = raw === "apply" ? "apply" : "dry_run";
  const result = await replayDlq({ mode });
  if (!result.ok) return fail(result.message ?? `Request failed (${result.status})`);
  revalidatePath("/offers/ops");
  return {
    ok: true,
    error: null,
    message: `${mode}: ${result.data.processed_items}/${result.data.total_candidates} processed · sent ${result.data.sent_replays} · failed ${result.data.failed_replays}`,
  };
}
```

- [ ] **Step 3: Write four section components**

Each section is a server component fetching its slice and rendering a table with a `<form action={…}>` posting to a tiny server action that just calls `revalidatePath('/offers/ops')`. Skeleton common to all four:

```tsx
// ServiceHealthSection.tsx
import { getServiceHealth } from "@/lib/offers/api";

export default async function ServiceHealthSection() {
  const result = await getServiceHealth({ limit: 50 });
  if (!result.ok) return <p data-testid="service-health-error" className="text-sm text-red-700">{result.message}</p>;
  const items = result.data.items;
  return (
    <section data-testid="service-health">
      <header className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Service health</h2>
        <span className="text-xs text-zinc-500" data-testid="service-health-generated-at">
          Updated {result.data.generated_at}
        </span>
      </header>
      <table className="w-full table-auto text-sm">
        <thead className="text-left text-xs uppercase text-zinc-500">
          <tr>
            <th className="px-2 py-1">Service</th>
            <th className="px-2 py-1">On review</th>
            <th className="px-2 py-1">In SLA</th>
            <th className="px-2 py-1">Warning</th>
            <th className="px-2 py-1">Overdue</th>
            <th className="px-2 py-1">Overdue %</th>
            <th className="px-2 py-1">Escalation</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.service_id} data-testid={`service-health-row-${it.service_id}`} className="border-t border-zinc-100">
              <td className="px-2 py-1">{it.service_title ?? `#${it.service_id}`}</td>
              <td className="px-2 py-1">{it.total_on_review}</td>
              <td className="px-2 py-1">{it.in_sla}</td>
              <td className="px-2 py-1">{it.warning}</td>
              <td className="px-2 py-1">{it.overdue_response}</td>
              <td className="px-2 py-1">{(it.overdue_share * 100).toFixed(0)}%</td>
              <td className="px-2 py-1">{it.escalation_recommended ? "yes" : "no"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
```

`ProviderHealthSection.tsx`:

```tsx
import { getProviderHealth } from "@/lib/offers/api";

export default async function ProviderHealthSection() {
  const result = await getProviderHealth({ limit: 50 });
  if (!result.ok) return <p data-testid="provider-health-error" className="text-sm text-red-700">{result.message}</p>;
  return (
    <section data-testid="provider-health">
      <header className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Provider health</h2>
        <span className="text-xs text-zinc-500">Updated {result.data.generated_at}</span>
      </header>
      <table className="w-full table-auto text-sm">
        <thead className="text-left text-xs uppercase text-zinc-500">
          <tr>
            <th className="px-2 py-1">Provider</th>
            <th className="px-2 py-1">Services</th>
            <th className="px-2 py-1">On review</th>
            <th className="px-2 py-1">In SLA</th>
            <th className="px-2 py-1">Warning</th>
            <th className="px-2 py-1">Overdue</th>
            <th className="px-2 py-1">Overdue %</th>
            <th className="px-2 py-1">Escalation</th>
          </tr>
        </thead>
        <tbody>
          {result.data.items.map((it) => (
            <tr key={it.provider_id} data-testid={`provider-health-row-${it.provider_id}`} className="border-t border-zinc-100">
              <td className="px-2 py-1">{it.provider_name ?? `#${it.provider_id}`}</td>
              <td className="px-2 py-1">{it.services_total}</td>
              <td className="px-2 py-1">{it.total_on_review}</td>
              <td className="px-2 py-1">{it.in_sla}</td>
              <td className="px-2 py-1">{it.warning}</td>
              <td className="px-2 py-1">{it.overdue_response}</td>
              <td className="px-2 py-1">{(it.overdue_share * 100).toFixed(0)}%</td>
              <td className="px-2 py-1">{it.escalation_recommended ? "yes" : "no"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
```

`DispatchRunsSection.tsx`:

```tsx
import { getDispatchRuns } from "@/lib/offers/api";

export default async function DispatchRunsSection() {
  const result = await getDispatchRuns({ limit: 50 });
  if (!result.ok) return <p data-testid="dispatch-runs-error" className="text-sm text-red-700">{result.message}</p>;
  return (
    <section data-testid="dispatch-runs">
      <header className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Dispatch runs ({result.data.total})</h2>
      </header>
      <table className="w-full table-auto text-sm">
        <thead className="text-left text-xs uppercase text-zinc-500">
          <tr>
            <th className="px-2 py-1">Created at</th>
            <th className="px-2 py-1">Scope</th>
            <th className="px-2 py-1">Status</th>
            <th className="px-2 py-1">Actor</th>
            <th className="px-2 py-1">Idempotency key</th>
          </tr>
        </thead>
        <tbody>
          {result.data.items.map((it) => (
            <tr key={it.id} data-testid={`dispatch-runs-row-${it.id}`} className="border-t border-zinc-100">
              <td className="px-2 py-1">{it.created_at}</td>
              <td className="px-2 py-1">{it.dispatch_scope}</td>
              <td className="px-2 py-1">{it.status}</td>
              <td className="px-2 py-1">{it.actor_email ?? "—"}</td>
              <td className="px-2 py-1 font-mono text-xs">{it.idempotency_key ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
```

`DlqSection.tsx` (accepts `excludeReplayed` from page `searchParams`):

```tsx
import { getDlq } from "@/lib/offers/api";

export default async function DlqSection({ excludeReplayed = true }: { excludeReplayed?: boolean }) {
  const result = await getDlq({ exclude_replayed_successes: excludeReplayed, limit: 50 });
  if (!result.ok) return <p data-testid="dlq-error" className="text-sm text-red-700">{result.message}</p>;
  return (
    <section data-testid="dlq">
      <header className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold">DLQ ({result.data.total})</h2>
      </header>
      <table className="w-full table-auto text-sm">
        <thead className="text-left text-xs uppercase text-zinc-500">
          <tr>
            <th className="px-2 py-1">Key</th>
            <th className="px-2 py-1">Channel</th>
            <th className="px-2 py-1">Provider</th>
            <th className="px-2 py-1">Created at</th>
            <th className="px-2 py-1">Outcome</th>
          </tr>
        </thead>
        <tbody>
          {result.data.items.map((it) => (
            <tr key={it.dlq_key} data-testid={`dlq-row-${it.dlq_key}`} className="border-t border-zinc-100">
              <td className="px-2 py-1 font-mono text-xs">{it.dlq_key}</td>
              <td className="px-2 py-1">{it.channel}</td>
              <td className="px-2 py-1">#{it.provider_id}</td>
              <td className="px-2 py-1">{it.created_at}</td>
              <td className="px-2 py-1">{String((it.delivery_outcome as { status?: string })?.status ?? "—")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
```

`page.tsx` passes `excludeReplayed` if the search param is present:

```tsx
type SearchParams = Record<string, string | string[] | undefined>;
// inside OpsPage:
const sp = await searchParams;
const excludeReplayed = sp.exclude_replayed !== "false";
// ...
<DlqSection excludeReplayed={excludeReplayed} />
```

- [ ] **Step 4: Write `ForceDispatchButtons.tsx`**

```tsx
"use client";

import { useActionState, useEffect, useState } from "react";
import ErrorToast from "@/app/_components/ErrorToast";
import {
  forceOfferDispatchAction,
  forceProviderDispatchAction,
  replayDlqAction,
} from "../actions";
import { EMPTY_OPS_STATE, type OpsActionState } from "../action-types";

type OpsAction = (prev: OpsActionState, fd: FormData) => Promise<OpsActionState>;

function ConfirmButton({
  testid,
  label,
  description,
  action,
  hiddenFields,
  variant = "primary",
}: {
  testid: string;
  label: string;
  description: string;
  action: OpsAction;
  hiddenFields?: Record<string, string>;
  variant?: "primary" | "danger" | "ghost";
}) {
  const [state, formAction, pending] = useActionState(action, EMPTY_OPS_STATE);
  const [confirmed, setConfirmed] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (state.error && toast !== state.error) setToast(state.error);
  }, [state.error, toast]);

  useEffect(() => {
    if (state.ok && confirmed) setConfirmed(false);
  }, [state.ok, confirmed]);

  const className =
    variant === "danger"
      ? "rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:bg-zinc-400"
      : variant === "ghost"
      ? "rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:text-zinc-400"
      : "rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:bg-zinc-400";

  return (
    <div className="space-y-1">
      <form action={formAction} className="flex flex-col gap-1">
        {Object.entries(hiddenFields ?? {}).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        {!confirmed ? (
          <button
            type="button"
            data-testid={`${testid}-open`}
            onClick={() => setConfirmed(true)}
            className={className}
          >
            {label}
          </button>
        ) : (
          <div className="flex flex-col gap-1 rounded-md border border-amber-300 bg-amber-50 p-2">
            <p className="text-xs text-amber-900">{description}</p>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={pending}
                data-testid={`${testid}-confirm`}
                className={className}
              >
                {pending ? "Running…" : `Confirm: ${label}`}
              </button>
              <button
                type="button"
                data-testid={`${testid}-cancel`}
                onClick={() => setConfirmed(false)}
                className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </form>
      {state.message ? (
        <p data-testid={`${testid}-result`} className="text-xs text-emerald-700">
          {state.message}
        </p>
      ) : null}
      <ErrorToast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default function ForceDispatchButtons() {
  return (
    <section data-testid="force-dispatch" className="space-y-3 rounded-md border border-zinc-200 bg-white p-3">
      <h2 className="text-sm font-semibold">Force dispatch</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <ConfirmButton
          testid="force-offer-dispatch"
          label="Force offer dispatch"
          description="Sends push/email reminders to speakers with on_review offers, auto-closes overdue ones."
          action={forceOfferDispatchAction}
        />
        <ConfirmButton
          testid="force-provider-dispatch"
          label="Force provider dispatch"
          description="Sends escalation notifications to providers with overdue offers."
          action={forceProviderDispatchAction}
        />
        <ConfirmButton
          testid="dlq-replay-dry"
          label="DLQ replay — dry run"
          description="Counts what would be retried. Sends nothing."
          action={replayDlqAction}
          hiddenFields={{ mode: "dry_run" }}
          variant="ghost"
        />
        <ConfirmButton
          testid="dlq-replay-apply"
          label="DLQ replay — apply"
          description="Actually retries failed deliveries. Side-effects persist."
          action={replayDlqAction}
          hiddenFields={{ mode: "apply" }}
          variant="danger"
        />
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Write `page.tsx`**

```tsx
import ForceDispatchButtons from "./_components/ForceDispatchButtons";
import ServiceHealthSection from "./_components/ServiceHealthSection";
import ProviderHealthSection from "./_components/ProviderHealthSection";
import DispatchRunsSection from "./_components/DispatchRunsSection";
import DlqSection from "./_components/DlqSection";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function OpsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const excludeReplayed = sp.exclude_replayed !== "false";
  return (
    <main className="space-y-6 p-6">
      <h1 className="text-xl font-semibold">Offers — SLA ops</h1>
      <ForceDispatchButtons />
      <ServiceHealthSection />
      <ProviderHealthSection />
      <DispatchRunsSection />
      <DlqSection excludeReplayed={excludeReplayed} />
    </main>
  );
}
```

- [ ] **Step 6: Typecheck + build**

Run: `pnpm exec tsc --noEmit && pnpm build`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/app/\(routes\)/offers/ops/
git commit -m "feat(offers): SLA ops page with health, runs, DLQ, force-dispatch"
```

---

## Task 9: Header nav link

**Files:**
- Modify: `src/app/(routes)/layout.tsx`

- [ ] **Step 1: Add `/offers` link next to `/services`**

Open `src/app/(routes)/layout.tsx`, locate the nav links block (sibling to existing `<Link href="/services">…</Link>`), add the same shape:

```tsx
<Link href="/offers" data-testid="nav-offers" className="text-sm text-zinc-700 hover:text-zinc-900">
  Offers
</Link>
```

- [ ] **Step 2: Typecheck + build**

Run: `pnpm exec tsc --noEmit && pnpm build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/\(routes\)/layout.tsx
git commit -m "feat(offers): add /offers link to top nav"
```

---

## Task 10: Playwright spec — offers moderation matrix

**Files:**
- Create: `tests/offers-moderation-matrix.spec.ts`

- [ ] **Step 1: Write the spec**

```ts
import { test, expect, type Page } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

type Kind = "approve" | "reject" | "archive" | "disable" | "enable";

async function expectButton(page: Page, kind: Kind, enabled: boolean) {
  const btn = page.getByTestId(`moderation-open-${kind}`);
  if (enabled) await expect(btn).toBeEnabled();
  else {
    await expect(btn).toBeDisabled();
    await expect(btn).toHaveAttribute("data-disabled-reason", /applies only when status is/);
  }
}

// Fixture status cycle: i=1 on_review, i=2 active, i=3 disabled, i=4 rejected, i=5 archived (see makeOfferDetailFixture).
const CASES: { id: number; status: string; allowed: Kind[] }[] = [
  { id: 1, status: "on_review", allowed: ["approve", "reject"] },
  { id: 2, status: "active", allowed: ["archive", "disable"] },
  { id: 3, status: "disabled", allowed: ["archive", "enable"] },
  { id: 4, status: "rejected", allowed: ["archive"] },
  { id: 5, status: "archived", allowed: [] },
];

const ALL_KINDS: Kind[] = ["approve", "reject", "archive", "disable", "enable"];

for (const c of CASES) {
  test(`offer ${c.id} (${c.status}): allowed=${c.allowed.join("|") || "none"}`, async ({ page }) => {
    await loginAsMockAdmin(page, `/offers/${c.id}`);
    await page.waitForURL(`**/offers/${c.id}`);
    await expect(page.getByTestId("moderation-panel")).toHaveAttribute("data-status", c.status);
    for (const k of ALL_KINDS) {
      await expectButton(page, k, c.allowed.includes(k));
    }
  });
}
```

- [ ] **Step 2: Run**

```bash
pnpm test:e2e tests/offers-moderation-matrix.spec.ts
```

Expected: 5 tests PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/offers-moderation-matrix.spec.ts
git commit -m "test(offers): moderation matrix coverage for all 5 offer statuses"
```

---

## Task 11: Playwright spec — moderation flows

**Files:**
- Create: `tests/offers-moderation.spec.ts`

- [ ] **Step 1: Write the spec**

```ts
import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

test("offers list shows counters and default filter is overdue+warning", async ({ page }) => {
  await loginAsMockAdmin(page, "/offers");
  await page.waitForURL("**/offers**");
  await expect(page.getByTestId("counters-card")).toBeVisible();
  await expect(page.getByTestId("filter-queue-overdue_response")).toHaveAttribute("data-active", "false");
  // Default query encoded in URL.
  await expect(page).toHaveURL(/queue_status=overdue_response|queue_status=warning|^[^?]+$/);
  await expect(page.getByTestId("offers-table")).toBeVisible();
});

test("approve flow: on_review offer -> active", async ({ page }) => {
  await loginAsMockAdmin(page, "/offers/1");
  await page.waitForURL("**/offers/1");
  await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "on_review");
  await page.getByTestId("moderation-open-approve").click();
  await page.getByTestId("moderation-submit-approve").click();
  await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "active");
});

test("reject flow: requires 10+ char reason", async ({ page }) => {
  await loginAsMockAdmin(page, "/offers/1");
  await page.waitForURL("**/offers/1");
  await page.getByTestId("moderation-open-reject").click();
  await page.getByTestId("moderation-reason-reject").fill("nope");
  await page.getByTestId("moderation-submit-reject").click();
  await expect(page.getByTestId("moderation-dialog")).toBeVisible();
  await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "on_review");

  await page.getByTestId("moderation-reason-reject").fill("Reason long enough to pass");
  await page.getByTestId("moderation-submit-reject").click();
  await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "rejected");
});

test("disable flow from active", async ({ page }) => {
  await loginAsMockAdmin(page, "/offers/2");
  await page.waitForURL("**/offers/2");
  await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "active");
  await page.getByTestId("moderation-open-disable").click();
  await page.getByTestId("moderation-submit-disable").click();
  await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "disabled");
});

test("enable flow from disabled", async ({ page }) => {
  await loginAsMockAdmin(page, "/offers/3");
  await page.waitForURL("**/offers/3");
  await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "disabled");
  await page.getByTestId("moderation-open-enable").click();
  await page.getByTestId("moderation-submit-enable").click();
  await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "active");
});

test("archive flow from rejected", async ({ page }) => {
  await loginAsMockAdmin(page, "/offers/4");
  await page.waitForURL("**/offers/4");
  await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "rejected");
  await page.getByTestId("moderation-open-archive").click();
  await page.getByTestId("moderation-submit-archive").click();
  await expect(page.getByTestId("status-badge")).toHaveAttribute("data-status", "archived");
});
```

- [ ] **Step 2: Run**

```bash
pnpm test:e2e tests/offers-moderation.spec.ts
```

Expected: 6 tests PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/offers-moderation.spec.ts
git commit -m "test(offers): flow coverage for approve/reject/disable/enable/archive"
```

---

## Task 12: Playwright spec — ops dashboard

**Files:**
- Create: `tests/offers-ops.spec.ts`

- [ ] **Step 1: Write the spec**

```ts
import { test, expect } from "@playwright/test";
import { loginAsMockAdmin } from "./helpers/login";

test("ops page renders all four sections + force-dispatch buttons", async ({ page }) => {
  await loginAsMockAdmin(page, "/offers/ops");
  await page.waitForURL("**/offers/ops");
  await expect(page.getByTestId("force-dispatch")).toBeVisible();
  await expect(page.getByTestId("service-health")).toBeVisible();
  await expect(page.getByTestId("service-health-row-100")).toBeVisible();
});

test("force offer dispatch shows confirm step and reports counts", async ({ page }) => {
  await loginAsMockAdmin(page, "/offers/ops");
  await page.waitForURL("**/offers/ops");
  await page.getByTestId("force-offer-dispatch-open").click();
  await expect(page.getByTestId("force-offer-dispatch-confirm")).toBeVisible();
  await page.getByTestId("force-offer-dispatch-confirm").click();
  await expect(page.getByTestId("force-offer-dispatch-result")).toContainText(/Checked 10/);
});

test("DLQ replay dry run reports counts but does not send", async ({ page }) => {
  await loginAsMockAdmin(page, "/offers/ops");
  await page.waitForURL("**/offers/ops");
  await page.getByTestId("dlq-replay-dry-open").click();
  await page.getByTestId("dlq-replay-dry-confirm").click();
  await expect(page.getByTestId("dlq-replay-dry-result")).toContainText(/dry_run/);
  await expect(page.getByTestId("dlq-replay-dry-result")).toContainText(/sent 0/);
});

test("DLQ replay apply sends and reports counts", async ({ page }) => {
  await loginAsMockAdmin(page, "/offers/ops");
  await page.waitForURL("**/offers/ops");
  await page.getByTestId("dlq-replay-apply-open").click();
  await page.getByTestId("dlq-replay-apply-confirm").click();
  await expect(page.getByTestId("dlq-replay-apply-result")).toContainText(/apply/);
  await expect(page.getByTestId("dlq-replay-apply-result")).toContainText(/sent 2/);
});
```

- [ ] **Step 2: Run**

```bash
pnpm test:e2e tests/offers-ops.spec.ts
```

Expected: 4 tests PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/offers-ops.spec.ts
git commit -m "test(offers): SLA ops dashboard + force-dispatch + DLQ replay"
```

---

## Task 13: Final verification + ship

- [ ] **Step 1: Run full Playwright suite**

```bash
pnpm test:e2e
```

Expected: ALL tests PASS (existing F5/F6 + new F7).

- [ ] **Step 2: Run lint + production build**

```bash
pnpm lint && pnpm build
```

Expected: PASS.

- [ ] **Step 3: Self-review diff**

```bash
git log main..HEAD --oneline
git diff main...HEAD --stat
```

Walk the file list. Confirm:
- No console.log left in committed code.
- No `// TODO` or `// FIXME` markers.
- All new files match the F6 service pattern in structure.
- No secrets, no logged tokens.

- [ ] **Step 4: Push branch + open PR**

```bash
git push -u origin claude/mystifying-germain-232e67
gh pr create --base main --title "feat(offers): F7 moderation UI — SLA queue, detail, ops dashboard" --body "$(cat <<'EOF'
## Summary
- New `/offers` SLA queue (default filter overdue+warning, sorted by waiting hours desc).
- New `/offers/[id]` detail card + 5-action moderation panel (approve / reject / archive / disable / enable).
- New `/offers/ops` SLA dashboard — service health, provider health, dispatch runs log, DLQ list, force-dispatch + DLQ replay (dry-run / apply).

## Test plan
- [x] `pnpm test:e2e` green (matrix + flows + ops specs).
- [x] `pnpm lint && pnpm build` green.
- [ ] Manual smoke on staging once admin-marketplace deploys this branch — verify /offers loads + approve a fixture offer.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 5: Self-review the diff via `gh pr diff <num>`, wait for CI green, merge**

```bash
gh pr checks <num>          # wait until all green
gh pr merge <num> --squash --delete-branch
```

Expected: CI green, PR merged, branch deleted.

---

## Done

Status: F7 shipped. Three new routes live, 16 new files, mirror of F6 pattern. No backend changes. Manual smoke on `admin-marketplace.speakup.ltd` after deploy is the only remaining check, which user performs.
