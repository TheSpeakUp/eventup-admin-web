// src/app/(routes)/reviews/_components/ReplyModerationButton.tsx
"use client";
import { useActionState } from "react";
import { moderateReplyAction } from "../actions";
import { EMPTY_STATE } from "../action-types";
import type { ReplyStatus } from "@/lib/reviews/types";

export default function ReplyModerationButton({
  reviewId,
  replyStatus,
}: {
  reviewId: number;
  replyStatus: ReplyStatus;
}) {
  const [state, formAction, pending] = useActionState(
    moderateReplyAction,
    EMPTY_STATE,
  );

  // Determine which action to offer for the reply
  // published → hide; hidden → restore
  const action = replyStatus === "published" ? "hide" : "restore";

  return (
    <form
      action={formAction}
      data-testid={`reply-moderate-${reviewId}-form`}
      className="flex items-center gap-1"
    >
      <input type="hidden" name="review_id" value={reviewId} />
      <input type="hidden" name="action" value={action} />
      <button
        type="submit"
        disabled={pending}
        data-testid={`reply-moderate-${reviewId}`}
        className="rounded border border-green-300 px-2 py-0.5 text-xs text-green-800 disabled:opacity-50"
      >
        {pending ? "…" : action === "hide" ? "Hide reply" : "Restore reply"}
      </button>
      {state && !state.ok && state.error ? (
        <p
          data-testid={`reply-moderate-${reviewId}-error`}
          className="ml-1 text-xs text-red-700"
        >
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
