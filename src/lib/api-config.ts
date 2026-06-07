export const DEFAULT_API_URL = "http://localhost:8002";

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;
}

export function buildApiUrl(path: string): string {
  const base = getApiBaseUrl().replace(/\/+$/, "");
  const rel = path.startsWith("/") ? path : `/${path}`;
  return `${base}${rel}`;
}
