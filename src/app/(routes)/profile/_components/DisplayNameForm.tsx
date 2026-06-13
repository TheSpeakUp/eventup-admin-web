"use client";

import { useActionState } from "react";
import { updateProfileAction } from "../actions";
import { FORM_EMPTY } from "../action-types";

export default function DisplayNameForm({
  displayName,
}: {
  displayName: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    FORM_EMPTY,
  );
  return (
    <form
      // Re-seed the uncontrolled input from the server value after a successful
      // save (the parent revalidates, changing `displayName`); keying on it
      // remounts the field so a cleared/renamed value sticks without a reload.
      key={displayName ?? ""}
      action={formAction}
      data-testid="display-name-form"
      className="space-y-3"
    >
      <div className="flex flex-col">
        <label htmlFor="display_name" className="text-xs text-zinc-500">
          Display name
        </label>
        <input
          id="display_name"
          name="display_name"
          type="text"
          maxLength={255}
          defaultValue={displayName ?? ""}
          placeholder="No display name"
          data-testid="display-name-input"
          className="mt-1 w-full max-w-sm rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
        <p className="mt-1 text-xs text-zinc-400">
          Leave empty to clear. Shown across the admin console.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          data-testid="display-name-submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:bg-zinc-400"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {state.ok && state.done ? (
          <span data-testid="display-name-success" className="text-sm text-emerald-700">
            Saved.
          </span>
        ) : null}
      </div>
      {!state.ok && state.error ? (
        <p data-testid="display-name-error" className="text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
