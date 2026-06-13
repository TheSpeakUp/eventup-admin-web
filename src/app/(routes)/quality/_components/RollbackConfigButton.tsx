// src/app/(routes)/quality/_components/RollbackConfigButton.tsx
"use client";
import { useActionState } from "react";
import { rollbackFormulaConfigAction } from "../actions";
import { EMPTY_STATE } from "../action-types";

// Confirm-then-rollback to the previous formula version. No payload — the
// backend resolves the previous-active config. Structured errors render inline.
export default function RollbackConfigButton() {
  const [state, formAction, pending] = useActionState(
    rollbackFormulaConfigAction,
    EMPTY_STATE,
  );
  return (
    <form
      action={formAction}
      data-testid="formula-rollback-form"
      onSubmit={(e) => {
        if (!confirm("Roll back to the previous formula version?"))
          e.preventDefault();
      }}
    >
      <button
        type="submit"
        disabled={pending}
        data-testid="formula-rollback"
        className="rounded border border-amber-300 px-3 py-1 text-sm text-amber-800 disabled:opacity-50"
      >
        {pending ? "Rolling back…" : "Roll back to previous version"}
      </button>
      {state && !state.ok && state.error ? (
        <p
          data-testid="formula-rollback-error"
          className="mt-1 text-xs text-red-300"
        >
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
