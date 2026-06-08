# F7 — Offer Moderation UI

**Status:** approved (2026-06-08)
**Scope:** admin-marketplace.speakup.ltd (eventup-admin-web)
**Backend:** api.speak-up.pro, namespace `/eventup-admin/v1/marketplace/offers/*` (P3.1–P3.5 live)

## Goal

Add the third moderation surface alongside F5 (providers) and F6 (services): offer review queue, per-offer moderation actions, and an ops sub-page for SLA dispatch operations.

## Backend contract (canonical reference)

All paths below are relative to `https://api.speak-up.pro/eventup-admin/v1/marketplace/offers`.

### Offer moderation
- `POST {id}/approve` → `OfferModerationResponse`. Body: none. Transition: `on_review → active`.
- `POST {id}/reject` → `OfferModerationResponse`. Body: `{reason: string}` (10+ chars). Transition: `on_review → rejected`.
- `POST {id}/archive` → `OfferModerationResponse`. Body: `{reason?: string}` (10+ chars if provided). Transition: `active|disabled|rejected → archived`.
- `POST {id}/disable` → `OfferModerationResponse`. Body: `{reason?: string}` (10+ chars if provided). Transition: `active → disabled`.
- `POST {id}/enable` → `OfferModerationResponse`. Body: none. Transition: `disabled → active`.

### Offer detail
- `GET {id}/detail-card` → `AdminV2OfferDetailCardResponse`. Includes service/provider names, queue_status, waiting_hours, code, link, kind, percent_value, fixed_value_minor.

### SLA queue (review-sla)
- `GET review-sla/summary` → `AdminV2OfferReviewSlaSummaryResponse`. Returns `counters` + `items[]`. Each item: `offer_id, service_id, service_title, provider_id, provider_name, created_at, waiting_hours, queue_status`. Query params: `service_id`, `service_ids[]`, `provider_id`, `queue_status[]`, `min_waiting_hours`, `max_waiting_hours`, `only_degraded_services`, `min_overdue_share`, `limit`.
- `GET review-sla/health` → service-level health table. Items include `service_id, service_title, provider_id, provider_name, total_on_review, in_sla, warning, overdue_response, closed_without_response, overdue_share, escalation_recommended`.
- `GET review-sla/providers/health` → provider-level health table. Same shape but per-provider with `services_total`.
- `GET review-sla/dispatch-runs` → log of past dispatch runs. Query: `dispatch_scope`, `status`, `actor_admin_id`, `idempotency_key`, `limit`, `offset`.
- `GET review-sla/providers/dlq` → DLQ entries from failed provider escalation deliveries. Query: `source_run_id`, `channel`, `provider_id`, `exclude_replayed_successes`, `limit`, `offset`.

### SLA ops (write)
- `POST review-sla/dispatch` (header `X-Idempotency-Key`) → triggers offer reminder + auto-close cycle. Response: counts of checked/reminded/auto-closed/escalated.
- `POST review-sla/providers/dispatch` (header `X-Idempotency-Key`) → triggers provider escalation cycle. Response: counts of checked/escalated providers.
- `POST review-sla/providers/dlq/replay` → replays failed deliveries. Body must include `mode: 'dry_run' | 'apply'`. Response carries `replay_run_id` when apply mode.

### Offer status enum (admin-visible)
`on_review | active | disabled | rejected | archived`. `draft` and `scheduled` are provider-side states and never surface to admin.

### Queue status enum
`in_sla | warning | overdue_response | closed_without_response`.

## Page architecture

Three new routes under `(routes)/offers/`:

### `/offers` — SLA queue
- Backed by `GET review-sla/summary`.
- Default query: `queue_status=['overdue_response','warning']`, sort by `waiting_hours` desc (client-side sort over response items).
- Top: counters card (total_on_review, in_sla, warning, overdue_response, closed_without_response_candidates).
- Filters: queue_status multiselect, service_id input, provider_id input, min_waiting_hours, max_waiting_hours, only_degraded_services toggle.
- Table columns: offer_id (link), service (title + id), provider (name + id), created_at, waiting_hours (formatted), queue_status badge.
- Row click → `/offers/{id}`.
- No pagination (server uses `limit` query — keep simple cap at 200, document in code).

