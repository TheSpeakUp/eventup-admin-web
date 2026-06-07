"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { postLogin } from "@/lib/api";
import {
  DEFAULT_ACCESS_MAX_AGE_SECONDS,
  writeAccessCookie,
  writeRefreshCookie,
} from "@/lib/auth/cookies";
import { isMockAuthEnabled, issueMockTokens, isValidMockCredentials } from "@/lib/auth/mock";
import { decodeAccessToken } from "@/lib/auth/session";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
  next: z.string().optional(),
});

export type LoginFormState = {
  error: string | null;
};

const SAFE_NEXT = /^\/(?!\/)/;

function safeNext(value: string | undefined): string {
  if (!value) return "/";
  if (value.startsWith("/login")) return "/";
  if (!SAFE_NEXT.test(value)) return "/";
  return value;
}

function computeMaxAge(expSeconds: number | undefined): number {
  if (!expSeconds) return DEFAULT_ACCESS_MAX_AGE_SECONDS;
  const now = Math.floor(Date.now() / 1000);
  const remaining = expSeconds - now;
  if (remaining <= 0) return DEFAULT_ACCESS_MAX_AGE_SECONDS;
  return Math.min(remaining, DEFAULT_ACCESS_MAX_AGE_SECONDS * 4);
}

export async function loginAction(
  _prev: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { email, password } = parsed.data;
  const next = safeNext(parsed.data.next);

  let tokens;
  if (isMockAuthEnabled()) {
    if (!isValidMockCredentials(email, password)) {
      return { error: "Invalid email or password" };
    }
    tokens = await issueMockTokens(email);
  } else {
    const result = await postLogin({ email, password });
    if (!result.ok) {
      const msg =
        result.error.status === 401 || result.error.status === 403
          ? "Invalid email or password"
          : result.error.message;
      return { error: msg };
    }
    tokens = result.data;
  }

  const claims = decodeAccessToken(tokens.access_token);
  const store = await cookies();
  writeAccessCookie(store, tokens.access_token, { maxAge: computeMaxAge(claims?.exp) });
  writeRefreshCookie(store, tokens.refresh_token);
  redirect(next);
}
