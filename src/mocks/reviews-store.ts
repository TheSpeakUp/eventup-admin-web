// src/mocks/reviews-store.ts
//
// In-memory store for admin reviews moderation. Mirrors the backend
// state for filtering and mutation operations.

import type { AdminReviewRead, ReviewStatus, ReplyStatus } from "@/lib/reviews/types";
import { reviews as seedReviews } from "./reviews-fixtures";

// Clone the seed data to avoid mutating fixtures across test runs.
let reviewsDb = seedReviews.map((r) => ({ ...r }));

export function getAllReviews(): AdminReviewRead[] {
  return reviewsDb;
}

export function getReviewById(id: number): AdminReviewRead | null {
  return reviewsDb.find((r) => r.id === id) ?? null;
}

export function filterReviews(
  status?: ReviewStatus,
  providerId?: number,
  rating?: number,
  q?: string,
): AdminReviewRead[] {
  let rows = [...reviewsDb];

  if (status !== undefined) {
    rows = rows.filter((r) => r.status === status);
  }
  if (providerId !== undefined) {
    rows = rows.filter((r) => r.provider_id === providerId);
  }
  if (rating !== undefined) {
    rows = rows.filter((r) => r.rating === rating);
  }
  if (q !== undefined && q !== "") {
    const query = q.toLowerCase();
    rows = rows.filter(
      (r) =>
        (r.body?.toLowerCase().includes(query) ?? false) ||
        (r.provider_reply_body?.toLowerCase().includes(query) ?? false),
    );
  }

  return rows;
}

export function setReviewStatus(
  id: number,
  newStatus: ReviewStatus,
  reason?: string,
): AdminReviewRead | null {
  const review = getReviewById(id);
  if (!review) return null;

  const now = new Date().toISOString();
  review.status = newStatus;
  review.moderated_at = now;
  review.moderated_by = newStatus === "published" ? null : "admin_001";
  review.moderation_reason = reason ?? (newStatus === "published" ? null : "Moderated");
  review.updated_at = now;

  return review;
}

export function setReplyStatus(
  id: number,
  newStatus: ReplyStatus,
): AdminReviewRead | null {
  const review = getReviewById(id);
  if (!review) return null;

  review.provider_reply_status = newStatus;
  review.updated_at = new Date().toISOString();

  return review;
}

export function resetReviews(): void {
  reviewsDb = seedReviews.map((r) => ({ ...r }));
}
