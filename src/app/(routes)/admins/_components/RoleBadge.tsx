import Badge, { type BadgeTone } from "@/app/_components/ui/Badge";
import type { AdminRole } from "@/lib/admins/types";

const ROLE_TONE: Record<AdminRole, BadgeTone> = {
  SUPERADMIN: "violet",
  ADMIN: "info",
  MODERATOR: "neutral",
};

export function RoleBadge({ role }: { role: AdminRole }) {
  return <Badge tone={ROLE_TONE[role]}>{role}</Badge>;
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <Badge tone={active ? "success" : "neutral"}>
      {active ? "Active" : "Inactive"}
    </Badge>
  );
}