### `/offers/[id]` — detail + moderation
- Backed by `GET {id}/detail-card`.
- Top: status badge, queue_status badge, waiting_hours.
- Detail card: offer_title, offer_description, service link, provider link, code, link, kind, percent_value, fixed_value_minor (formatted as currency), start_at, deadline, is_permanent.
- `OfferModerationPanel` — clone of `ServiceModerationPanel` shape (F6 pattern):
  - 5 action buttons: Approve, Reject, Archive, Disable, Enable.
  - Buttons disabled per current status using `offerActionsForStatus`.
  - Disabled tooltip via `offerActionUnavailableReason`.
  - Dialog forms: reject required reason 10+, archive/disable optional reason 10+.
  - `ErrorToast` on action errors (F6 pattern).
- Server actions in `src/app/(routes)/offers/[id]/actions.ts`.

### `/offers/ops` — SLA ops dashboard
- Three sections, each manually refreshable independently:
  1. **Service health** — backed by `GET review-sla/health`. Table: service, totals per queue_status, overdue_share, escalation_recommended badge.
  2. **Provider health** — backed by `GET review-sla/providers/health`. Same table per provider.
  3. **Dispatch runs log** — backed by `GET review-sla/dispatch-runs`. Table: run timestamp, scope, status, actor, idempotency_key, counts.
  4. **DLQ** — backed by `GET review-sla/providers/dlq`. Table: dlq_key, channel, provider, created_at, replay status. Filter: `exclude_replayed_successes` (default on).
- Top of page: three force-dispatch action buttons with confirm dialogs:
  - **Force offer dispatch** → `POST review-sla/dispatch`. UUID generated for `X-Idempotency-Key`.
  - **Force provider dispatch** → `POST review-sla/providers/dispatch`. UUID generated for `X-Idempotency-Key`.
  - **DLQ replay** → two buttons under one dialog: "Dry run" (`mode='dry_run'`) and "Apply" (`mode='apply'`).
- Each section: Refresh button + "Updated Xs ago" indicator. No auto-poll.
- Confirm dialogs spell out side-effects in plain English: "Sends push/email reminders to N speakers" / "Sends escalation notifications to providers".

### Navigation
Add `/offers` link to root layout header (next to `/providers` and `/services`). `/offers/ops` reachable via a "SLA ops" link in the offers list page header (not a top-level header link — it is admin-only deep tool).

## Code structure

```
src/
  lib/
    offers/
      api.ts            # fetchOffersSlaSummary, fetchOfferDetailCard, fetchOfferServiceHealth, fetchOfferProviderHealth, fetchDispatchRuns, fetchDlq, approveOffer, rejectOffer, archiveOffer, disableOffer, enableOffer, forceOfferDispatch, forceProviderDispatch, replayDlq
      types.ts          # OfferStatus, QueueStatus, OFFER_STATUSES, QUEUE_STATUSES, SlaSummary, SlaSummaryItem, SlaCounters, OfferDetailCard, ServiceHealthItem, ProviderHealthItem, DispatchRunLog, DlqItem, force-dispatch response types, type guards
    moderation/
      transitions.ts    # extend with offerActionsForStatus, offerActionUnavailableReason
  app/
    (routes)/
      offers/
        page.tsx                          # SLA queue (server component fetches summary)
        _components/
          OffersTable.tsx
          OffersFilters.tsx
          QueueStatusBadge.tsx
          StatusBadge.tsx                 # reused via offer status
          CountersCard.tsx
        [id]/
          page.tsx                        # detail + moderation panel
          action-types.ts                 # OfferActionState, EMPTY_STATE
          actions.ts                      # 5 server actions
          _components/
            OfferDetail.tsx
            OfferModerationPanel.tsx
        ops/
          page.tsx                        # SLA ops dashboard
          action-types.ts                 # OpsActionState
          actions.ts                      # forceOfferDispatchAction, forceProviderDispatchAction, replayDlqAction
          _components/
            ServiceHealthSection.tsx
            ProviderHealthSection.tsx
            DispatchRunsSection.tsx
            DlqSection.tsx
            ForceDispatchButtons.tsx
            RefreshButton.tsx             # shared per-section, includes "Updated Xs ago"
```

