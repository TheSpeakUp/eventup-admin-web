"use client";
import { useActionState } from "react";
import { deleteBindingAction } from "../actions";
import { EMPTY_STATE } from "../action-types";

export function DeleteBindingButton({
  categoryId,
  attributeKey,
}: {
  categoryId: number;
  attributeKey: string;
}) {
  const [state, formAction, pending] = useActionState(
    deleteBindingAction,
    EMPTY_STATE,
  );
  return (
    <form
      action={formAction}
      data-testid="binding-delete-form"
      onSubmit={(e) => {
        if (!confirm("Unbind this attribute from the category?")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="category_id" value={categoryId} />
      <input type="hidden" name="attribute_key" value={attributeKey} />
      <button
        type="submit"
        disabled={pending}
        data-testid="binding-delete"
        className="rounded border border-red-300 px-4 py-2 text-red-700"
      >
        {pending ? "Deleting…" : "Delete binding"}
      </button>
      {state && !state.ok && state.error ? (
        <p data-testid="binding-delete-error" className="text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
