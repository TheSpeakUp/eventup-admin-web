import { cookies } from "next/headers";
import { decodeJwt } from "jose";
import { ACCESS_COOKIE } from "./cookies";
import { isAdminRole, type AdminRole } from "@/lib/admins/types";

export type AdminSessionClaims = {
  sub: string;
  email: string;
  // The access token carries the operator's role (claim mirrors the monolith
  // admin JWT: a plain string matching AdminRole). Null when the claim is
  // absent or unrecognised so role-gated UI fails closed rather than crashing.
  role: AdminRole | null;
  exp: number;
};

function parseClaims(token: string): AdminSessionClaims | null {
  try {
    const payload = decodeJwt(token);
    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.exp !== "number"
    ) {
      return null;
    }
    const rawRole = payload.role;
    return {
      sub: payload.sub,
      email: payload.email,
      role:
        typeof rawRole === "string" && isAdminRole(rawRole) ? rawRole : null,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

export function decodeAccessToken(token: string): AdminSessionClaims | null {
  return parseClaims(token);
}

export async function getAdminSession(): Promise<AdminSessionClaims | null> {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  if (!token) return null;
  const claims = parseClaims(token);
  if (!claims) return null;
  if (claims.exp * 1000 <= Date.now()) return null;
  return claims;
}
