"use client";

import { useActionState } from "react";
import { acceptInvitationAction, type AcceptState } from "./actions";

const INITIAL: AcceptState = { error: null };

export default function AcceptForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(
    acceptInvitationAction,
    INITIAL,
  );
  return (
    <form action={formAction} data-testid="accept-form" className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={12}
          data-testid="accept-password"
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-focus"
        />
        <p className="mt-1 text-xs text-zinc-500">At least 12 characters.</p>
      </div>
      <div>
        <label htmlFor="confirm" className="block text-sm font-medium text-zinc-700">
          Confirm password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          minLength={12}
          data-testid="accept-confirm"
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-focus"
        />
      </div>
      {state.error ? (
        <p data-testid="accept-error" className="text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        data-testid="accept-submit"
        className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:bg-zinc-400"
      >
        {pending ? "Activating…" : "Set password & activate"}
      </button>
    </form>
  );
}
