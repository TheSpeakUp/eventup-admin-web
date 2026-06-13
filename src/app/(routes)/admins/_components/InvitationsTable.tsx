"use client";

import { useStepUpForm } from "@/app/_components/step-up/useStepUpForm";
import Badge, { type BadgeTone } from "@/app/_components/ui/Badge";
import type { AdminInvitationItem } from "@/lib/admins/types";
import { RoleBadge } from "./RoleBadge";
import { revokeInvitationAction } from "../actions";
import { EMPTY_STATE } from "../action-types";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/app/_components/ui/Table";
import EmptyState from "@/app/_components/ui/EmptyState";

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
      <EmptyState data-testid="invitations-empty">No invitations.</EmptyState>
    );
  }
  return (
    <div className="overflow-x-auto rounded-md border border-zinc-200">
      <Table data-testid="invitations-table" className="min-w-full">
        <Thead>
          <tr>
            <Th>Email</Th>
            <Th>Role</Th>
            <Th>Status</Th>
            <Th>Expires</Th>
            <Th className="text-right">Action</Th>
          </tr>
        </Thead>
        <Tbody>
          {rows.map((inv) => {
            const status = statusLabel(inv);
            const revocable = !inv.is_accepted;
            return (
              <Tr key={inv.id}>
                <Td className="text-zinc-900">{inv.email}</Td>
                <Td>
                  <RoleBadge role={inv.role} />
                </Td>
                <Td>
                  <Badge tone={status.tone}>{status.text}</Badge>
                </Td>
                <Td className="text-zinc-600">{fmtDate(inv.expires_at)}</Td>
                <Td className="text-right">
                  {revocable ? <RevokeButton id={inv.id} /> : <span className="text-zinc-400">—</span>}
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </div>
  );
}
