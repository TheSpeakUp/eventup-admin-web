// src/lib/reviews/api.ts
//
// Typed client for the admin reviews moderation slice. Reads (list) are GETs
// with query params (mirrors quality/api.ts). Writes (moderate review/reply)
// pass `redirectOn401:false` so Server Actions surface a structured error to
// the form instead of redirecting. Only the methods the backend views expose
// per entity are wired here.

import { apiFetch, type ApiFetchResult } from "@/lib/api";
import type {
  AdminReviewRead,
  ReviewListQuery,
  ReviewListResponse,
  ReviewModeratePayload,
  ReplyModeratePayload,
} from "./types";

const BASE = "/eventup-admin/v1/marketplace/reviews";

function appendNum(params: URLSearchParams, key: string, v: number | undefined) {
  if (v !== undefined) params.set(key, String(v));
}
function appendStr(params: URLSearchParams, key: string, v: string | undefined) {
  if (v !== undefined && v !== "") params.set(key, v);
}
function withQs(path: string, params: URLSearchParams): string {
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

// --------------------------------------------------------------------------- //
// Review list, moderation (review + reply)                                   //
// --------------------------------------------------------------------------- //

export function listReviews(
  query: ReviewListQuery = {},
): Promise<ApiFetchResult<ReviewListResponse>> {
  const params = new URLSearchParams();
  appendStr(params, "status", query.status);
  appendNum(params, "provider_id", query.provider_id);
  appendNum(params, "rating", query.rating);
  appendStr(params, "q", query.q);
  appendNum(params, "limit", query.limit);
  appendNum(params, "last_id", query.last_id);
  return apiFetch<ReviewListResponse>(
    withQs(`${BASE}`, params),
  );
}

export function getReview(
  reviewId: number,
): Promise<ApiFetchResult<AdminReviewRead>> {
  return apiFetch<AdminReviewRead>(`${BASE}/${reviewId}`);
}

// PATCH /{id}/moderate — moderates the review (hide/remove/restore);
// returns the updated review.
export function moderateReview(
  reviewId: number,
  payload: ReviewModeratePayload,
): Promise<ApiFetchResult<AdminReviewRead>> {
  return apiFetch<AdminReviewRead>(
    `${BASE}/${reviewId}/moderate`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
      redirectOn401: false,
    },
  );
}

// PATCH /{id}/reply/moderate — moderates the provider reply (hide/restore);
// returns the updated review.
export function moderateReply(
  reviewId: number,
  payload: ReplyModeratePayload,
): Promise<ApiFetchResult<AdminReviewRead>> {
  return apiFetch<AdminReviewRead>(
    `${BASE}/${reviewId}/reply/moderate`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
      redirectOn401: false,
    },
  );
}
