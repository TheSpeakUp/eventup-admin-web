import { SignJWT } from "jose";
import type { AdminRole } from "@/lib/admins/types";

export const MOCK_PASSWORD = "password";

const MOCK_SECRET = new TextEncoder().encode(
  "mock-only-dev-secret-not-for-production-use-32-bytes-min",
);

type MockUser = { sub: string; email: string; role: AdminRole };

// Mock operators keyed by login email. `sub` mirrors the seeded admin ids in
// src/mocks/admins-store.ts so self-referential logic (current admin id ===
// target id) and role-gated UI behave under mock auth exactly as they would
// against the real backend. `role` is embedded in the issued access token's
// `role` claim, matching the monolith admin JWT contract.
const MOCK_USERS: Record<string, MockUser> = {
  "admin@example.com": {
    sub: "11111111-1111-4111-8111-111111111111",
    email: "admin@example.com",
    role: "SUPERADMIN",
  },
  "ops@example.com": {
    sub: "22222222-2222-4222-8222-222222222222",
    email: "ops@example.com",
    role: "ADMIN",
  },
  "mod@example.com": {
    sub: "33333333-3333-4333-8333-333333333333",
    email: "mod@example.com",
    role: "MODERATOR",
  },
};

// Default operator (back-compat with callers/tests that assume a single mock
// identity). Resolves to the SUPERADMIN seed.
export const MOCK_EMAIL = "admin@example.com";
export const MOCK_SUB = MOCK_USERS[MOCK_EMAIL].sub;

export function isMockAuthEnabled(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK_AUTH === "true";
}

export type MockTokens = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

export async function issueMockTokens(email: string): Promise<MockTokens> {
  const user = MOCK_USERS[email] ?? MOCK_USERS[MOCK_EMAIL];
  const accessTtlSeconds = 15 * 60;
  const refreshTtlSeconds = 7 * 24 * 60 * 60;
  const access = await new SignJWT({ email: user.email, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.sub)
    .setIssuedAt()
    .setExpirationTime(`${accessTtlSeconds}s`)
    .sign(MOCK_SECRET);
  const refresh = await new SignJWT({ email: user.email, typ: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.sub)
    .setIssuedAt()
    .setExpirationTime(`${refreshTtlSeconds}s`)
    .sign(MOCK_SECRET);
  return {
    access_token: access,
    refresh_token: refresh,
    expires_in: accessTtlSeconds,
  };
}

export function isValidMockCredentials(email: string, password: string): boolean {
  return password === MOCK_PASSWORD && Object.hasOwn(MOCK_USERS, email);
}
