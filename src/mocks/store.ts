import type { ServiceDetail, ServiceStatus } from "@/lib/services/types";
import { buildFixtureServices } from "./fixtures";

const services = new Map<number, ServiceDetail>();

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
