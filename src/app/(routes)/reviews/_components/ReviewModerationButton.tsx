// src/app/(routes)/reviews/_components/ReviewModerationButton.tsx
"use client";
import { useActionState } from "react";
import { moderateReviewAction } from "../actions";
import { EMPTY_STATE } from "../action-types";
import type { ReviewStatus } from "@/lib/reviews/types";

export default function ReviewModerationButton({
  reviewId,
  status,
}: {
  reviewId: number;
  status: ReviewStatus;
}) {
  const [state, formAction, pending] = useActionState(
    moderateReviewAction,
    EMPTY_STATE,
  );

  // Determine which action to offer based on current status
  // published → hide/remove; hidden/removed → restore
  const actions: { value: "hide" | "remove" | "restore"; label: string }[] = [];
  if (status === "published") {
    actions.push(
      { value: "hide", label: "Hide" },
      { value: "remove", label: "Remove" },
    );
  } else if (status === "hidden" || status === "removed") {
    actions.push({ value: "restore", label: "Restore" });
  }

  if (actions.length === 0) return null;

  return (
    <form
      action={formAction}
      data-testid={`review-moderate-${reviewId}-form`}
      className="flex items-center gap-1"
    >
      <input type="hidden" name="review_id" value={reviewId} />
      <select
        name="action"
        data-testid={`review-moderate-${reviewId}-action`}
        disabled={pending}
        defaultValue={actions[0].value}
        className="rounded border border-zinc-200 px-1 py-0.5 text-xs"
      >
        {actions.map((a) => (
          <option key={a.value} value={a.value}>
            {a.label}
          </option>
        ))}
      </select>
      <input
        name="reason"
        data-testid={`review-moderate-${reviewId}-reason`}
        placeholder="Reason (optional)"
        className="w-32 rounded border border-zinc-200 px-2 py-0.5 text-xs"
        disabled={pending}
      />
      <button
        type="submit"
        disabled={pending}
        data-testid={`review-moderate-${reviewId}`}
        className="rounded border border-blue-300 px-2 py-0.5 text-xs text-blue-800 disabled:opacity-50"
      >
        {pending ? "…" : "Apply"}
      </button>
      {state && !state.ok && state.error ? (
        <p
          data-testid={`review-moderate-${reviewId}-error`}
          className="ml-1 text-xs text-red-700"
        >
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
