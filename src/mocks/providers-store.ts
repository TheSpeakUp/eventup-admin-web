import type { ProviderDetail, ProviderStatus } from "@/lib/providers/types";
import { buildFixtureProviders } from "./providers-fixtures";

const providers = new Map<string, ProviderDetail>();

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

export function getProviderById(id: string): ProviderDetail | null {
  ensureSeed();
  return providers.get(id) ?? null;
}

export function setProviderStatus(
  id: string,
  status: ProviderStatus,
  opts: { note?: string | null; moderator?: string } = {},
): ProviderDetail | null {
  const prv = getProviderById(id);
  if (!prv) return null;
  const updated: ProviderDetail = {
    ...prv,
    status,
    last_moderation_note: opts.note ?? null,
    last_moderator_email: opts.moderator ?? "admin@example.com",
    updated_at: new Date().toISOString(),
  };
  providers.set(id, updated);
  return updated;
}
