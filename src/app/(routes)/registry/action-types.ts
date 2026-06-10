// Rollback uses the F9 ok/error shape. Revalidation success carries the result
// counts so the panel can render them, so it has a richer success variant.
import type { RevalidationRunResult } from "@/lib/registry/types";

export type RollbackState =
  | { ok: true; error: null }
  | { ok: false; error: string };
export const EMPTY_ROLLBACK_STATE: RollbackState = { ok: true, error: null };

export type RevalidationState =
  | { ok: true; result: RevalidationRunResult }
  | { ok: false; error: string }
  | { ok: null }; // initial — nothing submitted yet
export const EMPTY_REVALIDATION_STATE: RevalidationState = { ok: null };
