// src/app/(routes)/promotions/_components/NewItemPanel.tsx
"use client";
import { useState } from "react";

// Toggles a create form open/closed. The form itself (a Server-Action-backed
// client form) is passed as children so this panel stays entity-agnostic.
export default function NewItemPanel({
  label,
  testid,
  children,
}: {
  label: string;
  testid: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        data-testid={`${testid}-toggle`}
        onClick={() => setOpen((v) => !v)}
        className="rounded bg-blue-600 px-4 py-2 text-sm text-white"
      >
        {open ? "Close" : label}
      </button>
      {open ? (
        <div className="mt-3 max-w-2xl" data-testid={`${testid}-panel`}>
          {children}
        </div>
      ) : null}
    </div>
  );
}
