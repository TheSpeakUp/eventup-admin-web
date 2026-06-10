// src/app/(routes)/categories/[id]/attributes/action-types.ts
export type ActionState =
  | { ok: true; error: null }
  | { ok: false; error: string };
export const EMPTY_STATE: ActionState = { ok: true, error: null };
