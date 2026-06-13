import Link from "next/link";
import type { AdminListItem } from "@/lib/admins/types";
import { ActiveBadge, RoleBadge } from "./RoleBadge";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/app/_components/ui/Table";
import EmptyState from "@/app/_components/ui/EmptyState";

function fmtDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

export default function AdminsTable({ rows }: { rows: AdminListItem[] }) {
  if (rows.length === 0) {
    return <EmptyState data-testid="admins-empty">No admins yet.</EmptyState>;
  }
  return (
    <div className="overflow-x-auto">
      <Table data-testid="admins-table" className="min-w-full">
        <Thead>
          <tr>
            <Th>Email</Th>
            <Th>Name</Th>
            <Th>Role</Th>
            <Th>Status</Th>
            <Th>Last login</Th>
            <Th className="text-right">Manage</Th>
          </tr>
        </Thead>
        <Tbody>
          {rows.map((row) => (
            <Tr key={row.id}>
              <Td className="text-zinc-900">{row.email}</Td>
              <Td className="text-zinc-600">{row.display_name ?? "—"}</Td>
              <Td>
                <RoleBadge role={row.role} />
              </Td>
              <Td>
                <ActiveBadge active={row.is_active} />
              </Td>
              <Td className="text-zinc-600">{fmtDate(row.last_login_at)}</Td>
              <Td className="text-right">
                <Link
                  href={`/admins/${row.id}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  Manage
                </Link>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </div>
  );
}
