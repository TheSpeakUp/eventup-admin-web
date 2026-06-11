import { apiFetch, type ApiFetchResult } from "@/lib/api";
import type {
  BroadcastAudience,
  BroadcastBody,
  BroadcastPreview,
  BroadcastResult,
} from "./types";

const BASE = "/eventup-admin/v1/marketplace/broadcast";

export function previewBroadcast(
  audience: BroadcastAudience,
): Promise<ApiFetchResult<BroadcastPreview>> {
  return apiFetch<BroadcastPreview>(`${BASE}/preview?audience=${audience}`);
}

export function sendBroadcast(
  body: BroadcastBody,
): Promise<ApiFetchResult<BroadcastResult>> {
  return apiFetch<BroadcastResult>(BASE, {
    method: "POST",
    body: JSON.stringify(body),
    redirectOn401: false,
  });
}
