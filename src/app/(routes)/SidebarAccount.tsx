import Link from "next/link";
import { getSelf } from "@/lib/self/api";
import type { AdminRole } from "@/lib/admins/types";

// Bottom-left account block. Wired to GET /self for the canonical display name +
// MFA channel; falls back to the JWT session claims (email/role) if the profile
// fetch errors so the shell still identifies the operator. Rendered inside the
// routes layout's <aside>.
export default async function SidebarAccount({
  fallbackEmail,
  fallbackRole,
}: {
  fallbackEmail: string | null;
  fallbackRole: AdminRole | null;
}) {
  const result = await getSelf();
  const self = result.ok ? result.data : null;

  const email = self?.email ?? fallbackEmail ?? "not signed in";
  const role = self?.role ?? fallbackRole;
  const name = self?.display_name ?? null;
  const primary = name ?? email;
  const mfaMethodLabel = self?.mfa.method === "email_otp" ? "Email OTP" : null;

  return (
    <Link
      href="/profile"
      data-testid="sidebar-account"
      className="block border-t border-zinc-200 px-4 py-3 hover:bg-zinc-50"
    >
      <div className="flex items-center gap-2">
        <span
          data-testid="sidebar-account-name"
          className="truncate text-sm font-medium text-zinc-800"
        >
          {primary}
        </span>
        {role ? (
          <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            {role}
          </span>
        ) : null}
      </div>
      {name ? (
        <span className="block truncate text-xs text-zinc-500">{email}</span>
      ) : null}
      {mfaMethodLabel ? (
        <span
          data-testid="sidebar-account-mfa"
          className="mt-1 inline-flex items-center rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700"
        >
          {mfaMethodLabel}
          {self?.mfa.enforced ? " · required" : ""}
        </span>
      ) : null}
    </Link>
  );
}
