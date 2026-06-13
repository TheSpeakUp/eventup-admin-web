// src/app/(routes)/quality/_components/ReviewAnomalyButton.tsx
"use client";
import { useActionState } from "react";
import { reviewAnomalyAction } from "../actions";
import { EMPTY_STATE } from "../action-types";

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
      <input
        name="note"
        data-testid={`anomaly-review-${id}-note`}
        placeholder="Note (optional)"
        className="w-40 rounded border border-zinc-200 px-2 py-0.5 text-xs"
      />
      <button
        type="submit"
        disabled={pending}
        data-testid={`anomaly-review-${id}`}
        className="rounded border border-blue-300 px-2 py-0.5 text-xs text-blue-800 disabled:opacity-50"
      >
        {pending ? "…" : "Review"}
      </button>
      {state && !state.ok && state.error ? (
        <p
          data-testid={`anomaly-review-${id}-error`}
          className="ml-1 text-xs text-red-300"
        >
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
