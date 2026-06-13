// src/app/(routes)/reviews/_components/ReviewsTable.tsx
// Reviews list table with moderation controls. Each review row shows:
// - rating (1-5 stars), status badge, body (truncated), author, created_at
// - provider reply (if any) with its status
// - moderation actions (hide/remove/restore) when canManage=true
// - reply actions (hide/restore) when a reply exists and canManage=true

import Badge, { type BadgeTone } from "@/app/_components/ui/Badge";
import type { AdminReviewRead } from "@/lib/reviews/types";
import ReviewModerationButton from "./ReviewModerationButton";
import ReplyModerationButton from "./ReplyModerationButton";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/app/_components/ui/Table";
import EmptyState from "@/app/_components/ui/EmptyState";

const STATUS_TONE: Record<string, BadgeTone> = {
  published: "success",
  hidden: "warning",
  removed: "danger",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge tone={STATUS_TONE[status] ?? "success"}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
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
      <EmptyState data-testid="reviews-empty">No reviews found.</EmptyState>
    );

  return (
    <Table data-testid="reviews-table">
      <Thead>
        <tr>
          <Th>Rating</Th>
          <Th>Status</Th>
          <Th>Body</Th>
          <Th>Author</Th>
          <Th>Created</Th>
          <Th>Provider Reply</Th>
          <Th />
        </tr>
      </Thead>
      <Tbody>
        {rows.map((review) => (
          <Tr key={review.id} data-testid={`reviews-row-${review.id}`}>
            <Td>
              <RatingStars rating={review.rating} />
            </Td>
            <Td>
              <StatusBadge status={review.status} />
            </Td>
            <Td className="max-w-xs truncate text-zinc-700">
              {truncate(review.body)}
            </Td>
            <Td className="font-mono text-xs text-zinc-600">
              {review.author_user_id}
            </Td>
            <Td className="text-zinc-600">{formatDate(review.created_at)}</Td>
            <Td>
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
            </Td>
            <Td className="whitespace-nowrap">
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
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}
