import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ACCESS_COOKIE, REFRESH_COOKIE, clearAuthCookies } from "@/lib/auth/cookies";
import { isMockAuthEnabled } from "@/lib/auth/mock";
import { postLogout } from "@/lib/api";

export async function POST() {
  const store = await cookies();
  const access = store.get(ACCESS_COOKIE)?.value ?? null;
  if (!isMockAuthEnabled()) {
    await postLogout(access);
  }
  clearAuthCookies(store);
  // Ensure response also carries the cleared cookies for clients that
  // do not honour the cookies() mutation across redirects.
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(ACCESS_COOKIE);
  res.cookies.delete(REFRESH_COOKIE);
  return res;
}

export function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
