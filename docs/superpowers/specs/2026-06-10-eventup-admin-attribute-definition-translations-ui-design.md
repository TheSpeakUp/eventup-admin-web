# EventUp Admin — Attribute-Definition Translations UI (F10)

**Date:** 2026-06-10
**Repo:** `eventup-admin-web` (Next.js 16, React 19, Tailwind v4, App Router, pnpm)
**Branch policy:** feature PR → `main` (auto-deploys to admin-marketplace.speakup.ltd). `main` merge needs explicit user confirm-this-turn + live smoke.
**Scope decision:** the translations sub-resource deferred from F9. Lives on its **own sub-route** `/attribute-definitions/[key]/translations` (user-approved 2026-06-10), reached via a "Manage translations" link on the attribute-definition detail page.

## Why

F9 shipped attribute-definitions CRUD (PR #25). The backend exposes a per-definition translation sub-resource (localized labels/descriptions for the attribute itself + per-enum-value labels) that the marketplace renders by user locale. This PR adds the operator UI to read + replace that translation set. Builds directly on the F9 feature and its template (`src/lib/attribute-definitions/`, `src/app/(routes)/attribute-definitions/`, `src/mocks/attribute-definitions-*.ts`).

## Backend contract (verified `eventup-backend` `origin/main`, `src/eventup/admin/marketplace/translations_views.py` + `attribute_registry_admin_schemas.py`)

Namespace `/eventup-admin/v1/marketplace`.

| Verb | Path | Permission | Role floor | Audit |
|---|---|---|---|---|
| GET | `/attribute-definitions/{attribute_key}/translations` | `ADMIN_MARKETPLACE_READ` | MODERATOR+ | none |
| PUT | `/attribute-definitions/{attribute_key}/translations` | `ADMIN_MARKETPLACE_SERVICES_MODERATE` | MODERATOR+ | yes |

- **PUT is a full-replace upsert** (the request body is the complete set; empty lists clear everything). **No DELETE** — removing all translations = PUT with empty arrays.
- Step-up wraps PUT but `STEP_UP_REQUIRED_PERMISSIONS = set()` → plain permission check (no MFA UI), same as F9/categories.
- **No delete-gating fork** (there is no destructive op) — both endpoints are MODERATOR+. Simpler than F9: every admin role can read + edit; no ADMIN-only branch.

**`MarketplaceAttributeDefinitionTranslationsRead` (GET response + PUT response):**
- `attribute_key: str`
- `field_translations: FieldTranslation[]`
- `enum_value_translations: EnumTranslation[]`

**`FieldTranslation` (`MarketplaceAttributeDefinitionTranslationItem`):** `locale`(str, 2–10, req), `label`(str, 1–200, req), `description`(str|None, ≤4000). Unique `locale` across the list (backend `ensure_unique_field_locales`).

**`EnumTranslation` (`MarketplaceAttributeDefinitionEnumTranslationItem`):** `locale`(str, 2–10, req), `enum_value`(str, 1–255, req), `label`(str, 1–200, req). Unique `(locale, enum_value)` pair across the list (backend `ensure_unique_enum_pairs`).

**`MarketplaceAttributeDefinitionTranslationsUpsertRequest` (PUT body):** `{ field_translations: FieldTranslation[], enum_value_translations: EnumTranslation[] }` (both default to empty list).

- `locale` is normalized server-side (`normalize_locale_candidate`); an unsupported locale → error surfaced via the generic envelope (`result.message` / `original_detail`). No fixed supported-locale enum on the FE.

## Architecture (extend F9)

### Route & files — `src/app/(routes)/attribute-definitions/[key]/translations/`
- `page.tsx` — server component. Fetches GET translations (+ the definition via `getAttributeDefinition` for the heading/context, and to 404 cleanly if the key is unknown). Renders `<TranslationsEditor>` pre-filled with the current set. Page-level 403 → "requires higher role" fail-closed (mirror F9). Heading: the attribute key + "Translations".
- `actions.ts` — `"use server"`: a single `saveTranslationsAction(prev, formData)` that reads two hidden JSON fields (`field_translations`, `enum_value_translations`), Zod-validates, calls `putAttributeDefinitionTranslations(key, payload)`, `revalidatePath`, returns `ActionState`. Reuses `ActionState`/`EMPTY_STATE` from the existing `src/app/(routes)/attribute-definitions/action-types.ts` (import `../../action-types`).
- `_components/TranslationsEditor.tsx` — `"use client"`. Holds two arrays in `useState` (field rows + enum rows), pre-seeded from props. Renders:
  - **Field translations** section: one row per entry with visible inputs `[locale | label | description]`, an "Add locale" button, a "Remove" per row.
  - **Enum-value translations** section: one row per entry with `[locale | enum_value | label]`, "Add enum translation" + "Remove".
  - Two hidden inputs (`field_translations`, `enum_value_translations`) carrying `JSON.stringify(rows)`, kept in sync with state (derived at render — same React-19-safe idiom as F9 `DescriptorEditor`: state settles on change, submit click stays clean).
  - Client-side guard: duplicate `locale` (field) / duplicate `(locale, enum_value)` (enum) shown inline before submit (mirrors backend; backend remains source of truth).
  - Submit via the form action; inline `state.error` on failure; success stays on page with refreshed values (key-remount on the page so revalidated GET resets the editor).

### Detail-page link — `src/app/(routes)/attribute-definitions/[key]/page.tsx` (small modification)
Add a `<Link href={/attribute-definitions/{key}/translations}>` "Manage translations" near the form (visible to all roles — all hold READ+MODERATE). No other change to the detail page.

### API client — extend `src/lib/attribute-definitions/{types,api}.ts`
- `types.ts`: add `AttributeFieldTranslation`, `AttributeEnumTranslation`, `AttributeDefinitionTranslations` (read), `AttributeDefinitionTranslationsPayload` (upsert; same shape).
- `api.ts`: add
  - `getAttributeDefinitionTranslations(key)` → GET `/{key}/translations`.
  - `putAttributeDefinitionTranslations(key, payload)` → PUT `/{key}/translations` (`redirectOn401:false`).

### Server action validation (Zod)
- `field_translations`: array of `{locale: str(2–10), label: str(1–200), description: str(≤4000).optional/nullable}`; reject duplicate locales.
- `enum_value_translations`: array of `{locale: str(2–10), enum_value: str(1–255), label: str(1–200)}`; reject duplicate (locale, enum_value).
- Malformed hidden JSON → inline "invalid translations data". Trim empties (a fully-blank row is dropped before submit). Empty arrays are valid (clears the set).

### Mock backend (MSW) — extend `src/mocks/attribute-definitions-store.ts` + `handlers.ts`
- Store: add a `Map<string, {field_translations, enum_value_translations}>` keyed by attribute `key`. `getTranslations(key)` returns the set (or empty arrays). `putTranslations(key, payload)` replaces it (404 if the definition key doesn't exist). Seed: one fixture definition (e.g. `cuisine`) with a couple of field translations + one enum translation so the GET-render test has data.
- Handlers: `GET ${BASE}/:key/translations` and `PUT ${BASE}/:key/translations`. **Both must be registered AFTER the literal `/list` but the `:key/translations` paths are more specific than `:key` — register the `/translations` routes BEFORE the bare `/:key` GET/PUT/DELETE** so MSW matches them first. Enforce duplicate-locale / duplicate-pair → 400 with `original_detail` (parity), so the FE error path is exercised.

### Tests — `tests/attribute-definitions-translations.spec.ts`
- GET render: open a seeded definition's translations page → existing field + enum rows visible.
- Add + persist: add a field row (locale+label) and an enum row → save → reload → rows persisted.
- Remove: remove a row → save → reload → gone.
- Duplicate locale → inline error (client guard), and/or backend 400 surfaced.
- Link: detail page "Manage translations" navigates to the sub-route.

**Test isolation:** shared in-memory store across the e2e run (workers:1, no reset). Translation mutation tests use their OWN definition (create it in-test or use a dedicated seeded key NOT asserted by F9 list/crud specs), never the keys other specs assert on.

## Verification
- `npm run lint` — clean.
- `npm run build` (mock env) — TS type-check + the new route registered.
- `npm run test:e2e` — new spec green, no regression in F9/categories/etc.
- CI (`ci.yml`, ubuntu-latest) gates; `deploy.yml` auto-deploys on merge.
- Live smoke at admin-marketplace.speakup.ltd as `shelp.dev@gmail.com` — open an attribute's translations, add/edit/remove, save, verify persistence (the live backend translations endpoints are deployed — confirmed alongside the F9 delete fix #110).

## Pre-code gate
AGENTS.md: the Next 16 / React 19 form patterns are proven by F9 (same idioms reused). `node_modules/next/dist/docs/` is absent in this checkout — fall back to context7 only if a genuinely new pattern is needed (none expected; this mirrors F9 `DescriptorEditor` + dynamic rows).

## Out of scope (separate PRs)
Category↔attribute bindings panel, registry snapshots / rollback / revalidation viewer (F13), MFA step-up UI (F12), supported-locale enum/picker (free-type locale for now — backend normalizes/validates).
