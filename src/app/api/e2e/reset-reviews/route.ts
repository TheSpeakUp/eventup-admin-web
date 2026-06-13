// POST /api/e2e/reset-reviews — test-only hook to reset the in-memory mock
// reviews store back to its seeded fixtures.
//
// The e2e run shares ONE in-memory MSW store across every spec file (single
// `next start`, workers:1). The reviews moderation specs mutate seeded rows
// (hide review #1, hide #3's reply) without restoring them, so without a reset
// that state leaks across reruns / retries / sibling specs and flakes the
// read-published-state tests. tests/reviews.spec.ts calls this in beforeEach.
//
// Guarded behind the mock-backend flag: in a real deployment the env is unset,
// the dynamic import never runs, and the route 404s — no prod surface.

import { NextResponse } from "next/server";

export async function POST(): Promise<NextResponse> {
  // Bracket access on purpose: Next inlines `process.env.NEXT_PUBLIC_*` at
  // build time, which would bake the flag's build-time value into the bundle.
  // Reading it dynamically keeps this a runtime check against the server's
  // actual env (the e2e server is started with the flag; prod is not).
  if (process.env["NEXT_PUBLIC_USE_MOCK_BACKEND"] !== "true") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const { resetReviewsStore } = await import("@/mocks/reviews-store");
  resetReviewsStore();
  return NextResponse.json({ ok: true });
}
