export type ActionState =
  | { ok: true; error: null }
  | { ok: false; error: string; stepUp?: { permission?: string } };

export const EMPTY_STATE: ActionState = { ok: true, error: null };

// Invite carries the sent-to email on success so the form can render a
// confirmation without a setState-in-effect. Kept here (not in the "use server"
// actions file, which may only export async functions).
export type InviteState =
  | { ok: true; error: null; email: string | null }
  | { ok: false; error: string; email: null; stepUp?: { permission?: string } };

export const INVITE_EMPTY: InviteState = { ok: true, error: null, email: null };
