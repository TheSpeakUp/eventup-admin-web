"use server";

import { apiFetch } from "@/lib/api";

type ChallengeResponse = {
  success: boolean;
  challenge_id: string;
  method: string;
  expires_in_seconds: number;
  delivery_hint: string;
};

type VerifyResponse = {
  success: boolean;
  permissions: string[];
  expires_in_seconds: number;
};

export type ChallengeResult =
  | { ok: true; challengeId: string; deliveryHint: string; expiresInSeconds: number }
  | { ok: false; error: string };

export type VerifyResult =
  | { ok: true }
  | { ok: false; error: string; attemptsExceeded?: boolean };

export async function requestStepUpChallenge(permissions: string[]): Promise<ChallengeResult> {
  const result = await apiFetch<ChallengeResponse>(
    "/eventup-admin/v1/auth/mfa/challenge",
    {
      method: "POST",
      body: JSON.stringify({ permissions }),
      redirectOn401: false,
    },
  );
  if (!result.ok) {
    return { ok: false, error: result.message ?? "Could not start verification" };
  }
  return {
    ok: true,
    challengeId: result.data.challenge_id,
    deliveryHint: result.data.delivery_hint,
    expiresInSeconds: result.data.expires_in_seconds,
  };
}

export async function verifyStepUp(challengeId: string, code: string): Promise<VerifyResult> {
  const result = await apiFetch<VerifyResponse>(
    "/eventup-admin/v1/auth/mfa/verify",
    {
      method: "POST",
      body: JSON.stringify({ challenge_id: challengeId, code }),
      redirectOn401: false,
    },
  );
  if (!result.ok) {
    const attemptsExceeded = /attempts/i.test(result.message ?? "");
    return {
      ok: false,
      error: attemptsExceeded
        ? "Too many attempts — request a new code."
        : "Invalid or expired code.",
      attemptsExceeded,
    };
  }
  return { ok: true };
}
