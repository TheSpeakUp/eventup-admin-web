import { apiFetch, type ApiFetchResult } from "@/lib/api";
import { buildApiUrl } from "@/lib/api-config";
import type {
  AdminDetail,
  AdminInvitationItem,
  AdminInvitationListResponse,
  AdminListItem,
  AdminListResponse,
  AdminReviewerScopeItem,
  AdminRole,
  AdminUpdatePayload,
} from "./types";

const BASE = "/eventup-admin/v1/admins";

// Admin teams are small (backend caps page size at 200); fetch a single page.
const PAGE_LIMIT = 200;

export function listAdmins(): Promise<ApiFetchResult<AdminListResponse>> {
  return apiFetch<AdminListResponse>(`${BASE}?limit=${PAGE_LIMIT}`);
}

export function getAdmin(id: string): Promise<ApiFetchResult<AdminDetail>> {
  return apiFetch<AdminDetail>(`${BASE}/${id}`);
}

export function listInvitations(): Promise<
  ApiFetchResult<AdminInvitationListResponse>
> {
  return apiFetch<AdminInvitationListResponse>(
    `${BASE}/invitations?limit=${PAGE_LIMIT}`,
  );
}

export function createInvitation(
  email: string,
  role: AdminRole,
): Promise<ApiFetchResult<AdminInvitationItem>> {
  return apiFetch<AdminInvitationItem>(`${BASE}/invitations`, {
    method: "POST",
    body: JSON.stringify({ email, role }),
    redirectOn401: false,
  });
}

export function revokeInvitation(
  id: string,
): Promise<ApiFetchResult<null>> {
  return apiFetch<null>(`${BASE}/invitations/${id}`, {
    method: "DELETE",
    redirectOn401: false,
  });
}

export function updateAdmin(
  id: string,
  payload: AdminUpdatePayload,
): Promise<ApiFetchResult<AdminListItem>> {
  return apiFetch<AdminListItem>(`${BASE}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
    redirectOn401: false,
  });
}

export function grantReviewerScope(
  id: string,
  permissionKey: string,
): Promise<ApiFetchResult<AdminReviewerScopeItem>> {
  return apiFetch<AdminReviewerScopeItem>(`${BASE}/${id}/reviewer-scopes`, {
    method: "POST",
    body: JSON.stringify({ permission_key: permissionKey }),
    redirectOn401: false,
  });
}

export function revokeReviewerScope(
  id: string,
  permissionKey: string,
): Promise<ApiFetchResult<null>> {
  return apiFetch<null>(
    `${BASE}/${id}/reviewer-scopes/${encodeURIComponent(permissionKey)}`,
    { method: "DELETE", redirectOn401: false },
  );
}

export type AcceptInvitationResult =
  | { ok: true }
  | { ok: false; status: number; message: string };

/**
 * Accept an invitation. UNAUTHENTICATED — the single-use token IS the auth, so
 * this bypasses {@link apiFetch} (which attaches the operator's bearer token)
 * and posts directly. Used from the public /invitations/[token] page.
 */
export async function acceptInvitation(
  token: string,
  password: string,
): Promise<AcceptInvitationResult> {
  let res: Response;
  try {
    res = await fetch(
      buildApiUrl(`${BASE}/invitations/${encodeURIComponent(token)}/accept`),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        cache: "no-store",
      },
    );
  } catch {
    return { ok: false, status: 0, message: "Network error contacting admin API" };
  }
  if (res.ok) return { ok: true };
  let message = `Request failed (${res.status})`;
  try {
    const body = (await res.json()) as {
      detail?: string;
      message?: string;
      error?: { message?: string; meta?: { original_detail?: string } };
    };
    message =
      body?.error?.meta?.original_detail ??
      body?.error?.message ??
      body?.detail ??
      body?.message ??
      message;
  } catch {
    // keep generic message
  }
  return { ok: false, status: res.status, message };
}
