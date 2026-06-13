import type {
  ServiceDetail,
  ServiceFieldsPatch,
  ServiceStatus,
} from "@/lib/services/types";
import { buildFixtureServices } from "./fixtures";
import { globalSingleton } from "./global-store";

const services = globalSingleton(
  "__eventupServices",
  () => new Map<number, ServiceDetail>(),
);

function ensureSeed(): void {
  if (services.size > 0) return;
  for (const svc of buildFixtureServices()) {
    services.set(svc.id, svc);
  }
}

export function resetStore(): void {
  services.clear();
  ensureSeed();
}

export function getAll(): ServiceDetail[] {
  ensureSeed();
  return Array.from(services.values());
}

export function getById(id: number): ServiceDetail | null {
  ensureSeed();
  return services.get(id) ?? null;
}

export function setStatus(id: number, status: ServiceStatus): ServiceDetail | null {
  const svc = getById(id);
  if (!svc) return null;
  const updated: ServiceDetail = {
    ...svc,
    status,
    updated_at: new Date().toISOString(),
  };
  services.set(id, updated);
  return updated;
}

// NON-nullable service columns — an explicit `null` here is a client bug the
// backend rejects with a 400; the mock mirrors that.
const SERVICE_NON_NULLABLE = new Set<keyof ServiceFieldsPatch>([
  "title",
  "recipient_type",
  "remote_available",
  "pricing_type",
  "publication_discount_enabled",
]);

/**
 * Apply a partial DATA-field patch (M7). Only keys PRESENT on `patch` are
 * touched (omit = unchanged); an explicit `null` clears a nullable column.
 * Returns `"not_found"` for an unknown id and `"invalid"` when an explicit
 * `null` targets a non-nullable column (so the handler can answer 404 / 400).
 */
export function patchServiceFields(
  id: number,
  patch: ServiceFieldsPatch,
): ServiceDetail | "not_found" | "invalid" {
  const svc = getById(id);
  if (!svc) return "not_found";
  for (const key of SERVICE_NON_NULLABLE) {
    if (key in patch && patch[key] === null) return "invalid";
  }
  const updated: ServiceDetail = {
    ...svc,
    ...patch,
    updated_at: new Date().toISOString(),
  };
  services.set(id, updated);
  return updated;
}
