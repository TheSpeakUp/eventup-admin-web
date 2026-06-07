import type { ResponseCookies } from "next/dist/compiled/@edge-runtime/cookies";

export const ACCESS_COOKIE = "eventup_admin_access";
export const REFRESH_COOKIE = "eventup_admin_refresh";

export const DEFAULT_ACCESS_MAX_AGE_SECONDS = 15 * 60;
export const REFRESH_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export type AccessCookieOptions = {
  maxAge?: number;
};

type CookieStoreLike = Pick<ResponseCookies, "set" | "delete">;

const isProduction = () => process.env.NODE_ENV === "production";

export function writeAccessCookie(
  store: CookieStoreLike,
  token: string,
  opts: AccessCookieOptions = {},
): void {
  store.set({
    name: ACCESS_COOKIE,
    value: token,
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax",
    path: "/",
    maxAge: opts.maxAge ?? DEFAULT_ACCESS_MAX_AGE_SECONDS,
  });
}

export function writeRefreshCookie(store: CookieStoreLike, token: string): void {
  store.set({
    name: REFRESH_COOKIE,
    value: token,
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_MAX_AGE_SECONDS,
  });
}

export function clearAuthCookies(store: CookieStoreLike): void {
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}
