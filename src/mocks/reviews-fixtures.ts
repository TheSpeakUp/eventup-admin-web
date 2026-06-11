// src/mocks/reviews-fixtures.ts
//
// Seed fixtures for admin reviews moderation. 13 reviews across statuses
// (published/hidden/removed) and ratings (1-5), with a few having provider
// replies. Used by reviews-store to populate the in-memory mock.

import type { AdminReviewRead } from "@/lib/reviews/types";

const NOW = new Date().toISOString();

// Helper to generate a review fixture.
function makeReview(
  id: number,
  rating: number,
  body: string | null,
  status: "published" | "hidden" | "removed",
  providerReplyBody: string | null = null,
  providerReplyStatus: "published" | "hidden" | null = null,
  providerId: number = 100 + id,
): AdminReviewRead {
  return {
    id,
    provider_id: providerId,
    author_user_id: `user_${id}`,
    reservation_id: 5000 + id,
    rating,
    body,
    status,
    moderated_by: status !== "published" ? "admin_001" : null,
    moderation_reason:
      status === "hidden"
        ? "Spam content"
        : status === "removed"
          ? "Violates ToS"
          : null,
    moderated_at: status !== "published" ? new Date(Date.now() - 86400000).toISOString() : null,
    provider_reply_body: providerReplyBody,
    provider_reply_status: providerReplyStatus,
    provider_reply_at: providerReplyBody ? new Date(Date.now() - 43200000).toISOString() : null,
    created_at: new Date(Date.now() - 604800000).toISOString(), // 7 days ago
    updated_at: NOW,
  };
}

export const reviews: AdminReviewRead[] = [
  // Published reviews across different ratings
  makeReview(
    1,
    5,
    "Exceptional service! Highly recommend.",
    "published",
    "Thank you so much!",
    "published",
    101,
  ),
  makeReview(
    2,
    4,
    "Good experience, a bit pricey.",
    "published",
    null,
    null,
    102,
  ),
  makeReview(
    3,
    5,
    "Outstanding quality and professionalism.",
    "published",
    "We appreciate the feedback!",
    "published",
    103,
  ),
  makeReview(
    4,
    3,
    "Average service, nothing special.",
    "published",
    null,
    null,
    104,
  ),
  makeReview(
    5,
    2,
    "Disappointed with the results.",
    "published",
    null,
    null,
    105,
  ),

  // Hidden reviews
  makeReview(
    6,
    1,
    "Terrible experience, would not recommend.",
    "hidden",
    null,
    null,
    106,
  ),
  makeReview(
    7,
    5,
    "This is spam [REMOVED CONTENT]",
    "hidden",
    null,
    null,
    107,
  ),

  // Removed reviews
  makeReview(
    8,
    4,
    "Violates company policy [REMOVED]",
    "removed",
    null,
    null,
    108,
  ),

  // More published for variety
  makeReview(
    9,
    4,
    "Very satisfied with the outcome.",
    "published",
    "Thank you for your review!",
    "published",
    109,
  ),
  makeReview(
    10,
    3,
    "Acceptable service.",
    "published",
    null,
    null,
    110,
  ),
  makeReview(
    11,
    5,
    "Perfect in every way!",
    "published",
    null,
    null,
    111,
  ),
  makeReview(
    12,
    2,
    "Not as described.",
    "published",
    "We apologize for this experience.",
    "hidden",
    112,
  ),
  makeReview(
    13,
    1,
    "Worst service ever.",
    "hidden",
    null,
    null,
    113,
  ),
];
