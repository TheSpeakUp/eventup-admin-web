// src/app/(routes)/attribute-definitions/_components/DeleteAttributeDefinitionButton.tsx
"use client";
import { useActionState } from "react";
import { deleteAttributeDefinitionAction } from "../actions";
import { EMPTY_STATE } from "../action-types";

export function DeleteAttributeDefinitionButton({ attrKey }: { attrKey: string }) {
  const [state, formAction, pending] = useActionState(
    deleteAttributeDefinitionAction,
    EMPTY_STATE,
  );
  return (
    <form
      action={formAction}
      data-testid="attribute-definition-delete-form"
      onSubmit={(e) => {
        if (!confirm("Delete this attribute definition? This cannot be undone.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="key" value={attrKey} />
      <button
        type="submit"
        disabled={pending}
        data-testid="attribute-definition-delete"
        className="rounded border border-red-300 px-4 py-2 text-red-300"
      >
        {pending ? "Deleting…" : "Delete attribute definition"}
      </button>
      {state && !state.ok && state.error ? (
        <p
          data-testid="attribute-definition-delete-error"
          className="text-sm text-red-300"
        >
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
