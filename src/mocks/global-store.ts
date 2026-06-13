// Anchor mock-store state on `globalThis` instead of a plain module-level
// binding. Next 16 + Turbopack can compile a `src/mocks/*-store.ts` module into
// more than one server chunk — the MSW node-server bundle that serves reads
// (booted from instrumentation.ts) vs. the route-handler bundle that triggers a
// reset (src/app/api/e2e/reset). Each chunk would otherwise get its own copy of
// the backing Map, so a reset performed in one chunk would be invisible to the
// reads served from another, and the e2e reset would silently no-op.
//
// Routing every store's backing collection through this helper makes all chunks
// share ONE instance. Reset functions must mutate that instance IN PLACE
// (map.clear() + re-seed), never reassign the local binding, so the shared
// reference stays valid across chunks.
export function globalSingleton<T>(key: string, make: () => T): T {
  const store = globalThis as unknown as Record<string, T>;
  return (store[key] ??= make());
}
