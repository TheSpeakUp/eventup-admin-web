import type { ProviderStatus } from "@/lib/providers/types";
import type { ServiceStatus } from "@/lib/services/types";

export type ServiceActionKind =
  | "approve"
  | "reject"
  | "unpublish"
  | "republish"
  | "archive";

export type ProviderActionKind = "verify" | "block" | "unblock" | "delete";

const SERVICE_REQUIRED_STATUSES: Record<ServiceActionKind, ServiceStatus[]> = {
  approve: ["on_review"],
  reject: ["on_review"],
  unpublish: ["published"],
  republish: ["unpublished"],
  archive: ["published", "unpublished"],
};

const PROVIDER_REQUIRED_STATUSES: Record<ProviderActionKind, ProviderStatus[]> = {
  verify: ["pending"],
  block: ["pending", "verified"],
  unblock: ["blocked"],
  delete: ["pending", "verified", "blocked"],
};

export function serviceActionsForStatus(
  status: ServiceStatus,
): ReadonlySet<ServiceActionKind> {
  const out = new Set<ServiceActionKind>();
  for (const [kind, statuses] of Object.entries(SERVICE_REQUIRED_STATUSES) as [
    ServiceActionKind,
    ServiceStatus[],
  ][]) {
    if (statuses.includes(status)) out.add(kind);
  }
  return out;
}

export function providerActionsForStatus(
  status: ProviderStatus,
): ReadonlySet<ProviderActionKind> {
  const out = new Set<ProviderActionKind>();
  for (const [kind, statuses] of Object.entries(
    PROVIDER_REQUIRED_STATUSES,
  ) as [ProviderActionKind, ProviderStatus[]][]) {
    if (statuses.includes(status)) out.add(kind);
  }
  return out;
}

export function serviceActionUnavailableReason(
  kind: ServiceActionKind,
  status: ServiceStatus,
): string {
  const allowed = SERVICE_REQUIRED_STATUSES[kind];
  return `${kind[0]?.toUpperCase()}${kind.slice(1)} applies only when status is ${allowed.join(" or ")} (current: ${status}).`;
}

export function providerActionUnavailableReason(
  kind: ProviderActionKind,
  status: ProviderStatus,
): string {
  const allowed = PROVIDER_REQUIRED_STATUSES[kind];
  return `${kind[0]?.toUpperCase()}${kind.slice(1)} applies only when status is ${allowed.join(" or ")} (current: ${status}).`;
}
