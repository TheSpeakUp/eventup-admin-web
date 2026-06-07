import type { ServiceDetail, ServiceStatus } from "@/lib/services/types";
import { buildFixtureServices } from "./fixtures";

const services = new Map<string, ServiceDetail>();

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

export function getById(id: string): ServiceDetail | null {
  ensureSeed();
  return services.get(id) ?? null;
}

export function setStatus(
  id: string,
  status: ServiceStatus,
  opts: { note?: string | null; moderator?: string } = {},
): ServiceDetail | null {
  const svc = getById(id);
  if (!svc) return null;
  const updated: ServiceDetail = {
    ...svc,
    status,
    last_moderation_note: opts.note ?? null,
    last_moderator_email: opts.moderator ?? "admin@example.com",
    updated_at: new Date().toISOString(),
  };
  services.set(id, updated);
  return updated;
}
