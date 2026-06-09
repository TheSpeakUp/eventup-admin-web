export const PROVIDER_STATUSES = [
  "pending",
  "verified",
  "blocked",
  "canceled",
] as const;

export type ProviderStatus = (typeof PROVIDER_STATUSES)[number];

export function isProviderStatus(value: string): value is ProviderStatus {
  return (PROVIDER_STATUSES as readonly string[]).includes(value);
}

export type ProviderListItem = {
  id: number;
  name: string;
  verification_status: ProviderStatus;
  location_id: number | null;
  services_count: number;
  active_offers_count: number;
  created_at: string;
  updated_at: string;
};

export type ProviderDetail = ProviderListItem & {
  // Resolved location label (backend PR #93) — detail-only; null when unset/unsynced.
  location_name: string | null;
  description: string | null;
  contact_email: string | null;
  phone: string | null;
  website: string | null;
  verification_message: string | null;
  block_reason: string | null;
};

export type ProviderCursorPage = {
  items: ProviderListItem[];
  next_last_id: number | null;
  has_more: boolean;
  count: number;
};

export type ProviderListQuery = {
  search?: string;
  last_id?: number;
  limit?: number;
};

export type ProviderModerationResponse = {
  provider_id: number;
  new_status: ProviderStatus;
  message_key: string | null;
  message: string;
};

export type ProviderStats = {
  provider_id: number;
  total_services: number;
  services_by_status: Record<string, number>;
  active_offers_count: number;
};
