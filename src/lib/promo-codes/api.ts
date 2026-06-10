// src/lib/promo-codes/api.ts
import { apiFetch, type ApiFetchResult } from "@/lib/api";
import type {
  PromoCodeCreatePayload,
  PromoCodeFilter,
  PromoCodeListResponse,
  PromoCodeRead,
  PromoCodeUpdatePayload,
} from "./types";

const BASE = "/eventup-admin/v1/marketplace/promo-codes";

// List is a POST with a body filter (code/is_active/item_type/paging).
export function listPromoCodes(
  filter: PromoCodeFilter = {},
): Promise<ApiFetchResult<PromoCodeListResponse>> {
  const body: Record<string, unknown> = {
    limit: filter.limit ?? 50,
    offset: filter.offset ?? 0,
  };
  if (filter.code) body.code = filter.code;
  if (filter.is_active !== undefined) body.is_active = filter.is_active;
  if (filter.item_type) body.item_type = filter.item_type;
  return apiFetch<PromoCodeListResponse>(`${BASE}/list`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function getPromoCode(
  id: number,
): Promise<ApiFetchResult<PromoCodeRead>> {
  return apiFetch<PromoCodeRead>(`${BASE}/${id}`);
}

export function createPromoCode(
  payload: PromoCodeCreatePayload,
): Promise<ApiFetchResult<PromoCodeRead>> {
  return apiFetch<PromoCodeRead>(BASE, {
    method: "POST",
    body: JSON.stringify(payload),
    redirectOn401: false,
  });
}

// PATCH route exists (PromoCodeUpdate — mutable fields only).
export function updatePromoCode(
  id: number,
  payload: PromoCodeUpdatePayload,
): Promise<ApiFetchResult<PromoCodeRead>> {
  return apiFetch<PromoCodeRead>(`${BASE}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
    redirectOn401: false,
  });
}

export function deactivatePromoCode(
  id: number,
): Promise<ApiFetchResult<PromoCodeRead>> {
  return apiFetch<PromoCodeRead>(`${BASE}/${id}/deactivate`, {
    method: "POST",
    redirectOn401: false,
  });
}
