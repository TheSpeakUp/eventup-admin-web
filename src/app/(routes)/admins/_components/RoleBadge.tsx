import type { AdminRole } from "@/lib/admins/types";

const ROLE_CLASS: Record<AdminRole, string> = {
  SUPERADMIN: "bg-violet-100 text-violet-800 ring-violet-200",
  ADMIN: "bg-blue-100 text-blue-800 ring-blue-200",
  MODERATOR: "bg-zinc-100 text-zinc-700 ring-zinc-200",
};

export function RoleBadge({ role }: { role: AdminRole }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${ROLE_CLASS[role]}`}
    >
      {role}
    </span>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  const cls = active
    ? "bg-emerald-100 text-emerald-800 ring-emerald-200"
    : "bg-zinc-100 text-zinc-500 ring-zinc-200";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}
