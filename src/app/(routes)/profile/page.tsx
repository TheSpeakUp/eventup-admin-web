import { ActiveBadge, RoleBadge } from "../admins/_components/RoleBadge";
import { getLoginHistory, getSelf } from "@/lib/self/api";
import type { SelfMfaInfo } from "@/lib/self/types";
import ChangePasswordForm from "./_components/ChangePasswordForm";
import DisplayNameForm from "./_components/DisplayNameForm";
import LoginHistoryTable from "./_components/LoginHistoryTable";

function fmtDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

const MFA_METHOD_LABEL: Record<SelfMfaInfo["method"], string> = {
  email_otp: "Email OTP",
};

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-md border border-zinc-200 bg-surface-1 p-5">
      <div>
        <h2 className="text-sm font-semibold text-zinc-700">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-xs text-zinc-400">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export default async function ProfilePage() {
  const result = await getSelf();

  if (!result.ok) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold">My profile</h1>
        <div
          data-testid="profile-error"
          className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          Failed to load your profile: {result.message}
        </div>
      </div>
    );
  }

  const self = result.data;
  // Bonus surface — never block the page on it.
  const historyR = await getLoginHistory();
  const history = historyR.ok ? historyR.data.items : null;

  return (
    <div className="max-w-3xl space-y-6 p-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="profile-heading">
            My profile
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {self.display_name ?? "No display name"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RoleBadge role={self.role} />
          <ActiveBadge active={self.is_active} />
        </div>
      </div>

      <Card title="Account">
        <dl className="grid grid-cols-[8rem_1fr] gap-x-6 gap-y-3 text-sm">
          <dt className="text-zinc-500">Email</dt>
          <dd className="text-zinc-800">
            <span data-testid="profile-email">{self.email}</span>
            {/* Email is the login identity and the OTP delivery channel, so it
                is not self-editable here — changing it needs a separate verified
                flow that does not exist yet. */}
            <span className="ml-2 rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
              Read-only
            </span>
          </dd>

          <dt className="text-zinc-500">Role</dt>
          <dd className="text-zinc-800" data-testid="profile-role">
            {self.role}
          </dd>

          <dt className="text-zinc-500">Last login</dt>
          <dd className="text-zinc-800" data-testid="profile-last-login">
            {fmtDate(self.last_login_at)}
          </dd>
        </dl>
      </Card>

      <Card title="Two-factor authentication">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span
            data-testid="mfa-method-badge"
            className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 ring-1 ring-inset ring-blue-200"
          >
            {MFA_METHOD_LABEL[self.mfa.method]}
          </span>
          {self.mfa.enforced ? (
            <span data-testid="mfa-enforced" className="text-zinc-600">
              Required for sensitive actions.
            </span>
          ) : (
            <span data-testid="mfa-not-enforced" className="text-zinc-500">
              Optional for sensitive actions.
            </span>
          )}
        </div>
        <p className="text-xs text-zinc-400">
          A one-time code is emailed to {self.email} when a high-risk action
          needs verification.
        </p>
      </Card>

      <Card
        title="Display name"
        description="The name shown next to your actions across the admin console."
      >
        <DisplayNameForm displayName={self.display_name} />
      </Card>

      <Card
        title="Change password"
        description="Choose a strong password you do not use elsewhere."
      >
        <ChangePasswordForm />
      </Card>

      {history ? (
        <Card
          title="Recent sign-ins"
          description="The latest authentication attempts on your account."
        >
          <LoginHistoryTable items={history} />
        </Card>
      ) : null}
    </div>
  );
}
