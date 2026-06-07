import { SignJWT } from "jose";

export const MOCK_EMAIL = "admin@example.com";
export const MOCK_PASSWORD = "password";
export const MOCK_SUB = "mock-admin-1";

const MOCK_SECRET = new TextEncoder().encode(
  "mock-only-dev-secret-not-for-production-use-32-bytes-min",
);

export function isMockAuthEnabled(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK_AUTH === "true";
}

export type MockTokens = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

export async function issueMockTokens(email: string): Promise<MockTokens> {
  const accessTtlSeconds = 15 * 60;
  const refreshTtlSeconds = 7 * 24 * 60 * 60;
  const access = await new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(MOCK_SUB)
    .setIssuedAt()
    .setExpirationTime(`${accessTtlSeconds}s`)
    .sign(MOCK_SECRET);
  const refresh = await new SignJWT({ email, typ: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(MOCK_SUB)
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
  return email === MOCK_EMAIL && password === MOCK_PASSWORD;
}
