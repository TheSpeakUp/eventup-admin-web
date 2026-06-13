// src/app/(routes)/quality/_components/RollbackConfigButton.tsx
"use client";
import { useActionState } from "react";
import { rollbackFormulaConfigAction } from "../actions";
import { EMPTY_STATE } from "../action-types";
import Button from "@/app/_components/ui/Button";

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
      <Button
        type="submit"
        variant="secondary"
        disabled={pending}
        data-testid="formula-rollback"
      >
        {pending ? "Rolling back…" : "Roll back to previous version"}
      </Button>
      {state && !state.ok && state.error ? (
        <p
          data-testid="formula-rollback-error"
          className="mt-1 text-xs text-red-400"
        >
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
