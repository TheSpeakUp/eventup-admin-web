// src/app/(routes)/quality/_components/ActivateConfigButton.tsx
"use client";
import { useActionState } from "react";
import { activateFormulaConfigAction } from "../actions";
import { EMPTY_STATE } from "../action-types";

// Confirm-then-activate a formula config. On a backend rejection (e.g. already
// active) the structured error rides back through ActionState and renders
// inline — same idiom as CancelCampaignButton.
export default function ActivateConfigButton({ id }: { id: number }) {
  const [state, formAction, pending] = useActionState(
    activateFormulaConfigAction,
    EMPTY_STATE,
  );
  return (
    <form
      action={formAction}
      data-testid={`formula-activate-${id}-form`}
      onSubmit={(e) => {
        if (!confirm("Activate this formula version? It becomes the live ranking formula."))
          e.preventDefault();
      }}
    >
      <input type="hidden" name="config_id" value={id} />
      <button
        type="submit"
        disabled={pending}
        data-testid={`formula-activate-${id}`}
        className="rounded border border-emerald-300 px-2 py-0.5 text-xs text-emerald-800 disabled:opacity-50"
      >
        {pending ? "…" : "Activate"}
      </button>
      {state && !state.ok && state.error ? (
        <p
          data-testid={`formula-activate-${id}-error`}
          className="mt-1 text-xs text-red-700"
        >
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
