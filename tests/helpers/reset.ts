import { expect, type APIRequestContext } from "@playwright/test";

// Reset every mutable in-memory mock store back to its seeded fixtures. The e2e
// run shares ONE store set across all specs (single `next start`, workers:1), so
// any spec that mutates seeded rows must call this in beforeEach to stay
// deterministic across order / reruns / retries. Hits the test-only
// /api/e2e/reset route (see src/app/api/e2e/reset/route.ts).
export async function resetMockStores(request: APIRequestContext): Promise<void> {
  const res = await request.post("/api/e2e/reset");
  expect(res.ok()).toBeTruthy();
}
