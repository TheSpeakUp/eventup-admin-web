import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeJwt } from "jose";
import { ACCESS_COOKIE } from "@/lib/auth/cookies";

const LOGIN_PATH = "/login";

// Public routes reachable without a session. The invitation-accept page is
// authenticated by its single-use token (in the path), not by a cookie.
function isPublicPath(pathname: string): boolean {
  return pathname === LOGIN_PATH || pathname.startsWith("/invitations/");
}

function isExpired(token: string): boolean {
  try {
    const { exp } = decodeJwt(token);
    if (typeof exp !== "number") return true;
    return exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }
  const token = req.cookies.get(ACCESS_COOKIE)?.value;
  if (token && !isExpired(token)) {
    return NextResponse.next();
  }
  const url = req.nextUrl.clone();
  url.pathname = LOGIN_PATH;
  url.search = "";
  url.searchParams.set("next", `${pathname}${search}`);
  const res = NextResponse.redirect(url);
  if (token) {
    // Token was present but expired/invalid — wipe it so subsequent
    // navigation does not loop on the same bad cookie.
    res.cookies.delete(ACCESS_COOKIE);
  }
  return res;
}

export const config = {
  // Skip static assets, image optimizer, favicon, and Next internals.
  // Login + logout are handled inside proxy() above.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)"],
};
