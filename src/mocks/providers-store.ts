import type {
  ProviderDetail,
  ProviderFieldsPatch,
  ProviderStatus,
} from "@/lib/providers/types";
import { buildFixtureProviders } from "./providers-fixtures";
import { globalSingleton } from "./global-store";

const providers = globalSingleton(
  "__eventupProviders",
  () => new Map<number, ProviderDetail>(),
);

function ensureSeed(): void {
  if (providers.size > 0) return;
  for (const prv of buildFixtureProviders()) {
    providers.set(prv.id, prv);
  }
}

export function resetProvidersStore(): void {
  providers.clear();
  ensureSeed();
}

export function getAllProviders(): ProviderDetail[] {
  ensureSeed();
  return Array.from(providers.values());
}

export function getProviderById(id: number): ProviderDetail | null {
  ensureSeed();
  return providers.get(id) ?? null;
}

export function setProviderStatus(
  id: number,
  status: ProviderStatus,
  opts: { verification_message?: string | null; block_reason?: string | null } = {},
): ProviderDetail | null {
  const prv = getProviderById(id);
  if (!prv) return null;
  const updated: ProviderDetail = {
    ...prv,
    verification_status: status,
    verification_message:
      opts.verification_message !== undefined ? opts.verification_message : prv.verification_message,
    block_reason: opts.block_reason !== undefined ? opts.block_reason : prv.block_reason,
    updated_at: new Date().toISOString(),
  };
  providers.set(id, updated);
  return updated;
}

export function deleteProviderById(id: number): boolean {
  ensureSeed();
  return providers.delete(id);
}

// NON-nullable provider columns — an explicit `null` here is a client bug the
// backend rejects with a 400; the mock mirrors that.
const PROVIDER_NON_NULLABLE = new Set<keyof ProviderFieldsPatch>([
  "name",
  "account_currency",
]);

/**
 * Apply a partial DATA-field patch (M7). Only keys PRESENT on `patch` are
 * touched (omit = unchanged); an explicit `null` clears a nullable column.
 * Returns `"not_found"` for an unknown id and `"invalid"` when an explicit
 * `null` targets a non-nullable column (so the handler can answer 404 / 400).
 */
export function patchProviderFields(
  id: number,
  patch: ProviderFieldsPatch,
): ProviderDetail | "not_found" | "invalid" {
  const prv = getProviderById(id);
  if (!prv) return "not_found";
  for (const key of PROVIDER_NON_NULLABLE) {
    if (key in patch && patch[key] === null) return "invalid";
  }
  const updated: ProviderDetail = {
    ...prv,
    ...patch,
    updated_at: new Date().toISOString(),
  };
  providers.set(id, updated);
  return updated;
}
