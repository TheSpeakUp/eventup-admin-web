// Discriminated result the profile forms' useActionState renders from. `done`
// distinguishes the initial idle state from a completed success so a form can
// show an inline confirmation (the password POST returns 204 with no body, so
// there is nothing else to re-render from). `stepUp` carries through when a
// high-risk op trips step-up — not expected on /self endpoints today, but kept
// uniform with the rest of the app's server actions.
export type FormState =
  | { ok: true; done: boolean; error: null }
  | { ok: false; done: false; error: string; stepUp?: { permission?: string } };

export const FORM_EMPTY: FormState = { ok: true, done: false, error: null };
