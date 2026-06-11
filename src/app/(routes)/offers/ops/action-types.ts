export type OpsActionState =
  | { ok: true; error: null; message: string; stepUp?: never }
  | { ok: false; error: string | ""; message: string | null; stepUp?: { permission?: string } };

export const EMPTY_OPS_STATE: OpsActionState = { ok: false, error: "", message: null };
