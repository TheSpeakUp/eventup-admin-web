export const PROVIDER_STATUSES = [
  "pending_review",
  "approved",
  "suspended",
  "rejected",
] as const;

export type ProviderStatus = (typeof PROVIDER_STATUSES)[number];

export function isProviderStatus(value: string): value is ProviderStatus {
  return (PROVIDER_STATUSES as readonly string[]).includes(value);
}

export type ProviderSummary = {
  id: string;
  name: string;
  contact_email: string;
  category: string;
  status: ProviderStatus;
  updated_at: string;
};

export type ProviderDetail = ProviderSummary & {
  description: string;
  website: string | null;
  phone: string | null;
  created_at: string;
  last_moderation_note: string | null;
  last_moderator_email: string | null;
};

export type ProviderListResponse = {
  items: ProviderSummary[];
  total: number;
  page: number;
  page_size: number;
};

export type ProviderListQuery = {
  q?: string;
  status?: ProviderStatus;
  page?: number;
  page_size?: number;
};
