export const DEFAULT_API_URL = "http://localhost:8002";

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;
}

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

function buildUrl(path: string): string {
  const base = getApiBaseUrl().replace(/\/+$/, "");
  const rel = path.startsWith("/") ? path : `/${path}`;
  return `${base}${rel}`;
}

export async function postLogin(
  body: LoginRequest,
): Promise<{ ok: true; data: LoginResponse } | { ok: false; error: ApiError }> {
  let res: Response;
  try {
    res = await fetch(buildUrl("/admin/v2/auth/login"), {
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
    await fetch(buildUrl("/admin/v2/auth/logout"), {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
  } catch {
    // swallow — logout cookie clear runs regardless
  }
}
