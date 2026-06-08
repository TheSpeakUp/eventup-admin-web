import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ACCESS_COOKIE,
  DEFAULT_ACCESS_MAX_AGE_SECONDS,
  REFRESH_COOKIE,
  writeAccessCookie,
  writeRefreshCookie,
} from "@/lib/auth/cookies";
import { buildApiUrl } from "@/lib/api-config";

export { DEFAULT_API_URL, getApiBaseUrl } from "@/lib/api-config";

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

export type ApiError = {
  status: number;
  message: string;
};

export async function postLogin(
  body: LoginRequest,
): Promise<{ ok: true; data: LoginResponse } | { ok: false; error: ApiError }> {
  let res: Response;
  try {
    res = await fetch(buildApiUrl("/eventup-admin/v1/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return {
      ok: false,
      error: { status: 0, message: "Network error contacting admin API" },
    };
  }
  if (!res.ok) {
    let message = "Login failed";
    try {
      const data = (await res.json()) as { detail?: string; message?: string };
      message = data.detail ?? data.message ?? message;
    } catch {
      // ignore parse failure
    }
    return { ok: false, error: { status: res.status, message } };
  }
  const data = (await res.json()) as LoginResponse;
  return { ok: true, data };
}

export async function postLogout(accessToken: string | null): Promise<void> {
  if (!accessToken) return;
  try {
    await fetch(buildApiUrl("/eventup-admin/v1/auth/logout"), {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
  } catch {
    // swallow — logout cookie clear runs regardless
  }
}

async function tryRefresh(refreshToken: string): Promise<LoginResponse | null> {
  try {
    const res = await fetch(buildApiUrl("/eventup-admin/v1/auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as LoginResponse;
  } catch {
    return null;
  }
}

export type ApiFetchOptions = RequestInit & {
  redirectOn401?: boolean;
};

export type ApiFetchResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; message: string };

async function readJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function readError(res: Response): Promise<string> {
  const body = await readJson<{
    detail?: string;
    message?: string;
    error?: {
      message?: string;
      meta?: { original_detail?: string };
    };
  }>(res);
  return (
    body?.error?.meta?.original_detail ??
    body?.error?.message ??
    body?.detail ??
    body?.message ??
    `Request failed (${res.status})`
  );
}

/**
 * Server-only fetch helper. Attaches the access token from cookies, retries
 * once on 401 by hitting /auth/refresh, and redirects to /login on terminal 401
 * unless `redirectOn401: false` is passed (Server Actions opt out so they can
 * return a structured error to the form instead).
 */
export async function apiFetch<T>(
  path: string,
  opts: ApiFetchOptions = {},
): Promise<ApiFetchResult<T>> {
  const { redirectOn401 = true, headers: extraHeaders, ...rest } = opts;
  const store = await cookies();
  const access = store.get(ACCESS_COOKIE)?.value ?? null;
  const refresh = store.get(REFRESH_COOKIE)?.value ?? null;

  const doFetch = async (token: string | null): Promise<Response> => {
    const headers = new Headers(extraHeaders);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (rest.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    return fetch(buildApiUrl(path), {
      ...rest,
      headers,
      cache: rest.cache ?? "no-store",
    });
  };

  let res: Response;
  try {
    res = await doFetch(access);
  } catch {
    return { ok: false, status: 0, message: "Network error contacting admin API" };
  }

  if (res.status === 401 && refresh) {
    const refreshed = await tryRefresh(refresh);
    if (refreshed) {
      writeAccessCookie(store, refreshed.access_token, {
        maxAge: Math.min(refreshed.expires_in, DEFAULT_ACCESS_MAX_AGE_SECONDS * 4),
      });
      writeRefreshCookie(store, refreshed.refresh_token);
      try {
        res = await doFetch(refreshed.access_token);
      } catch {
        return { ok: false, status: 0, message: "Network error contacting admin API" };
      }
    }
  }

  if (res.status === 401) {
    if (redirectOn401) redirect("/login");
    return { ok: false, status: 401, message: "Not authenticated" };
  }
  if (!res.ok) {
    return { ok: false, status: res.status, message: await readError(res) };
  }
  if (res.status === 204) {
    return { ok: true, status: 204, data: null as T };
  }
  const data = (await readJson<T>(res)) as T;
  return { ok: true, status: res.status, data };
}
