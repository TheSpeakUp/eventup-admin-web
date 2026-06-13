export type ActionState = {
  ok: boolean;
  error: string | null;
  // T4 — set when verify failed because kind-evidence is missing (HTTP 400).
  // The verify dialog reads this to stay open and surface the override hint
  // instead of closing into a generic toast.
  evidenceMissing?: boolean;
};

export const EMPTY_STATE: ActionState = { ok: false, error: null };
