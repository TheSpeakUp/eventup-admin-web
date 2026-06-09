import Link from "next/link";
import type { AdminListItem } from "@/lib/admins/types";
import { ActiveBadge, RoleBadge } from "./RoleBadge";

function fmtDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

export default function AdminsTable({ rows }: { rows: AdminListItem[] }) {
  if (rows.length === 0) {
    return (
      <p data-testid="admins-empty" className="text-sm text-zinc-500">
        No admins yet.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-md border border-zinc-200">
      <table
        data-testid="admins-table"
        className="min-w-full divide-y divide-zinc-200 text-sm"
      >
        <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium">Email</th>
            <th className="px-4 py-2.5 text-left font-medium">Name</th>
            <th className="px-4 py-2.5 text-left font-medium">Role</th>
            <th className="px-4 py-2.5 text-left font-medium">Status</th>
            <th className="px-4 py-2.5 text-left font-medium">Last login</th>
            <th className="px-4 py-2.5 text-right font-medium">Manage</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-zinc-50">
              <td className="px-4 py-2.5 text-zinc-900">{row.email}</td>
              <td className="px-4 py-2.5 text-zinc-600">
                {row.display_name ?? "—"}
              </td>
              <td className="px-4 py-2.5">
                <RoleBadge role={row.role} />
              </td>
              <td className="px-4 py-2.5">
                <ActiveBadge active={row.is_active} />
              </td>
              <td className="px-4 py-2.5 text-zinc-600">
                {fmtDate(row.last_login_at)}
              </td>
              <td className="px-4 py-2.5 text-right">
                <Link
                  href={`/admins/${row.id}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  Manage
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
