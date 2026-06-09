import Link from "next/link";
import { getAdminSession } from "@/lib/auth/session";
import MockBackendBoot from "@/app/_components/MockBackendBoot";
import LogoutButton from "./LogoutButton";

const navItems = [
  { href: "/services", label: "Services" },
  { href: "/providers", label: "Providers" },
  { href: "/offers", label: "Offers" },
  { href: "/categories", label: "Categories" },
  // Admin-team management is SUPERADMIN-only — the page itself guards access,
  // but a non-SUPERADMIN should not even see the link (defense-in-depth, and
  // it avoids dangling them at a permission-denied screen).
  { href: "/admins", label: "Admin team", superadminOnly: true },
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
      <aside className="w-56 border-r border-zinc-200 bg-white flex flex-col">
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
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b border-zinc-200 bg-white flex items-center justify-between px-6">
          <span className="text-sm text-zinc-500">Marketplace operator console</span>
          <div className="flex items-center gap-3 text-sm">
            <span data-testid="admin-email" className="text-zinc-700">
              {session?.email ?? "not signed in"}
            </span>
            <LogoutButton />
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
