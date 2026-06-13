import { getAdminSession } from "@/lib/auth/session";
import MockBackendBoot from "@/app/_components/MockBackendBoot";
import SidebarAccount from "./SidebarAccount";
import AdminShell from "./_components/AdminShell";

const navItems = [
  { href: "/services", label: "Services" },
  { href: "/providers", label: "Providers" },
  { href: "/offers", label: "Offers" },
  { href: "/traffic", label: "Traffic" },
  { href: "/categories", label: "Categories" },
  { href: "/attribute-definitions", label: "Attribute Definitions" },
  { href: "/registry", label: "Registry" },
  { href: "/promotions", label: "Promotions" },
  { href: "/promo-codes", label: "Promo codes" },
  { href: "/quality", label: "Quality" },
  { href: "/reviews", label: "Reviews" },
  { href: "/payments", label: "Payments" },
  { href: "/audit", label: "Audit log" },
  // Admin-team management is SUPERADMIN-only — the page itself guards access,
  // but a non-SUPERADMIN should not even see the link (defense-in-depth, and
  // it avoids dangling them at a permission-denied screen).
  { href: "/admins", label: "Admin team", superadminOnly: true },
  // Broadcast fans an announcement to every provider — SUPERADMIN-only
  // (ADMIN_NOTIFICATIONS_WRITE on the backend).
  { href: "/broadcast", label: "Broadcast", superadminOnly: true },
];

export default async function RoutesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  const isSuperadmin = session?.role === "SUPERADMIN";
  const visibleNavItems = navItems
    .filter((item) => !item.superadminOnly || isSuperadmin)
    .map(({ href, label }) => ({ href, label }));
  return (
    <>
      <MockBackendBoot />
      <AdminShell
        navItems={visibleNavItems}
        email={session?.email ?? null}
        account={
          <SidebarAccount
            fallbackEmail={session?.email ?? null}
            fallbackRole={session?.role ?? null}
          />
        }
      >
        {children}
      </AdminShell>
    </>
  );
}
