import Link from "next/link";
import { getAdminSession } from "@/lib/auth/session";
import MockBackendBoot from "@/app/_components/MockBackendBoot";
import StepUpProvider from "@/app/_components/step-up/StepUpProvider";
import LogoutButton from "./LogoutButton";
import SidebarAccount from "./SidebarAccount";

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
  const visibleNavItems = navItems.filter(
    (item) => !item.superadminOnly || isSuperadmin,
  );
  return (
    <div className="flex min-h-screen">
      <MockBackendBoot />
      <aside className="w-56 border-r border-zinc-200 bg-surface-1 flex flex-col">
        <div className="px-6 py-5 border-b border-zinc-200">
          <Link href="/" className="font-semibold text-lg tracking-tight">
            EventUp Admin
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {visibleNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded-md text-sm text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <SidebarAccount
          fallbackEmail={session?.email ?? null}
          fallbackRole={session?.role ?? null}
        />
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b border-zinc-200 bg-surface-1 flex items-center justify-between px-6 gap-4">
          <form action="/search" role="search" className="flex-1 max-w-md">
            <input
              type="search"
              name="q"
              data-testid="global-search-input"
              placeholder="Search providers and services…"
              aria-label="Global search"
              className="w-full rounded-md border border-zinc-200 px-3 py-1.5 text-sm placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
            />
          </form>
          <div className="flex items-center gap-3 text-sm">
            <span data-testid="admin-email" className="text-zinc-700">
              {session?.email ?? "not signed in"}
            </span>
            <LogoutButton />
          </div>
        </header>
        <StepUpProvider>
          <main className="flex-1">{children}</main>
        </StepUpProvider>
      </div>
    </div>
  );
}
