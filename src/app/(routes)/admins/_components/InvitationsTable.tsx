"use client";

import { useStepUpForm } from "@/app/_components/step-up/useStepUpForm";
import Badge, { type BadgeTone } from "@/app/_components/ui/Badge";
import type { AdminInvitationItem } from "@/lib/admins/types";
import { RoleBadge } from "./RoleBadge";
import { revokeInvitationAction } from "../actions";
import { EMPTY_STATE } from "../action-types";

function fmtDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

function statusLabel(inv: AdminInvitationItem): {
  text: string;
  tone: BadgeTone;
} {
  if (inv.is_accepted) return { text: "Accepted", tone: "success" };
  if (inv.is_expired) return { text: "Expired", tone: "neutral" };
  return { text: "Pending", tone: "warning" };
}

function RevokeButton({ id }: { id: string }) {
  const [state, formAction, pending] = useStepUpForm(revokeInvitationAction, EMPTY_STATE, "admin.users.mgmt");
  return (
    <form action={formAction} className="inline-flex flex-col items-end">
      <input type="hidden" name="invitationId" value={id} />
      <button
        type="submit"
        disabled={pending}
        data-testid={`invitation-revoke-${id}`}
        className="text-sm font-medium text-red-600 hover:text-red-300 disabled:text-zinc-400"
      >
        {pending ? "Revoking…" : "Revoke"}
      </button>
      {state && !state.ok && state.error ? (
        <span className="text-xs text-red-300">{state.error}</span>
      ) : null}
    </form>
  );
}

export default function InvitationsTable({
  rows,
}: {
  rows: AdminInvitationItem[];
}) {
  if (rows.length === 0) {
    return (
      <p data-testid="invitations-empty" className="text-sm text-zinc-500">
        No invitations.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-md border border-zinc-200">
      <table
        data-testid="invitations-table"
        className="min-w-full divide-y divide-zinc-200 text-sm"
      >
        <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium">Email</th>
            <th className="px-4 py-2.5 text-left font-medium">Role</th>
            <th className="px-4 py-2.5 text-left font-medium">Status</th>
            <th className="px-4 py-2.5 text-left font-medium">Expires</th>
            <th className="px-4 py-2.5 text-right font-medium">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rows.map((inv) => {
            const status = statusLabel(inv);
            const revocable = !inv.is_accepted;
            return (
              <tr key={inv.id} className="hover:bg-zinc-50">
                <td className="px-4 py-2.5 text-zinc-900">{inv.email}</td>
                <td className="px-4 py-2.5">
                  <RoleBadge role={inv.role} />
                </td>
                <td className="px-4 py-2.5">
                  <Badge tone={status.tone}>{status.text}</Badge>
                </td>
                <td className="px-4 py-2.5 text-zinc-600">
                  {fmtDate(inv.expires_at)}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {revocable ? <RevokeButton id={inv.id} /> : <span className="text-zinc-400">—</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
