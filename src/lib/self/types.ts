import type { AdminRole } from "@/lib/admins/types";

// MFA channel info as surfaced by GET /eventup-admin/v1/self. Email OTP is the
// only channel today; `enrolled` is always true (no enroll step) and `enforced`
// reflects whether step-up gates high-risk actions (currently true on prod).
export type SelfMfaInfo = {
  method: "email_otp";
  enrolled: boolean;
  enforced: boolean;
};

export type AdminSelfRead = {
  id: string;
  email: string;
  role: AdminRole;
  display_name: string | null;
  last_login_at: string | null;
  is_active: boolean;
  mfa: SelfMfaInfo;
};

// PATCH /self/profile — send `null` to clear the display name.
export type SelfProfileUpdatePayload = {
  display_name: string | null;
};

// POST /self/password
export type SelfPasswordChangePayload = {
  current_password: string;
  new_password: string;
};

export const NEW_PASSWORD_MIN_LENGTH = 12;

export type LoginHistoryItem = {
  id: string;
  occurred_at: string;
  success: boolean;
  ip_address: string | null;
  user_agent: string | null;
};

export type LoginHistoryResponse = {
  items: LoginHistoryItem[];
  total: number;
};
