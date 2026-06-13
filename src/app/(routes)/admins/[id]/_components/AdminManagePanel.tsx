"use client";

import { useStepUpForm } from "@/app/_components/step-up/useStepUpForm";
import {
  ADMIN_ROLES,
  GRANTABLE_SCOPES,
  type AdminReviewerScopeItem,
  type AdminRole,
} from "@/lib/admins/types";
import {
  grantScopeAction,
  revokeScopeAction,
  updateAdminAction,
} from "../actions";
import { EMPTY_STATE } from "../../action-types";

function RoleActiveForm({
  adminId,
  role,
  isActive,
}: {
  adminId: string;
  role: AdminRole;
  isActive: boolean;
}) {
  const [state, formAction, pending] = useStepUpForm(updateAdminAction, EMPTY_STATE, "admin.users.mgmt");
  return (
    <form
      action={formAction}
      data-testid="admin-update-form"
      className="space-y-3 rounded-md border border-zinc-200 bg-surface-1 p-4"
    >
      <h2 className="text-sm font-semibold text-zinc-700">Role &amp; access</h2>
      <input type="hidden" name="adminId" value={adminId} />
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col">
          <label htmlFor="role" className="text-xs text-zinc-500">
            Role
          </label>
          <select
            id="role"
            name="role"
            defaultValue={role}
            data-testid="admin-role-select"
            className="mt-1 rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-focus"
          >
            {ADMIN_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label htmlFor="is_active" className="text-xs text-zinc-500">
            Status
          </label>
          <select
            id="is_active"
            name="is_active"
            defaultValue={String(isActive)}
            data-testid="admin-active-select"
            className="mt-1 rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-focus"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={pending}
          data-testid="admin-update-submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:bg-zinc-400"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
      {state && !state.ok && state.error ? (
        <p data-testid="admin-update-error" className="text-sm text-red-300">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

function RevokeScopeButton({
  adminId,
  permissionKey,
}: {
  adminId: string;
  permissionKey: string;
}) {
  const [state, formAction, pending] = useStepUpForm(
    revokeScopeAction,
    EMPTY_STATE,
    "admin.users.mgmt",
  );
  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="adminId" value={adminId} />
      <input type="hidden" name="permissionKey" value={permissionKey} />
      <button
        type="submit"
        disabled={pending}
        data-testid={`scope-revoke-${permissionKey}`}
        className="text-xs font-medium text-red-600 hover:text-red-300 disabled:text-zinc-400"
      >
        {pending ? "…" : "Revoke"}
      </button>
      {state && !state.ok && state.error ? (
        <span className="ml-2 text-xs text-red-300">{state.error}</span>
      ) : null}
    </form>
  );
}

function GrantScopeForm({
  adminId,
  heldKeys,
}: {
  adminId: string;
  heldKeys: Set<string>;
}) {
  const [state, formAction, pending] = useStepUpForm(
    grantScopeAction,
    EMPTY_STATE,
    "admin.users.mgmt",
  );
  const available = GRANTABLE_SCOPES.filter((k) => !heldKeys.has(k));
  return (
    <form
      action={formAction}
      data-testid="grant-scope-form"
      className="flex flex-wrap items-end gap-3"
    >
      <input type="hidden" name="adminId" value={adminId} />
      <div className="flex flex-col">
        <label htmlFor="permissionKey" className="text-xs text-zinc-500">
          Grant reviewer scope
        </label>
        <select
          id="permissionKey"
          name="permissionKey"
          data-testid="grant-scope-select"
          disabled={available.length === 0}
          className="mt-1 w-80 rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-focus disabled:bg-zinc-100"
        >
          {available.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={pending || available.length === 0}
        data-testid="grant-scope-submit"
        className="rounded-md border border-zinc-300 bg-surface-1 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:bg-zinc-100 disabled:text-zinc-400"
      >
        {pending ? "Granting…" : "Grant"}
      </button>
      {state && !state.ok && state.error ? (
        <p data-testid="grant-scope-error" className="w-full text-sm text-red-300">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

export default function AdminManagePanel({
  adminId,
  role,
  isActive,
  scopes,
}: {
  adminId: string;
  role: AdminRole;
  isActive: boolean;
  scopes: AdminReviewerScopeItem[];
}) {
  const heldKeys = new Set(scopes.map((s) => s.permission_key));
  return (
    <div className="space-y-6">
      {/* Key on the server-authoritative role/status so a successful save (which
          revalidates these props) remounts the form, re-seeding the uncontrolled
          selects' defaultValue. Without this the React-19 post-submit form reset
          can strand a select on its stale value while the header badges already
          show the new one. */}
      <RoleActiveForm
        key={`${role}:${String(isActive)}`}
        adminId={adminId}
        role={role}
        isActive={isActive}
      />

      <div className="space-y-3 rounded-md border border-zinc-200 bg-surface-1 p-4">
        <h2 className="text-sm font-semibold text-zinc-700">Reviewer scopes</h2>
        {scopes.length === 0 ? (
          <p data-testid="scopes-empty" className="text-sm text-zinc-500">
            No reviewer scopes granted.
          </p>
        ) : (
          <ul data-testid="scopes-list" className="divide-y divide-zinc-100">
            {scopes.map((s) => (
              <li
                key={s.permission_key}
                className="flex items-center justify-between py-2"
              >
                <code className="text-xs text-zinc-700">{s.permission_key}</code>
                <RevokeScopeButton
                  adminId={adminId}
                  permissionKey={s.permission_key}
                />
              </li>
            ))}
          </ul>
        )}
        <GrantScopeForm adminId={adminId} heldKeys={heldKeys} />
      </div>
    </div>
  );
}
