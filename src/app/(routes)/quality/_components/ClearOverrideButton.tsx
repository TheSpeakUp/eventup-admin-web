// src/app/(routes)/quality/_components/ClearOverrideButton.tsx
"use client";
import { useActionState } from "react";
import { clearOverrideAction } from "../actions";
import { EMPTY_STATE } from "../action-types";

// Clear the active manual override (DELETE /services/{id}/override). Confirm
// then clear; structured backend errors render inline.
export default function ClearOverrideButton({
  serviceId,
}: {
  serviceId: number;
}) {
  const [state, formAction, pending] = useActionState(
    clearOverrideAction,
    EMPTY_STATE,
  );
  return (
    <form
      action={formAction}
      data-testid="clear-override-form"
      onSubmit={(e) => {
        if (!confirm("Clear the manual override on this service?"))
          e.preventDefault();
      }}
    >
      <input type="hidden" name="service_id" value={serviceId} />
      <button
        type="submit"
        disabled={pending}
        data-testid="clear-override-submit"
        className="rounded border border-zinc-300 px-3 py-1 text-sm text-zinc-700 disabled:opacity-50"
      >
        {pending ? "Clearing…" : "Clear override"}
      </button>
      {state && !state.ok && state.error ? (
        <p data-testid="clear-override-error" className="mt-1 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
