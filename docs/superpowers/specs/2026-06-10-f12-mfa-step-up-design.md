# F12 — MFA Step-Up: unblock backend + admin-web UI

**Date:** 2026-06-10
**Status:** Approved (design), pending implementation
**Repos:** `eventup-backend` (main) + `eventup-admin-web` (this repo)

## Goal

Activate the already-implemented backend MFA step-up mechanism for a chosen set of
high-blast-radius admin actions, and build the admin-web UI that intercepts the
backend's `step_up_required` 403, collects an email OTP, and transparently retries
the original action once the step-up grant is minted.

## Background (verified on `origin/main`)

The backend step-up machinery shipped in PR #61 and is live on `origin/main`:

- OTP endpoints: `POST /eventup-admin/v1/auth/mfa/challenge`, `POST /eventup-admin/v1/auth/mfa/verify`.
- Enforcement dependency `require_step_up(perm)` is **already wired** onto mutation
  endpoints in `src/eventup/admin/marketplace/`: categories, attribute-definitions,
  category-bindings, field-edit, and both dispatch endpoints (`offer_dispatch_views`).
- The dependency **short-circuits to a no-op** while the requested permission is not
  in `STEP_UP_REQUIRED_PERMISSIONS` (`src/eventup/admin/access/step_up_policy.py`),
  which is currently `set()`.
- Grants live in Redis keyed on the access token's `jti` claim, TTL 10 min.
  Challenge TTL 5 min, 6-digit code, max 5 verify attempts.
- Error contract (verbatim `detail` strings):
  - `403 step_up_required` — no grant for the requested permission.
  - `503 step_up_service_unavailable` — Redis unavailable.
  - `401 step_up_verify_rejected` / `step_up_challenge_rejected` — bad code / issue failure.
- `admin_mgmt_views` (admin-team management) is gated by `ADMIN_USERS_MGMT` via
  `get_current_admin_principal(_PERM)` but has **no** `require_step_up` wiring yet.

### admin-web facts (verified)

- `src/lib/api.ts` `apiFetch<T>()` is **server-only**. It retries once on 401 via
  `/auth/refresh`, redirects to `/login` on terminal 401 unless `redirectOn401:false`.
  Returns `ApiFetchResult<T> = {ok:true,status,data} | {ok:false,status,message}`.
- Mutations run through Server Actions returning a per-route `ActionState`
  (offers: `{ ok:boolean; error:string|null }`, `src/app/(routes)/offers/[id]/action-types.ts`).
- Gated frontend call-sites:
  - `forceOfferDispatch(idempotencyKey)` → `…/review-sla/dispatch` (`OFFERS_DISPATCH`).
  - `forceProviderDispatch(idempotencyKey)` → `…/review-sla/providers/dispatch` (`PROVIDER_ESCALATIONS_DISPATCH`).
  - `replayDlq(body)` → `…/review-sla/providers/dlq/replay` (`PROVIDER_ESCALATIONS_DISPATCH`).
    All three already pass `redirectOn401:false` (`src/lib/offers/api.ts`).
  - Admin-team mutations: `src/app/(routes)/admins/actions.ts` (createInvitation,
    revokeInvitation), `src/app/(routes)/admins/[id]/actions.ts` (update role, etc.).
- No middleware.ts, no React auth context. Session via httpOnly cookies, decoded
  server-side per page (`src/lib/auth/session.ts`). UI primitives: native `<dialog>`
  (see `OfferModerationPanel.tsx`), `ErrorToast`, `useActionState` forms. MSW mocks +
  mock auth for Playwright e2e (`tests/`, `src/mocks/handlers.ts`, `src/lib/auth/mock.ts`).

## Scope decision

**Gate "privileges + dispatches"** (user decision 2026-06-10). Content writes
(`SERVICES_MODERATE`/`PROVIDERS_RISK`) are **deliberately NOT gated** — too frequent,
OTP fatigue. Permissions to add to `STEP_UP_REQUIRED_PERMISSIONS`:

