"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      data-testid="logout-button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await fetch("/logout", { method: "POST", credentials: "same-origin" });
          router.replace("/login");
          router.refresh();
        });
      }}
      className="px-3 py-1 rounded-md border border-zinc-200 text-zinc-700 text-sm hover:bg-zinc-100 disabled:text-zinc-400 disabled:cursor-not-allowed"
    >
      {pending ? "Signing out…" : "Log out"}
    </button>
  );
}
