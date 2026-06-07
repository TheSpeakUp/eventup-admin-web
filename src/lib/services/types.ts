export const SERVICE_STATUSES = [
  "pending_review",
  "published",
  "needs_changes",
  "hidden",
  "rejected",
] as const;

export type ServiceStatus = (typeof SERVICE_STATUSES)[number];

export function isServiceStatus(value: string): value is ServiceStatus {
  return (SERVICE_STATUSES as readonly string[]).includes(value);
}

export type ServiceSummary = {
  id: string;
  title: string;
  provider_name: string;
  category: string;
  price_cents: number;
  currency: string;
  status: ServiceStatus;
  updated_at: string;
};

export type ServiceDetail = ServiceSummary & {
  description: string;
  provider_id: string;
  created_at: string;
  last_moderation_note: string | null;
  last_moderator_email: string | null;
};

export type ServiceListResponse = {
  items: ServiceSummary[];
  total: number;
  page: number;
  page_size: number;
};

export type ServiceListQuery = {
  q?: string;
  status?: ServiceStatus;
  page?: number;
  page_size?: number;
};
