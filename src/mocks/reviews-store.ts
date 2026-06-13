// src/mocks/reviews-store.ts
//
// In-memory store for admin reviews moderation. Mirrors the backend
// state for filtering and mutation operations.

import type { AdminReviewRead, ReviewStatus, ReplyStatus } from "@/lib/reviews/types";
import { reviews as seedReviews } from "./reviews-fixtures";

// Fresh clone of the seed data — never mutate the imported fixtures directly.
function seed(): AdminReviewRead[] {
  return seedReviews.map((r) => ({ ...r }));
}

// The store is held on `globalThis`, NOT a plain module-level binding, because
// Next/Turbopack can compile this module into more than one chunk (e.g. the MSW
// node server bundle that serves reads vs. the route-handler bundle that calls
// resetReviewsStore). Separate chunks would each get their own module-scoped
// copy, so a reset in one would not be visible to reads in the other. Anchoring
// the single backing array on the process-global object makes every chunk share
// one instance — the only thing that makes the test reset actually take effect.
const globalStore = globalThis as typeof globalThis & {
  __eventupReviewsDb?: AdminReviewRead[];
};
globalStore.__eventupReviewsDb ??= seed();

function reviewsDb(): AdminReviewRead[] {
  return (globalStore.__eventupReviewsDb ??= seed());
}

export function getAllReviews(): AdminReviewRead[] {
  return reviewsDb();
}

export function getReviewById(id: number): AdminReviewRead | null {
  return reviewsDb().find((r) => r.id === id) ?? null;
}

export function filterReviews(
  status?: ReviewStatus,
  providerId?: number,
  rating?: number,
  q?: string,
): AdminReviewRead[] {
  let rows = [...reviewsDb()];

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

// Restore the store to its seeded state. Wired into a test-only reset route
// (src/app/api/e2e/reset-reviews) so the e2e suite can guarantee a clean
// reviews store per test — the moderation specs mutate seeded rows (hide #1,
// hide #3's reply) and must not leak that state across tests or runs.
export function resetReviewsStore(): void {
  globalStore.__eventupReviewsDb = seed();
}
