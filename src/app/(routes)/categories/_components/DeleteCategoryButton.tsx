// src/app/(routes)/categories/_components/DeleteCategoryButton.tsx
"use client";
import { useActionState } from "react";
import { deleteCategoryAction } from "../actions";
import { EMPTY_STATE } from "../action-types";

export function DeleteCategoryButton({ id }: { id: number }) {
  const [state, formAction, pending] = useActionState(
    deleteCategoryAction,
    EMPTY_STATE,
  );
  return (
    <form
      action={formAction}
      data-testid="category-delete-form"
      onSubmit={(e) => {
        if (!confirm("Delete this category? This cannot be undone.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        data-testid="category-delete"
        className="rounded border border-red-300 px-4 py-2 text-red-300"
      >
        {pending ? "Deleting…" : "Delete category"}
      </button>
      {state && !state.ok && state.error ? (
        <p data-testid="category-delete-error" className="text-sm text-red-300">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
