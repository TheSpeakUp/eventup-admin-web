// src/lib/reviews/types.ts
//
// Typed mirror of the backend admin reviews moderation API
// (src/eventup/admin/marketplace/reviews_admin_schemas.py). Review status
// is a union of published/hidden/removed; provider reply status is published/hidden/null.
// All timestamps are ISO datetime strings. Moderation metadata (reason, by, at)
// is present only when a review has been moderated.

export type ReviewStatus = "published" | "hidden" | "removed";
export type ReplyStatus = "published" | "hidden";

export type AdminReviewRead = {
  id: number;
  provider_id: number;
  author_user_id: string;
  reservation_id: number;
  rating: number;
  body: string | null;
  status: ReviewStatus;
  moderated_by: string | null;
  moderation_reason: string | null;
  moderated_at: string | null; // ISO datetime
  provider_reply_body: string | null;
  provider_reply_status: ReplyStatus | null;
  provider_reply_at: string | null; // ISO datetime
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
};

export type ReviewListResponse = {
  items: AdminReviewRead[];
  count: number;
  has_more: boolean;
  next_last_id: number | null;
};

export type ReviewListQuery = {
  status?: ReviewStatus;
  provider_id?: number;
  rating?: number;
  q?: string;
  limit?: number;
  last_id?: number;
};

// PATCH /{id}/moderate body — action is required; reason optional.
export type ReviewModeratePayload = {
  action: "hide" | "remove" | "restore";
  reason?: string;
};

// PATCH /{id}/reply/moderate body — action is required.
export type ReplyModeratePayload = {
  action: "hide" | "restore";
};