| Permission | Gates | Backend work |
|---|---|---|
| `ADMIN_MARKETPLACE_OFFERS_DISPATCH` | offer SLA dispatch | add to set (dep already wired) |
| `ADMIN_MARKETPLACE_PROVIDER_ESCALATIONS_DISPATCH` | provider dispatch + DLQ replay | add to set (dep already wired) |
| `ADMIN_USERS_MGMT` | admin-team management | add to set **+ wire `require_step_up` on 5 endpoints** |

## Chosen approach: centralized client guard (reactive on 403)

Rejected alternatives: (2) per-action inline handling — duplicates modal + challenge/
verify logic across ~4 call-sites; (3) proactive pre-gate — needs a non-existent
"has-grant" backend endpoint and adds OTP friction even when the action would fail
validation. The centralized guard matches the backend's reactive-403 model.

### Flow

1. User triggers a gated action (e.g. force offer dispatch).
2. Server Action calls `apiFetch(...)` → backend returns `403 step_up_required`.
3. `apiFetch` maps it to `{ ok:false, status:403, message, stepUp:{ permission } }`.
4. Server Action returns `ActionState` with `stepUp:{ permission }` set.
5. The `useStepUp` hook (wrapping the action) detects `stepUp`, stashes the exact
   retry thunk, and opens `<StepUpModal>` via `StepUpProvider`.
6. Modal: `requestStepUpChallenge([permission])` → backend emails OTP, returns
   `challenge_id` + masked `delivery_hint` + `expires_in_seconds`.
7. User enters 6-digit code → `verifyStepUp(challenge_id, code)` → backend mints the
   Redis grant (same `jti`).
8. On verify success, the hook re-invokes the stashed thunk. Grant now exists →
   backend proceeds → action completes. Modal closes.

## Components & contracts

### Backend (eventup-backend → main)

- `step_up_policy.py`: `STEP_UP_REQUIRED_PERMISSIONS = { OFFERS_DISPATCH, PROVIDER_ESCALATIONS_DISPATCH, ADMIN_USERS_MGMT }`.
- `admin_mgmt_views.py`: add `_step_up: AdminPrincipal = Depends(require_step_up(ADMIN_USERS_MGMT))`
  to the 5 mutation endpoints: `create_invitation`, `revoke_invitation`,
  `update_admin`, `grant_reviewer_scope`, `revoke_reviewer_scope`. Read endpoints
  (`list_admins`, `list_invitations`, `get_admin`) stay ungated. `accept_invitation`
  is a public/token endpoint — NOT gated.
- Tests: extend `test_admin_step_up_views.py` / mgmt view tests to assert 403
  `step_up_required` on the 5 mgmt mutations without a grant, and success with a grant.
- **Deploy prerequisite:** Redis must be configured in the prod env, else gated
  actions return `503 step_up_service_unavailable`. Verify before/after deploy.

### admin-web — `apiFetch` contract (`src/lib/api.ts`)

Extend the failure variant (backwards-compatible — existing `.ok` checks unaffected):

```ts
export type ApiFetchResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; message: string; stepUp?: { permission?: string } };
```

On `res.status === 403`, parse the backend error envelope. Detection reads
`body.error.meta.original_detail ?? body.detail` and checks if it equals
`"step_up_required"`. If so, return `{ ok:false, status:403, message, stepUp:{ permission } }`.
The permission is read from the response body if present (backend may include the required
permission; if not, leave `permission` undefined and the challenge requests the call-site's
declared permission — see hook). 503 with `step_up_service_unavailable` returns the
normal failure with its message (surfaced as "MFA unavailable"). 401 path unchanged.

### admin-web — shared ActionState step-up signal

Add an optional field to each route's `ActionState` (offers, admins):

```ts
export type ActionState = { ok: boolean; error: string | null; stepUp?: { permission?: string } };
```

Server actions that call a gated endpoint: when `result.ok === false && result.stepUp`,
return `{ ok:false, error:null, stepUp: result.stepUp }` instead of a plain error.

### admin-web — step-up server actions (`src/app/step-up/actions.ts`)

```ts
"use server";
requestStepUpChallenge(permissions: string[]):
  Promise<{ ok:true; challengeId:string; deliveryHint:string; expiresInSeconds:number }
         | { ok:false; error:string }>
verifyStepUp(challengeId: string, code: string):
  Promise<{ ok:true } | { ok:false; error:string; attemptsExceeded?:boolean }>
```

