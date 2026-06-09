import type {
  AdminDetail,
  AdminInvitationItem,
  AdminReviewerScopeItem,
  AdminRole,
} from "@/lib/admins/types";

// RFC-4122-valid v4 UUIDs (version nibble 4, variant nibble 8) — the server
// actions validate ids with Zod's strict .uuid(), which checks version/variant
// bits, so the mock ids must be well-formed (the real backend issues uuid4).
const SUPER_ID = "11111111-1111-4111-8111-111111111111";
const ADMIN_ID = "22222222-2222-4222-8222-222222222222";
const MOD_ID = "33333333-3333-4333-8333-333333333333";
const INVITE_ID = "44444444-4444-4444-8444-444444444444";

const admins = new Map<string, AdminDetail>();
const invitations = new Map<string, AdminInvitationItem>();
let seq = 1000;

function nextId(): string {
  seq += 1;
  return `90000000-0000-4000-8000-${String(seq).padStart(12, "0")}`;
}

function seedAdmin(
  id: string,
  email: string,
  role: AdminRole,
  extra: Partial<AdminDetail> = {},
): AdminDetail {
  return {
    id,
    email,
    role,
    is_active: true,
    display_name: null,
    last_login_at: "2026-06-09T10:00:00Z",
    created_at: "2026-01-01T00:00:00Z",
    reviewer_scopes: [],
    ...extra,
  };
}

function ensureSeed(): void {
  if (admins.size > 0) return;
  admins.set(SUPER_ID, seedAdmin(SUPER_ID, "admin@example.com", "SUPERADMIN", {
    display_name: "Root Operator",
  }));
  admins.set(ADMIN_ID, seedAdmin(ADMIN_ID, "ops@example.com", "ADMIN"));
  admins.set(MOD_ID, seedAdmin(MOD_ID, "mod@example.com", "MODERATOR", {
    reviewer_scopes: [
      {
        permission_key: "admin.marketplace.services.moderate",
        granted_at: "2026-05-01T00:00:00Z",
        granted_by_admin_id: SUPER_ID,
      },
    ],
  }));
  invitations.set(
    INVITE_ID,
    {
      id: INVITE_ID,
      email: "invited@example.com",
      role: "MODERATOR",
      invited_by_admin_id: SUPER_ID,
      expires_at: "2099-01-01T00:00:00Z",
      accepted_at: null,
      created_at: "2026-06-08T00:00:00Z",
      is_expired: false,
      is_accepted: false,
    },
  );
}

export function resetAdminsStore(): void {
  admins.clear();
  invitations.clear();
  seq = 1000;
  ensureSeed();
}

export function getAllAdmins(): AdminDetail[] {
  ensureSeed();
  return Array.from(admins.values());
}

export function getAdminById(id: string): AdminDetail | null {
  ensureSeed();
  return admins.get(id) ?? null;
}

export function updateAdminRecord(
  id: string,
  patch: { role?: AdminRole; is_active?: boolean },
): AdminDetail | null {
  const a = getAdminById(id);
  if (!a) return null;
  const updated: AdminDetail = {
    ...a,
    role: patch.role ?? a.role,
    is_active: patch.is_active ?? a.is_active,
  };
  admins.set(id, updated);
  return updated;
}

export function grantScopeRecord(
  id: string,
  key: string,
): AdminReviewerScopeItem | null {
  const a = getAdminById(id);
  if (!a) return null;
  if (a.reviewer_scopes.some((s) => s.permission_key === key)) return null; // duplicate
  const scope: AdminReviewerScopeItem = {
    permission_key: key,
    granted_at: new Date().toISOString(),
    granted_by_admin_id: SUPER_ID,
  };
  admins.set(id, { ...a, reviewer_scopes: [...a.reviewer_scopes, scope] });
  return scope;
}

export function revokeScopeRecord(id: string, key: string): boolean {
  const a = getAdminById(id);
  if (!a) return false;
  const next = a.reviewer_scopes.filter((s) => s.permission_key !== key);
  if (next.length === a.reviewer_scopes.length) return false;
  admins.set(id, { ...a, reviewer_scopes: next });
  return true;
}

export function getAllInvitations(): AdminInvitationItem[] {
  ensureSeed();
  return Array.from(invitations.values());
}

export function createInvitationRecord(
  email: string,
  role: AdminRole,
): AdminInvitationItem {
  ensureSeed();
  const id = nextId();
  const inv: AdminInvitationItem = {
    id,
    email,
    role,
    invited_by_admin_id: SUPER_ID,
    expires_at: "2099-01-01T00:00:00Z",
    accepted_at: null,
    created_at: new Date().toISOString(),
    is_expired: false,
    is_accepted: false,
  };
  invitations.set(id, inv);
  return inv;
}

export function deleteInvitationRecord(id: string): boolean {
  ensureSeed();
  return invitations.delete(id);
}
