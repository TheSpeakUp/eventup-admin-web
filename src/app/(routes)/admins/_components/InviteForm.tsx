"use client";

import { useStepUpForm } from "@/app/_components/step-up/useStepUpForm";
import { ADMIN_ROLES, type AdminRole } from "@/lib/admins/types";
import { inviteAdminAction } from "../actions";
import { INVITE_EMPTY } from "../action-types";

const DEFAULT_ROLE: AdminRole = "MODERATOR";

export default function InviteForm() {
  const [state, formAction, pending] = useStepUpForm(inviteAdminAction, INVITE_EMPTY, "admin.users.mgmt");

  return (
    <form
      action={formAction}
      data-testid="invite-form"
      // Remount on a successful send so the inputs clear without a
      // setState-in-effect (the lint rule forbids the latter).
      key={state.ok && state.email ? `sent-${state.email}` : "invite-form"}
      className="flex flex-wrap items-end gap-3 rounded-md border border-zinc-200 bg-white p-4"
    >
      <div className="flex flex-col">
        <label htmlFor="invite-email" className="text-xs text-zinc-500">
          Email
        </label>
        <input
          id="invite-email"
          name="email"
          type="email"
          required
          data-testid="invite-email"
          placeholder="new.admin@example.com"
          className="mt-1 w-72 rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
      </div>
      <div className="flex flex-col">
        <label htmlFor="invite-role" className="text-xs text-zinc-500">
          Role
        </label>
        <select
          id="invite-role"
          name="role"
          defaultValue={DEFAULT_ROLE}
          data-testid="invite-role"
          className="mt-1 rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        >
          {ADMIN_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        data-testid="invite-submit"
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:bg-zinc-400"
      >
        {pending ? "Sending…" : "Send invite"}
      </button>
      {!state.ok && state.error ? (
        <p data-testid="invite-error" className="w-full text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      {state.ok && state.email ? (
        <p data-testid="invite-success" className="w-full text-sm text-emerald-700">
          Invitation sent to {state.email}.
        </p>
      ) : null}
    </form>
  );
}
