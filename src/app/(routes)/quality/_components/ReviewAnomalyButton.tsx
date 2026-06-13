// src/app/(routes)/quality/_components/ReviewAnomalyButton.tsx
"use client";
import { useActionState } from "react";
import { reviewAnomalyAction } from "../actions";
import { EMPTY_STATE } from "../action-types";
import Button from "@/app/_components/ui/Button";
import { Input } from "@/app/_components/ui/FormField";

// Review (resolve) an anomaly with an optional free-form note. On a backend
// rejection (e.g. already reviewed) the structured error renders inline.
export default function ReviewAnomalyButton({ id }: { id: number }) {
  const [state, formAction, pending] = useActionState(
    reviewAnomalyAction,
    EMPTY_STATE,
  );
  return (
    <form
      action={formAction}
      data-testid={`anomaly-review-${id}-form`}
      className="flex items-center gap-1"
    >
      <input type="hidden" name="anomaly_id" value={id} />
      <Input
        name="note"
        data-testid={`anomaly-review-${id}-note`}
        placeholder="Note (optional)"
        className="w-40"
      />
      <Button
        type="submit"
        variant="secondary"
        size="sm"
        disabled={pending}
        data-testid={`anomaly-review-${id}`}
      >
        {pending ? "…" : "Review"}
      </Button>
      {state && !state.ok && state.error ? (
        <p
          data-testid={`anomaly-review-${id}-error`}
          className="ml-1 text-xs text-red-400"
        >
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
