// src/app/(routes)/reviews/_components/ReviewsTable.tsx
// Reviews list table with moderation controls. Each review row shows:
// - rating (1-5 stars), status badge, body (truncated), author, created_at
// - provider reply (if any) with its status
// - moderation actions (hide/remove/restore) when canManage=true
// - reply actions (hide/restore) when a reply exists and canManage=true

import type { AdminReviewRead } from "@/lib/reviews/types";
import Badge, { type BadgeTone } from "@/app/_components/ui/Badge";
import EmptyState from "@/app/_components/ui/EmptyState";
import { Table, THead, TBody, Tr, Th, Td } from "@/app/_components/ui/Table";
import ReviewModerationButton from "./ReviewModerationButton";
import ReplyModerationButton from "./ReplyModerationButton";

function StatusBadge({ status }: { status: string }) {
  const tones: Record<string, BadgeTone> = {
    published: "success",
    hidden: "warning",
    removed: "danger",
  };
  const tone = tones[status] ?? "success";
  return (
    <Badge tone={tone}>
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
          className={`text-sm ${i < rating ? "text-amber-400" : "text-ink-tertiary"}`}
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
    return <EmptyState testid="reviews-empty">No reviews found.</EmptyState>;

  return (
    <div data-testid="reviews-table">
    <Table>
      <THead>
        <Tr>
          <Th>Rating</Th>
          <Th>Status</Th>
          <Th>Body</Th>
          <Th>Author</Th>
          <Th>Created</Th>
          <Th>Provider Reply</Th>
          <Th />
        </Tr>
      </THead>
      <TBody>
        {rows.map((review) => (
          <Tr key={review.id} data-testid={`reviews-row-${review.id}`}>
            <Td>
              <RatingStars rating={review.rating} />
            </Td>
            <Td>
              <StatusBadge status={review.status} />
            </Td>
            <Td className="max-w-xs truncate text-ink">
              {truncate(review.body)}
            </Td>
            <Td className="font-mono text-xs text-ink-subtle">
              {review.author_user_id}
            </Td>
            <Td className="text-ink-subtle">{formatDate(review.created_at)}</Td>
            <Td>
              {review.provider_reply_body ? (
                <div className="space-y-1">
                  <div className="text-xs text-ink-subtle">
                    {truncate(review.provider_reply_body, 50)}
                  </div>
                  {review.provider_reply_status && (
                    <StatusBadge status={review.provider_reply_status} />
                  )}
                </div>
              ) : (
                <span className="text-ink-tertiary">—</span>
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
      </TBody>
    </Table>
    </div>
  );
}
