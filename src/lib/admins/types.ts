export const ADMIN_ROLES = ["MODERATOR", "ADMIN", "SUPERADMIN"] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export function isAdminRole(value: string): value is AdminRole {
  return (ADMIN_ROLES as readonly string[]).includes(value);
}

// Reviewer-scope permission keys an operator can grant. The backend validates
// against the full AdminPermission catalogue; this is the curated subset that
// the DB-grant reviewer-scope dep actually consults (marketplace moderation).
export const GRANTABLE_SCOPES = [
  "admin.marketplace.services.moderate",
  "admin.marketplace.offers.moderate",
  "admin.marketplace.offers.dispatch",
  "admin.marketplace.providers.dispatch",
  "admin.marketplace.providers.risk",
  "admin.marketplace.promos.manage",
] as const;

export type AdminListItem = {
  id: string;
  email: string;
  role: AdminRole;
  is_active: boolean;
  display_name: string | null;
  last_login_at: string | null;
};

export type AdminListResponse = {
  items: AdminListItem[];
  total: number;
};

export type AdminReviewerScopeItem = {
  permission_key: string;
  granted_at: string;
  granted_by_admin_id: string | null;
};

export type AdminDetail = AdminListItem & {
  created_at: string;
  reviewer_scopes: AdminReviewerScopeItem[];
};

export type AdminInvitationItem = {
  id: string;
  email: string;
  role: AdminRole;
  invited_by_admin_id: string | null;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  is_expired: boolean;
  is_accepted: boolean;
};

export type AdminInvitationListResponse = {
  items: AdminInvitationItem[];
  total: number;
};

export type AdminUpdatePayload = {
  role?: AdminRole;
  is_active?: boolean;
};
