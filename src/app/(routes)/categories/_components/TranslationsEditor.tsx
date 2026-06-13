// src/app/(routes)/categories/_components/TranslationsEditor.tsx
"use client";
import { useState } from "react";

type Row = { locale: string; value: string };

function toRows(dict: Record<string, string> | undefined): Row[] {
  if (!dict) return [];
  return Object.entries(dict).map(([locale, value]) => ({ locale, value }));
}
function toDict(rows: Row[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const r of rows) {
    const loc = r.locale.trim();
    if (loc) out[loc] = r.value;
  }
  return out;
}

export function TranslationsEditor({
  name, // hidden input name, e.g. "name_translations"
  label,
  initial,
}: {
  name: string;
  label: string;
  initial?: Record<string, string>;
}) {
  const [rows, setRows] = useState<Row[]>(toRows(initial));
  return (
    <fieldset className="space-y-2" data-testid={`tr-${name}`}>
      <legend className="text-sm font-medium">{label}</legend>
      <input type="hidden" name={name} value={JSON.stringify(toDict(rows))} />
      {rows.map((row, i) => (
        <div key={i} className="flex gap-2">
          <input
            aria-label={`${name} locale ${i}`}
            data-testid={`${name}-locale-${i}`}
            className="w-24 rounded border px-2 py-1 text-sm"
            placeholder="en"
            value={row.locale}
            onChange={(e) =>
              setRows((rs) =>
                rs.map((r, j) =>
                  j === i ? { ...r, locale: e.target.value } : r,
                ),
              )
            }
          />
          <input
            aria-label={`${name} value ${i}`}
            data-testid={`${name}-value-${i}`}
            className="flex-1 rounded border px-2 py-1 text-sm"
            value={row.value}
            onChange={(e) =>
              setRows((rs) =>
                rs.map((r, j) =>
                  j === i ? { ...r, value: e.target.value } : r,
                ),
              )
            }
          />
          <button
            type="button"
            className="text-sm text-red-300"
            onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        data-testid={`${name}-add`}
        className="text-sm text-primary-hover"
        onClick={() => setRows((rs) => [...rs, { locale: "", value: "" }])}
      >
        + Add locale
      </button>
    </fieldset>
  );
}
