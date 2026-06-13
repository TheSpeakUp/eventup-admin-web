// POST /api/e2e/reset — test-only hook that resets every mutable in-memory mock
// store back to its seeded fixtures.
//
// The e2e run shares ONE in-memory MSW store set across every spec file (single
// `next start`, workers:1). Specs that mutate seeded rows (moderate a service,
// refund a payment, cancel a campaign, hide a review, …) would otherwise leak
// that state across retries / reruns / sibling specs and flake the tests that
// assert on seeded baseline state. The mutating specs call this in beforeEach so
// each test (and each retry) starts from a known clean state.
//
// Every store reached here is anchored on `globalThis` (see src/mocks/
// global-store.ts), which is what lets a reset triggered from this route
// handler's chunk actually affect the reads served from the MSW node-server
// chunk. Guarded behind the mock-backend flag: in a real deployment the env is
// unset, the dynamic import never runs, and the route 404s — no prod surface.

import { NextResponse } from "next/server";

export async function POST(): Promise<NextResponse> {
  // Bracket access on purpose: Next inlines `process.env.NEXT_PUBLIC_*` at build
  // time. Reading it dynamically keeps this a runtime check against the server's
  // actual env (the e2e server is started with the flag; prod is not).
  if (process.env["NEXT_PUBLIC_USE_MOCK_BACKEND"] !== "true") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const [
    { resetStore },
    { resetProvidersStore },
    { resetOffersStore },
    { resetPaymentsStore },
    { resetQualityStore },
    { resetPromotionsStore },
    { resetRegistrySnapshotsStore },
    { resetAdminsStore },
    { resetReviewsStore },
    { resetPromoCodesStore },
    { resetCategoriesStore },
    { resetAttributeDefinitionsStore },
    { resetCategoryBindingsStore },
  ] = await Promise.all([
    import("@/mocks/store"),
    import("@/mocks/providers-store"),
    import("@/mocks/offers-store"),
    import("@/mocks/payments-store"),
    import("@/mocks/quality-store"),
    import("@/mocks/promotions-store"),
    import("@/mocks/registry-store"),
    import("@/mocks/admins-store"),
    import("@/mocks/reviews-store"),
    import("@/mocks/promo-codes-store"),
    import("@/mocks/categories-store"),
    import("@/mocks/attribute-definitions-store"),
    import("@/mocks/category-bindings-store"),
  ]);

  resetStore();
  resetProvidersStore();
  resetOffersStore();
  resetPaymentsStore();
  resetQualityStore();
  resetPromotionsStore();
  resetRegistrySnapshotsStore();
  resetAdminsStore();
  resetReviewsStore();
  resetPromoCodesStore();
  resetCategoriesStore();
  resetAttributeDefinitionsStore();
  resetCategoryBindingsStore();

  return NextResponse.json({ ok: true });
}
