import type { ProviderDetail, ProviderStatus } from "@/lib/providers/types";
import { buildFixtureProviders } from "./providers-fixtures";

const providers = new Map<number, ProviderDetail>();

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
