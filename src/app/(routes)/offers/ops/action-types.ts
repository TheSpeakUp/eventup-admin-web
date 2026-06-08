export type OpsActionState = {
  ok: boolean;
  error: string | null;
  message: string | null;
};
export const EMPTY_OPS_STATE: OpsActionState = { ok: false, error: null, message: null };
