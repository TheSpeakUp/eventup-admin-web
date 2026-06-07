import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EventUp Admin",
  description: "EventUp marketplace operator dashboard",
};

const navItems = [
  { href: "/services", label: "Services" },
  { href: "/providers", label: "Providers" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900">
        <div className="flex flex-1 min-h-screen">
          <aside className="w-56 border-r border-zinc-200 bg-white flex flex-col">
            <div className="px-6 py-5 border-b border-zinc-200">
              <Link href="/" className="font-semibold text-lg tracking-tight">
                EventUp Admin
              </Link>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {navItems.map((item) => (
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
                <span className="text-zinc-400" aria-disabled="true">
                  not signed in
                </span>
                <button
                  type="button"
                  disabled
                  className="px-3 py-1 rounded-md border border-zinc-200 text-zinc-400 cursor-not-allowed"
                >
                  Log out
                </button>
              </div>
            </header>
            <main className="flex-1">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
