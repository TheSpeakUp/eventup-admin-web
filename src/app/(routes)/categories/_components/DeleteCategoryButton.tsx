// src/app/(routes)/categories/_components/DeleteCategoryButton.tsx
"use client";
import { useActionState } from "react";
import { deleteCategoryAction } from "../actions";
import { EMPTY_STATE } from "../action-types";
import Button from "@/app/_components/ui/Button";

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
      <Button
        type="submit"
        variant="danger"
        disabled={pending}
        data-testid="category-delete"
      >
        {pending ? "Deleting…" : "Delete category"}
      </Button>
      {state && !state.ok && state.error ? (
        <p data-testid="category-delete-error" className="text-sm text-red-400">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