## Data flow

- All read pages are React Server Components: server fetches via `lib/offers/api.ts` using session cookie (existing `lib/auth/session.ts` pattern from F5/F6).
- All writes go through Next.js server actions (existing F6 pattern: `useActionState` + form submit).
- `ErrorToast` surfaces backend error messages from `OfferModerationResponse` and force-dispatch failures (toast already exists in `_components/`).
- Force-dispatch idempotency: server action generates `crypto.randomUUID()` per click, sets `X-Idempotency-Key` header in `api.ts` call. Same key would short-circuit the second click within backend's retention window.
- DLQ replay UX: one confirm dialog with two submit buttons — "Dry run" (`mode='dry_run'`, no extra confirm) and "Apply" (`mode='apply'`, requires a second click on a `data-testid="dlq-replay-apply-confirm"` button inside the same dialog before the action fires). Server action receives `mode` from the submitting button.
- Refresh button is a plain "force re-render" — server actions invalidate path with `revalidatePath('/offers/ops')`.

## Error handling

- Network/non-200 from read endpoints → page renders blank state with retry CTA (mirror F6 services list behavior).
- Validation errors from moderation (e.g. backend rejects a transition the UI thought was allowed) → caught by server action, returned as `ActionState`, surfaced via `ErrorToast` exactly like F6.
- 401 anywhere → existing middleware/session helper redirects to login (no F7-specific work).
- Force-dispatch returns counts even on partial success; UI just shows the result counts. Failures inside the run (delivery errors) surface in the dispatch-runs log table.

## Testing

Playwright spec coverage (mirror F6 tests):
- `tests/offers-moderation.spec.ts` — list page renders, default filter shows overdue+warning, click-through to detail, approve/reject/archive/disable/enable flows trigger correct API calls, disabled buttons match status matrix.
- `tests/offers-moderation-matrix.spec.ts` — exhaustive matrix of (status × action) showing allowed/blocked.
- `tests/offers-ops.spec.ts` — health tables render, force-dispatch confirm dialog appears, idempotency key sent, DLQ replay dry-run vs apply, refresh updates timestamp.
- Unit tests for `lib/moderation/transitions.ts` covering offer matrix (extend existing `tests/moderation-guards.spec.ts`).

MSW handlers in `src/mocks/handlers.ts` for all read endpoints + moderation + force-dispatch + DLQ replay. Fixtures in `src/mocks/fixtures.ts` cover one offer per (status × queue_status) cell plus realistic SLA summary, health, dispatch-runs, DLQ payloads.

## Out of scope for this PR
- Pagination on `/offers` (use `limit=200` cap, document, add later if user count grows).
- WebSocket / SSE live updates (manual refresh only — Q4 decision).
- Bulk actions (approve/reject N at once) — single-row moderation only.
- DLQ replay with per-item selection (replay all matching filter — backend semantics).
- Searching offer by free-text (no backend endpoint for it).
- Editing offer content from admin (read-only beyond moderation status changes).

## Migration notes
- No backend changes — all endpoints already shipped P3.1–P3.5.
- No DB changes.
- Add header nav link to `/offers` only after route compiles and tests green.
- Follow `eventup_admin_namespace_shift` memory: use `/eventup-admin/v1/*` paths, not `/admin/v2/*`. OpenAPI on PROD still shows `/admin/v2/*` aliases — schemas are equivalent, but the frontend must hit the new namespace per nginx config.

## Verification before merge
- `pnpm typecheck && pnpm lint && pnpm test` green.
- Playwright `tests/offers-*.spec.ts` green.
- Manual smoke on staging (api-staging or local with MSW): walk list → detail → approve action → ops page → force-dispatch confirm shown → DLQ replay dry-run.
- Self-review the diff per CLAUDE.md.
- Auto-merge with `--squash --delete-branch` if CI green and self-review clean.
