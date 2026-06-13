// src/app/(routes)/categories/_components/AttributeSchemaEditor.tsx
"use client";
import { useState } from "react";

export function AttributeSchemaEditor({
  initial,
}: {
  initial?: Record<string, unknown> | null;
}) {
  const [text, setText] = useState(
    initial ? JSON.stringify(initial, null, 2) : "",
  );
  const [err, setErr] = useState<string | null>(null);
  // Validate on change (not on blur): a blur that fires as part of the submit
  // click would re-render mid-submit and swallow the first form-action POST
  // (React 19 controlled-input + <form action> interaction). Computing the
  // error as the user types settles it before submit, so the click is clean.
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
      <label className="text-sm font-medium" htmlFor="attribute_schema">
        Attribute schema (JSON)
      </label>
      <textarea
        id="attribute_schema"
        name="attribute_schema"
        data-testid="attribute-schema-input"
        rows={8}
        className="w-full rounded border px-2 py-1 font-mono text-xs"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          validate(e.target.value);
        }}
        placeholder='{ "cuisine": { "type": "string", "searchable": true } }'
      />
      {err ? (
        <p data-testid="attribute-schema-error" className="text-sm text-red-300">
          {err}
        </p>
      ) : null}
    </div>
  );
}
