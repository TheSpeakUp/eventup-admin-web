import { apiFetch, type ApiFetchResult } from "@/lib/api";
import type {
  PaymentDetail,
  PaymentListQuery,
  PaymentListResponse,
  RefundCreateBody,
  RefundRead,
} from "./types";

const BASE = "/eventup-admin/v1/marketplace/payments";

function buildListPath(query: PaymentListQuery): string {
  const params = new URLSearchParams();
  if (query.resource_type) params.set("resource_type", query.resource_type);
  if (query.status) params.set("status", query.status);
  if (query.currency) params.set("currency", query.currency);
  if (query.created_from) params.set("created_from", query.created_from);
  if (query.created_to) params.set("created_to", query.created_to);
  if (query.q) params.set("q", query.q);
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  if (query.offset !== undefined) params.set("offset", String(query.offset));
  const qs = params.toString();
  return qs ? `${BASE}?${qs}` : BASE;
}

export function listPayments(
  query: PaymentListQuery = {},
): Promise<ApiFetchResult<PaymentListResponse>> {
  return apiFetch<PaymentListResponse>(buildListPath(query));
}

export function getPayment(
  id: number,
): Promise<ApiFetchResult<PaymentDetail>> {
  return apiFetch<PaymentDetail>(`${BASE}/${id}`);
}

export function refundPayment(
  id: number,
  body: RefundCreateBody,
): Promise<ApiFetchResult<RefundRead>> {
  return apiFetch<RefundRead>(`${BASE}/${id}/refund`, {
    method: "POST",
    body: JSON.stringify(body),
    redirectOn401: false,
  });
}
