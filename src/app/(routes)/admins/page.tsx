import { listAdmins, listInvitations } from "@/lib/admins/api";
import AdminsTable from "./_components/AdminsTable";
import InviteForm from "./_components/InviteForm";
import InvitationsTable from "./_components/InvitationsTable";

export default async function AdminsPage() {
  const [adminsR, invitationsR] = await Promise.all([
    listAdmins(),
    listInvitations(),
  ]);

  if (!adminsR.ok) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold">Admin team</h1>
        <div
          data-testid="admins-error"
          className="mt-6 rounded-md border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
        >
          {adminsR.status === 403
            ? "Managing the admin team requires the SUPERADMIN role."
            : `Failed to load admins: ${adminsR.message}`}
        </div>
      </div>
    );
  }

  const admins = adminsR.data.items;
  const invitations = invitationsR.ok ? invitationsR.data.items : [];

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin team</h1>
        <span className="text-xs text-zinc-500" data-testid="admins-count">
          {admins.length} admin{admins.length === 1 ? "" : "s"}
        </span>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-700">Invite a new admin</h2>
        <InviteForm />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-700">Admins</h2>
        <AdminsTable rows={admins} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-700">
          Pending invitations
        </h2>
        <InvitationsTable rows={invitations} />
      </section>
    </div>
  );
}
