"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import StepUpProvider from "@/app/_components/step-up/StepUpProvider";
import LogoutButton from "../LogoutButton";

type NavItem = { href: string; label: string };

/**
 * Admin shell chrome. On desktop (md+) the sidebar is a static 224px column.
 * Below md it collapses to an off-canvas drawer toggled by the header
 * hamburger — previously the fixed `w-56` aside ate half a phone screen.
 *
 * Rendered as a client component so the drawer can hold open/close state;
 * the server layout computes the nav list + session and passes the
 * (server-rendered) account block in as the `account` prop.
 */
export default function AdminShell({
  navItems,
  email,
  account,
  children,
}: {
  navItems: NavItem[];
  email: string | null;
  account: ReactNode;
  children: ReactNode;
}) {
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
        className={`fixed inset-y-0 left-0 z-40 flex w-56 transform flex-col border-r border-zinc-200 bg-surface-1 transition-transform duration-200 ease-out md:static md:z-auto md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-5">
          <Link
            href="/"
            onClick={close}
            className="text-lg font-semibold tracking-tight"
          >
            EventUp Admin
          </Link>
          <button
            type="button"
            onClick={close}
            aria-label="Close menu"
            className="-mr-1 p-1 text-ink-subtle hover:text-ink md:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              className="block rounded-md px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        {account}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-zinc-200 bg-surface-1 px-4 md:px-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            data-testid="sidebar-toggle"
            className="-ml-1 p-2 text-ink-subtle hover:text-ink md:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path
                d="M3 5h14M3 10h14M3 15h14"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <form action="/search" role="search" className="max-w-md flex-1">
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
            <span
              data-testid="admin-email"
              className="hidden text-zinc-700 sm:inline"
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