Both call `apiFetch` against `/eventup-admin/v1/auth/mfa/challenge|verify` with
`redirectOn401:false`. `verifyStepUp` maps `step_up_verify_rejected` to a friendly
"invalid code"; detects attempt-exhaustion message to disable further input.

### admin-web — client guard

- `src/app/_components/step-up/StepUpProvider.tsx` (client): context holding modal
  open state, current `{ permission, deliveryHint, challengeId }`, and the pending
  retry thunk. Mounted once in `src/app/(routes)/layout.tsx` wrapping children.
- `src/app/_components/step-up/StepUpModal.tsx` (client): native `<dialog>` (mirror
  `OfferModerationPanel` pattern). Shows masked delivery hint, 6-digit code input
  (`^\d{6}$`), 5-min countdown, resend button (re-issues challenge), attempt feedback,
  cancel. On verify success calls the provider to run the stashed retry then closes.
- `src/app/_components/step-up/useStepUp.ts` (client hook): wraps a callable that
  returns an `ActionState`-like result. Signature:
  ```ts
  const run = useStepUp(actionThunk /* () => Promise<ActionState> */, declaredPermission);
  ```
  `run()` invokes the thunk; if the result carries `stepUp`, it stores the SAME thunk
  as the retry, opens the modal (challenge uses `result.stepUp.permission ??
  declaredPermission`), and resolves only after the post-verify retry. Returns the
  final (non-step-up) result to the caller.

### Call-site wiring

- Offer/provider dispatch + DLQ replay (in the offers/quality UI components that call
  `forceOfferDispatch` / `forceProviderDispatch` / `replayDlq`): route their action
  invocation through `useStepUp`. **Idempotency:** the `X-Idempotency-Key` is generated
  ONCE before the first invocation and captured in the retry thunk so the retry reuses
  the same key (the 403 fires in the dependency before the handler, so the dispatch did
  not execute — but a stable key is belt-and-suspenders against any double-fire).
- Admin-team forms (`admins/actions.ts`, `admins/[id]/actions.ts`): the form
  components route submission through `useStepUp` with `declaredPermission =
  "admin.users.mgmt"`.

### Mocks + e2e

- `src/mocks/handlers.ts`: add MSW handlers for `POST …/auth/mfa/challenge`
  (returns challenge_id + masked hint) and `…/auth/mfa/verify` (accepts a fixed test
  code, rejects others). Add a mock-backend toggle so a gated endpoint returns
  `403 step_up_required` until a verify has succeeded in the session, then success.
- `tests/step-up.spec.ts`: e2e — trigger a gated dispatch, assert modal appears, enter
  code, assert original action completes. Helper in `tests/helpers/` for the OTP flow.

## Edge cases

- **jti refresh race:** if the access token refreshes (new `jti`) between verify and
  retry, the grant is orphaned → retry sees `step_up_required` again. Mitigation: do
  not force-refresh inside the flow; if a second consecutive `step_up_required` occurs
  for the same action, show an error ("session changed, try again") and stop — never
  loop. The hook caps step-up retries at 1.
- **Cancel:** closing the modal leaves the original action un-executed; the caller
  receives a `{ ok:false, error:null }` (no-op) result — clean, no side effects.
- **503 step_up_service_unavailable:** surfaced as a clear "MFA temporarily
  unavailable" error in the modal/toast; no retry loop.
- **Attempt exhaustion / expiry:** disable code input, prompt resend (new challenge).

## Testing

- Backend: pytest on the new mgmt-endpoint step-up gating + existing step-up suite.
- admin-web: Playwright e2e (`step-up.spec.ts`), plus type-check (`next build`) and
  lint. Verification commands: `npm run lint` + `npm run build` + `npx playwright test`.

## Delivery

Two PRs:
1. **eventup-backend → main:** policy set + mgmt-view wiring + tests.
2. **eventup-admin-web → main:** apiFetch contract, step-up actions/provider/modal/hook,
   call-site wiring, mocks + e2e.

Backend PR lands and deploys first (frontend's reactive handling is inert until the
backend actually returns `step_up_required`). Verify Redis present in target env.
