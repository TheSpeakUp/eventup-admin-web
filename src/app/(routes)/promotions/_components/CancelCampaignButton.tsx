// src/app/(routes)/promotions/_components/CancelCampaignButton.tsx
"use client";
import { useActionState } from "react";
import { cancelCampaignAction } from "../actions";
import { EMPTY_STATE } from "../action-types";

// Confirm-then-cancel. On a backend rejection (e.g. already-canceled) the
// structured error rides back through ActionState and renders inline — same
// idiom as DeactivateButton.
export default function CancelCampaignButton({ id }: { id: number }) {
  const [state, formAction, pending] = useActionState(
    cancelCampaignAction,
    EMPTY_STATE,
  );
  return (
    <form
      action={formAction}
      data-testid={`campaign-cancel-${id}-form`}
      onSubmit={(e) => {
        if (!confirm("Cancel this campaign? This cannot be undone."))
          e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        data-testid={`campaign-cancel-${id}`}
        className="rounded border border-amber-300 px-2 py-0.5 text-xs text-amber-800 disabled:opacity-50"
      >
        {pending ? "…" : "Cancel"}
      </button>
      {state && !state.ok && state.error ? (
        <p
          data-testid={`campaign-cancel-${id}-error`}
          className="mt-1 text-xs text-red-300"
        >
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
