import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdmin } from "@/lib/admins/api";
import { ActiveBadge, RoleBadge } from "../_components/RoleBadge";
import AdminManagePanel from "./_components/AdminManagePanel";

function fmtDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

export default async function AdminDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getAdmin(id);

  if (!result.ok) {
    if (result.status === 404) notFound();
    return (
      <div className="p-8">
        <Link href="/admins" className="text-sm text-blue-600 hover:text-blue-800">
          ← Admin team
        </Link>
        <div
          data-testid="admin-detail-error"
          className="mt-6 rounded-md border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
        >
          {result.status === 403
            ? "Managing the admin team requires the SUPERADMIN role."
            : `Failed to load admin: ${result.message}`}
        </div>
      </div>
    );
  }

  const admin = result.data;

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <Link href="/admins" className="text-sm text-blue-600 hover:text-blue-800">
        ← Admin team
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="admin-detail-email">
            {admin.email}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {admin.display_name ?? "No display name"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RoleBadge role={admin.role} />
          <ActiveBadge active={admin.is_active} />
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-md border border-zinc-200 bg-surface-1 p-4 text-sm">
        <dt className="text-zinc-500">Created</dt>
        <dd className="text-zinc-800">{fmtDate(admin.created_at)}</dd>
        <dt className="text-zinc-500">Last login</dt>
        <dd className="text-zinc-800">{fmtDate(admin.last_login_at)}</dd>
      </dl>

      <AdminManagePanel
        adminId={admin.id}
        role={admin.role}
        isActive={admin.is_active}
        scopes={admin.reviewer_scopes}
      />
    </div>
  );
}
