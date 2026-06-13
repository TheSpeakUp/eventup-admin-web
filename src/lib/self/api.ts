import { apiFetch, type ApiFetchResult } from "@/lib/api";
import type {
  AdminSelfRead,
  LoginHistoryResponse,
  SelfPasswordChangePayload,
  SelfProfileUpdatePayload,
} from "./types";

const BASE = "/eventup-admin/v1/self";

// Own profile. Used by page fetches and the sidebar account block, so the
// default redirect-on-401 behaviour applies (an expired session bounces to
// /login rather than rendering a broken shell).
export function getSelf(): Promise<ApiFetchResult<AdminSelfRead>> {
  return apiFetch<AdminSelfRead>(BASE);
}

// Display-name update. Returns the full profile (same shape as GET) so the
// caller can re-render from the authoritative server value.
export function updateSelfProfile(
  payload: SelfProfileUpdatePayload,
): Promise<ApiFetchResult<AdminSelfRead>> {
  return apiFetch<AdminSelfRead>(`${BASE}/profile`, {
    method: "PATCH",
    body: JSON.stringify(payload),
    redirectOn401: false,
  });
}

// Password change. 204 on success; 422 (new too short), 400 (wrong/same
// current) surface as structured errors for the form.
export function changeSelfPassword(
  payload: SelfPasswordChangePayload,
): Promise<ApiFetchResult<null>> {
  return apiFetch<null>(`${BASE}/password`, {
    method: "POST",
    body: JSON.stringify(payload),
    redirectOn401: false,
  });
}

export function getLoginHistory(
  limit = 50,
  offset = 0,
): Promise<ApiFetchResult<LoginHistoryResponse>> {
  return apiFetch<LoginHistoryResponse>(
    `${BASE}/login-history?limit=${limit}&offset=${offset}`,
  );
}
