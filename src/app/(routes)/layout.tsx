import { getAdminSession } from "@/lib/auth/session";
import MockBackendBoot from "@/app/_components/MockBackendBoot";
import SidebarAccount from "./SidebarAccount";
import AdminShell, { type NavGroup } from "./_components/AdminShell";

// Grouped, iconified navigation. Sections give the 15-item nav an information
// architecture (Marketplace / Content / Commerce / Quality / Administration)
// instead of one flat scroll, and each item carries an `Icon` name + the active
// route is highlighted in the shell. Labels and hrefs are unchanged — the e2e
// suite resolves these links by their accessible (text) name.
const navGroups: NavGroup[] = [
  {
    label: "Marketplace",
    items: [
      { href: "/services", label: "Services", icon: "services" },
      { href: "/providers", label: "Providers", icon: "providers" },
      { href: "/offers", label: "Offers", icon: "offers" },
      { href: "/traffic", label: "Traffic", icon: "traffic" },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/categories", label: "Categories", icon: "categories" },
      {
        href: "/attribute-definitions",
        label: "Attribute Definitions",
        icon: "attributes",
      },
      { href: "/registry", label: "Registry", icon: "registry" },
    ],
  },
  {
    label: "Commerce",
    items: [
      { href: "/promotions", label: "Promotions", icon: "promotions" },
      { href: "/promo-codes", label: "Promo codes", icon: "promo-codes" },
      { href: "/payments", label: "Payments", icon: "payments" },
    ],
  },
  {
    label: "Quality",
    items: [
      { href: "/quality", label: "Quality", icon: "quality" },
      { href: "/reviews", label: "Reviews", icon: "reviews" },
      { href: "/audit", label: "Audit log", icon: "audit" },
    ],
  },
  {
    label: "Administration",
    items: [
      // Admin-team management is SUPERADMIN-only — the page itself guards
      // access, but a non-SUPERADMIN should not even see the link
      // (defense-in-depth, and it avoids dangling them at a denied screen).
      {
        href: "/admins",
        label: "Admin team",
        icon: "admins",
        superadminOnly: true,
      },
      // Broadcast fans an announcement to every provider — SUPERADMIN-only
      // (ADMIN_NOTIFICATIONS_WRITE on the backend).
      {
        href: "/broadcast",
        label: "Broadcast",
        icon: "broadcast",
        superadminOnly: true,
      },
    ],
  },
];

export default async function RoutesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  const isSuperadmin = session?.role === "SUPERADMIN";
  // Drop SUPERADMIN-only items for non-superadmins, then drop any group left
  // with no visible items (so an empty "Administration" header never shows).
  const visibleNavGroups: NavGroup[] = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.superadminOnly || isSuperadmin,
      ),
    }))
    .filter((group) => group.items.length > 0);
  return (
    <>
      <MockBackendBoot />
      <AdminShell
        navGroups={visibleNavGroups}
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
