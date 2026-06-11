// src/app/(routes)/reviews/_components/ReviewsTable.tsx
// Reviews list table with moderation controls. Each review row shows:
// - rating (1-5 stars), status badge, body (truncated), author, created_at
// - provider reply (if any) with its status
// - moderation actions (hide/remove/restore) when canManage=true
// - reply actions (hide/restore) when a reply exists and canManage=true

import type { AdminReviewRead } from "@/lib/reviews/types";
import ReviewModerationButton from "./ReviewModerationButton";
import ReplyModerationButton from "./ReplyModerationButton";

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string; ring: string }> = {
    published: { bg: "bg-emerald-100", text: "text-emerald-800", ring: "ring-emerald-200" },
    hidden: { bg: "bg-amber-100", text: "text-amber-800", ring: "ring-amber-200" },
    removed: { bg: "bg-red-100", text: "text-red-800", ring: "ring-red-200" },
  };
  const color = colors[status] || colors.published;
  return (
    <span
      className={`inline-flex items-center rounded-full ${color.bg} px-2 py-0.5 text-xs font-medium ${color.text} ring-1 ring-inset ${color.ring}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`text-sm ${i < rating ? "text-amber-500" : "text-zinc-300"}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function truncate(text: string | null, maxLen = 80): string {
  if (!text) return "—";
  return text.length > maxLen ? text.slice(0, maxLen) + "…" : text;
}

export default function ReviewsTable({
  rows,
  canManage,
}: {
  rows: AdminReviewRead[];
  canManage: boolean;
}) {
  if (rows.length === 0)
    return (
      <p data-testid="reviews-empty" className="p-4 text-zinc-500">
        No reviews found.
      </p>
    );

  return (
    <table className="w-full text-sm" data-testid="reviews-table">
      <thead>
        <tr className="text-left text-zinc-500">
          <th className="py-2">Rating</th>
          <th>Status</th>
          <th>Body</th>
          <th>Author</th>
          <th>Created</th>
          <th>Provider Reply</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {rows.map((review) => (
          <tr
            key={review.id}
            className="border-t border-zinc-200"
            data-testid={`reviews-row-${review.id}`}
          >
            <td className="py-2">
              <RatingStars rating={review.rating} />
            </td>
            <td>
              <StatusBadge status={review.status} />
            </td>
            <td className="max-w-xs truncate text-zinc-700">
              {truncate(review.body)}
            </td>
            <td className="font-mono text-xs text-zinc-600">
              {review.author_user_id}
            </td>
            <td className="text-zinc-600">
              {formatDate(review.created_at)}
            </td>
            <td>
              {review.provider_reply_body ? (
                <div className="space-y-1">
                  <div className="text-xs text-zinc-600">
                    {truncate(review.provider_reply_body, 50)}
                  </div>
                  {review.provider_reply_status && (
                    <StatusBadge status={review.provider_reply_status} />
                  )}
                </div>
              ) : (
                <span className="text-zinc-400">—</span>
              )}
            </td>
            <td className="whitespace-nowrap">
              {canManage ? (
                <div className="flex flex-col gap-1">
                  <ReviewModerationButton reviewId={review.id} status={review.status} />
                  {review.provider_reply_body && review.provider_reply_status && (
                    <ReplyModerationButton
                      reviewId={review.id}
                      replyStatus={review.provider_reply_status}
                    />
                  )}
                </div>
              ) : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
