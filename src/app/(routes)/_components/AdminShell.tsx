"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import StepUpProvider from "@/app/_components/step-up/StepUpProvider";
import { Icon, type IconName } from "@/app/_components/ui";
import LogoutButton from "../LogoutButton";

export type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  superadminOnly?: boolean;
};
export type NavGroup = { label: string; items: NavItem[] };

// Active when the current path is the item href or a child of it
// (`/providers` highlights on `/providers/42`). Exact-match guards against a
// short href swallowing a sibling.
function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Admin shell chrome. On desktop (md+) the sidebar is a static 224px column
 * with grouped, iconified navigation and an active-route highlight. Below md it
 * collapses to an off-canvas drawer toggled by the header hamburger.
 *
 * Rendered as a client component so the drawer can hold open/close state and
 * `usePathname()` can drive the active link; the server layout computes the
 * grouped nav + session and passes the account block in as the `account` prop.
 */
export default function AdminShell({
  navGroups,
  email,
  account,
  children,
}: {
  navGroups: NavGroup[];
  email: string | null;
  account: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="flex min-h-screen">
      {open ? (
        <div
          onClick={close}
          aria-hidden
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-56 transform flex-col border-r border-hairline bg-surface-1 transition-transform duration-200 ease-out md:static md:z-auto md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
          <Link
            href="/"
            onClick={close}
            className="flex items-center gap-2 text-base font-semibold tracking-tight text-ink"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-white">
              <Icon name="dashboard" size={14} />
            </span>
            EventUp Admin
          </Link>
          <button
            type="button"
            onClick={close}
            aria-label="Close menu"
            className="-mr-1 p-1 text-ink-subtle hover:text-ink md:hidden"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              <p className="px-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-ink-tertiary">
                {group.label}
              </p>
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={close}
                    aria-current={active ? "page" : undefined}
                    className={`group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
                      active
                        ? "bg-primary font-medium text-white"
                        : "text-ink-muted hover:bg-surface-2 hover:text-ink"
                    }`}
                  >
                    <Icon
                      name={item.icon}
                      size={17}
                      className={
                        active
                          ? "text-white"
                          : "text-ink-subtle transition-colors group-hover:text-ink"
                      }
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        {account}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-hairline bg-surface-1 px-4 md:px-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            data-testid="sidebar-toggle"
            className="-ml-1 p-2 text-ink-subtle hover:text-ink md:hidden"
          >
            <Icon name="menu" size={20} />
          </button>
          <form action="/search" role="search" className="max-w-md flex-1">
            <div className="flex items-center gap-2 rounded-md border border-hairline bg-surface-2 px-3 py-1.5 focus-within:border-hairline-strong">
              <Icon
                name="search"
                size={15}
                className="shrink-0 text-ink-subtle"
              />
              <input
                type="search"
                name="q"
                data-testid="global-search-input"
                placeholder="Search providers and services…"
                aria-label="Global search"
                className="w-full bg-transparent text-sm text-ink placeholder:text-ink-subtle focus:outline-none"
              />
            </div>
          </form>
          <div className="flex items-center gap-3 text-sm">
            <span
              data-testid="admin-email"
              className="hidden text-ink-muted sm:inline"
            >
              {email ?? "not signed in"}
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
