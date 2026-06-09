import { cookies } from "next/headers";
import { decodeJwt } from "jose";
import { ACCESS_COOKIE } from "./cookies";
import { isAdminRole, type AdminRole } from "@/lib/admins/types";

export type AdminSessionClaims = {
  sub: string;
  email: string;
  exp: number;
  // Present on real admin access tokens (``jwt.py`` signs ``role``). Optional so
  // a token without the claim degrades to "no elevated access" rather than null.
  role: AdminRole | null;
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
    return {
      sub: payload.sub,
      email: payload.email,
      exp: payload.exp,
      role:
        typeof payload.role === "string" && isAdminRole(payload.role)
          ? payload.role
          : null,
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
