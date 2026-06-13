import type { LoginHistoryItem } from "@/lib/self/types";

// Display-name overrides keyed by operator sub. The base identity (email, role,
// is_active, last_login_at) is read from admins-store; only the self-editable
// display name is overlaid here so the /self mock stays decoupled from the
// admin-team store (which a parallel surface owns).
const displayNameOverrides = new Map<string, string | null>();

export function hasSelfDisplayNameOverride(sub: string): boolean {
  return displayNameOverrides.has(sub);
}

export function getSelfDisplayNameOverride(sub: string): string | null {
  return displayNameOverrides.get(sub) ?? null;
}

export function setSelfDisplayName(sub: string, value: string | null): void {
  displayNameOverrides.set(sub, value);
}

// Deterministic seeded sign-in history (newest first). Fixed timestamps keep
// e2e assertions stable.
const LOGIN_HISTORY: LoginHistoryItem[] = [
  {
    id: "a0000000-0000-4000-8000-000000000001",
    occurred_at: "2026-06-13T09:15:00Z",
    success: true,
    ip_address: "203.0.113.7",
    user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/126.0",
  },
  {
    id: "a0000000-0000-4000-8000-000000000002",
    occurred_at: "2026-06-12T18:42:00Z",
    success: false,
    ip_address: "198.51.100.22",
    user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/127.0",
  },
  {
    id: "a0000000-0000-4000-8000-000000000003",
    occurred_at: "2026-06-11T08:03:00Z",
    success: true,
    ip_address: "203.0.113.7",
    user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/126.0",
  },
];

export function getLoginHistoryPage(
  limit: number,
  offset: number,
): { items: LoginHistoryItem[]; total: number } {
  const total = LOGIN_HISTORY.length;
  const items = LOGIN_HISTORY.slice(offset, offset + limit);
  return { items, total };
}

export function resetSelfStore(): void {
  displayNameOverrides.clear();
}
