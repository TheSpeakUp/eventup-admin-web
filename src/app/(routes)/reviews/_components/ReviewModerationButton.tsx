"use client";

// src/app/(routes)/reviews/_components/ReviewModerationButton.tsx
"use client";
import { useActionState } from "react";
import { moderateReviewAction } from "../actions";
import { EMPTY_STATE } from "../action-types";
import type { ReviewStatus } from "@/lib/reviews/types";
import Button from "@/app/_components/ui/Button";
import { Input, Select } from "@/app/_components/ui/FormField";

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
      <Select
        name="action"
        data-testid={`review-moderate-${reviewId}-action`}
        disabled={pending}
        defaultValue={actions[0].value}
        className="w-auto px-1 py-0.5 text-xs"
      >
        {actions.map((a) => (
          <option key={a.value} value={a.value}>
            {a.label}
          </option>
        ))}
      </Select>
      <Input
        name="reason"
        data-testid={`review-moderate-${reviewId}-reason`}
        placeholder="Reason (optional)"
        className="w-32 py-0.5 text-xs"
        disabled={pending}
      />
      <Button
        type="submit"
        variant="secondary"
        size="sm"
        disabled={pending}
        data-testid={`review-moderate-${reviewId}`}
      >
        {pending ? "…" : "Apply"}
      </Button>
      {state && !state.ok && state.error ? (
        <p
          data-testid={`review-moderate-${reviewId}-error`}
          className="ml-1 text-xs text-red-400"
        >
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
