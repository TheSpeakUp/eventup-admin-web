// Mirrors src/eventup/admin/marketplace/payments_admin_schemas.py.
//
// Money is carried as integer minor units (e.g. cents) alongside an ISO
// currency code; format at the render edge, never store a pre-formatted
// string. The list endpoint is offset/limit paginated and returns a `total`
// alongside the page `items` (NOT a cursor envelope like providers).

// Payment statuses surfaced by the backend. The backend does not constrain the
// value to an enum on the read path, so callers must tolerate an unknown
// string — STATUS_STYLES falls back to a neutral badge for anything unlisted.
export const PAYMENT_STATUSES = [
  "pending",
  "processing",
  "succeeded",
  "failed",
  "canceled",
  "refunded",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export function isPaymentStatus(value: string): value is PaymentStatus {
  return (PAYMENT_STATUSES as readonly string[]).includes(value);
}

export type PaymentListItem = {
  id: number;
  provider: string;
  resource_type: string;
  resource_id: number;
  amount_minor: number;
  total_gross_minor: number | null;
  currency: string;
  status: string;
  discount_amount_minor: number | null;
  stripe_promotion_code: string | null;
  provider_name: string | null;
  service_title: string | null;
  created_at: string;
};

export type PaymentDetail = {
  id: number;
  provider: string;
  resource_type: string;
  resource_id: number;
  amount_minor: number;
  tax_amount_minor: number | null;
  total_gross_minor: number | null;
  currency: string;
  status: string;
  failure_code: string | null;
  failure_message: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  receipt_url: string | null;
  stripe_promotion_code: string | null;
  stripe_coupon_id: string | null;
  discount_amount_minor: number | null;
  provider_name: string | null;
  service_title: string | null;
  created_at: string;
  updated_at: string;
};

export type PaymentListResponse = {
  items: PaymentListItem[];
  total: number;
};

export type PaymentListQuery = {
  resource_type?: string;
  status?: string;
  currency?: string;
  created_from?: string;
  created_to?: string;
  q?: string;
  limit?: number;
  offset?: number;
};
