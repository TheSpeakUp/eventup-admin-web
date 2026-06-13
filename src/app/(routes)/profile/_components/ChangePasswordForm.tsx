"use client";

import { useActionState } from "react";
import { changePasswordAction } from "../actions";
import { FORM_EMPTY } from "../action-types";
import { NEW_PASSWORD_MIN_LENGTH } from "@/lib/self/types";

function Field({
  id,
  label,
  testId,
}: {
  id: string;
  label: string;
  testId: string;
}) {
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="text-xs text-zinc-500">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type="password"
        autoComplete={id === "current_password" ? "current-password" : "new-password"}
        data-testid={testId}
        className="mt-1 w-full max-w-sm rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
      />
    </div>
  );
}

export default function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(
    changePasswordAction,
    FORM_EMPTY,
  );
  return (
    <form action={formAction} data-testid="password-form" className="space-y-3">
      <Field
        id="current_password"
        label="Current password"
        testId="current-password-input"
      />
      <Field
        id="new_password"
        label={`New password (min ${NEW_PASSWORD_MIN_LENGTH} characters)`}
        testId="new-password-input"
      />
      <Field
        id="confirm_password"
        label="Confirm new password"
        testId="confirm-password-input"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          data-testid="password-submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:bg-zinc-400"
        >
          {pending ? "Updating…" : "Update password"}
        </button>
        {state.ok && state.done ? (
          <span data-testid="password-success" className="text-sm text-emerald-700">
            Password updated.
          </span>
        ) : null}
      </div>
      {!state.ok && state.error ? (
        <p data-testid="password-error" className="text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
