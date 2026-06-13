// src/lib/dashboard/types.ts
// Mirrors backend dashboard read schemas from /eventup-admin/v1/marketplace/dashboard

export type Granularity = "day" | "week" | "month";

export type RevenueBucket = {
  period: string;
  currency: string;
  resource_type: string;
  gross_minor: number;
  net_minor: number;
  payment_count: number;
};

export type RevenueResponse = {
  granularity: string;
  buckets: RevenueBucket[];
};

export type FunnelStatusCount = {
  status: string;
  count: number;
};

export type FunnelFailureReason = {
  failure_code: string;
  count: number;
};

export type FunnelResponse = {
  status_counts: FunnelStatusCount[];
  failure_reasons: FunnelFailureReason[];
};

export type ContentGrowthBucket = {
  period: string;
  new_providers: number;
  new_services: number;
  new_offers: number;
};

export type ContentGrowthResponse = {
  granularity: string;
  buckets: ContentGrowthBucket[];
};

export type TopProvider = {
  provider_id: number;
  provider_name: string | null;
  currency: string;
  gross_minor: number;
  payment_count: number;
};

export type TopService = {
  service_id: number;
  service_title: string | null;
  provider_id: number | null;
  provider_name: string | null;
  currency: string;
  gross_minor: number;
  payment_count: number;
};

export type PromoDiscountTotal = {
  currency: string | null;
  discount_minor: number;
  usage_count: number;
};

export type TopsResponse = {
  providers: TopProvider[];
  services: TopService[];
  promo_discounts: PromoDiscountTotal[];
};

export type DashboardWindow = {
  date_from?: string;
  date_to?: string;
  granularity?: Granularity;
  currency?: string;
};
