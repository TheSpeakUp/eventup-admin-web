export const SERVICE_STATUSES = [
  "draft",
  "on_review",
  "published",
  "unpublished",
  "archived",
] as const;

export type ServiceStatus = (typeof SERVICE_STATUSES)[number];

export function isServiceStatus(value: string): value is ServiceStatus {
  return (SERVICE_STATUSES as readonly string[]).includes(value);
}

/**
 * Mirrors backend `MarketplaceRecipientType` (IntEnum): ALL=0, SPEAKER=1, ORGANIZER=2.
 * The API serialises the enum as its integer value; map it to an operator-readable label.
 */
export const RECIPIENT_TYPE_LABELS: Record<number, string> = {
  0: "All",
  1: "Speaker",
  2: "Organizer",
};

export function formatRecipientType(value: number): string {
  return RECIPIENT_TYPE_LABELS[value] ?? `Unknown (${value})`;
}

export type ServiceListItem = {
  id: number;
  title: string;
  provider_id: number;
  status: ServiceStatus;
  category_id: number | null;
  recipient_type: number;
  base_price_minor: number | null;
  currency: string | null;
  remote_available: boolean;
  created_at: string;
  updated_at: string;
};

export type ServiceDetail = ServiceListItem & {
  // Joined labels (backend PR #93) — detail-only; null when unresolved/unset.
  provider_name: string | null;
  category_name: string | null;
  description: string | null;
  pricing_type: string;
  pricing_interval_minutes: number | null;
  max_units_per_order: number | null;
  external_url: string | null;
  address: string | null;
  attributes: Record<string, unknown> | null;
};

export type ServiceCursorPage = {
  items: ServiceListItem[];
  next_last_id: number | null;
  has_more: boolean;
  count: number;
};

export type ServiceListQuery = {
  search?: string;
  status?: ServiceStatus;
  provider_id?: number;
  last_id?: number;
  limit?: number;
};

export type ServiceModerationResponse = {
  service_id: number;
  new_status: ServiceStatus;
  message_key: string | null;
  message: string;
};

export type ServiceStats = {
  service_id: number;
  total_offers: number;
  offers_by_status: Record<string, number>;
  active_offers_count: number;
};
