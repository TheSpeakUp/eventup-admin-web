import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in · EventUp Admin",
};

type SearchParams = Promise<{ next?: string | string[] }>;

function resolveNext(raw: string | string[] | undefined): string {
  if (!raw) return "/";
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  if (value.startsWith("/login")) return "/";
  return value;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const next = resolveNext(params.next);
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-xl bg-surface-1 border border-zinc-200 shadow-sm p-8">
        <h1 className="text-xl font-semibold text-zinc-900">EventUp Admin</h1>
        <p className="mt-1 text-sm text-zinc-500">Sign in to moderate the marketplace.</p>
        <div className="mt-6">
          <LoginForm next={next} />
        </div>
      </div>
    </div>
  );
}
