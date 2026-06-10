// src/app/(routes)/attribute-definitions/_components/DescriptorEditor.tsx
"use client";
import { useState } from "react";

export function DescriptorEditor({
  initial,
}: {
  initial?: Record<string, unknown> | null;
}) {
  const [text, setText] = useState(
    initial ? JSON.stringify(initial, null, 2) : "",
  );
  const [err, setErr] = useState<string | null>(null);
  // Validate on change (not blur): a blur firing during the submit click would
  // re-render mid-submit and swallow the first form-action POST (React 19
  // controlled-input + <form action>). Settling the error as the user types
  // keeps the submit click clean.
  function validate(value: string) {
    if (value.trim() === "") return setErr(null);
    try {
      JSON.parse(value);
      setErr(null);
    } catch {
      setErr("Invalid JSON");
    }
  }
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium" htmlFor="descriptor">
        Descriptor (JSON)
      </label>
      <textarea
        id="descriptor"
        name="descriptor"
        data-testid="descriptor-input"
        rows={8}
        className="w-full rounded border px-2 py-1 font-mono text-xs"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          validate(e.target.value);
        }}
        placeholder='{ "type": "string", "searchable": true }'
      />
      {err ? (
        <p data-testid="descriptor-error" className="text-sm text-red-700">
          {err}
        </p>
      ) : null}
    </div>
  );
}
