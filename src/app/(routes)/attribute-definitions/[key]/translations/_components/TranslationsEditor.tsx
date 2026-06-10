// src/app/(routes)/attribute-definitions/[key]/translations/_components/TranslationsEditor.tsx
"use client";
import { useActionState, useState } from "react";
import { saveTranslationsAction } from "../actions";
import { EMPTY_STATE } from "../../../action-types";
import type {
  AttributeEnumTranslation,
  AttributeFieldTranslation,
} from "@/lib/attribute-definitions/types";

type FieldRow = { locale: string; label: string; description: string };
type EnumRow = { locale: string; enum_value: string; label: string };

export function TranslationsEditor({
  attrKey,
  initialFields,
  initialEnums,
}: {
  attrKey: string;
  initialFields: AttributeFieldTranslation[];
  initialEnums: AttributeEnumTranslation[];
}) {
  const [state, formAction, pending] = useActionState(
    saveTranslationsAction,
    EMPTY_STATE,
  );
  const [fields, setFields] = useState<FieldRow[]>(
    initialFields.map((f) => ({
      locale: f.locale,
      label: f.label,
      description: f.description ?? "",
    })),
  );
  const [enums, setEnums] = useState<EnumRow[]>(
    initialEnums.map((e) => ({
      locale: e.locale,
      enum_value: e.enum_value,
      label: e.label,
    })),
  );

  // Derived (at render) JSON for the hidden fields — drop fully-blank rows.
  const fieldsJson = JSON.stringify(
    fields
      .filter((f) => f.locale.trim() || f.label.trim())
      .map((f) => ({
        locale: f.locale.trim(),
        label: f.label.trim(),
        description: f.description.trim() === "" ? null : f.description.trim(),
      })),
  );
  const enumsJson = JSON.stringify(
    enums
      .filter((e) => e.locale.trim() || e.enum_value.trim() || e.label.trim())
      .map((e) => ({
        locale: e.locale.trim(),
        enum_value: e.enum_value.trim(),
        label: e.label.trim(),
      })),
  );

  // Client-side duplicate guard (backend is source of truth).
  const dupField = (() => {
    const seen = new Set<string>();
    for (const f of fields) {
      const l = f.locale.trim();
      if (!l) continue;
      if (seen.has(l)) return l;
      seen.add(l);
    }
    return null;
  })();
  const dupEnum = (() => {
    const seen = new Set<string>();
    for (const e of enums) {
      const k = `${e.locale.trim()}|${e.enum_value.trim()}`;
      if (k === "|") continue;
      if (seen.has(k)) return k;
      seen.add(k);
    }
    return null;
  })();
  const blocked = dupField !== null || dupEnum !== null;

  function setField(i: number, patch: Partial<FieldRow>) {
    setFields((rows) =>
      rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
    );
  }
  function setEnum(i: number, patch: Partial<EnumRow>) {
    setEnums((rows) =>
      rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
    );
  }

  return (
    <form action={formAction} data-testid="translations-form" className="space-y-8">
      <input type="hidden" name="attribute_key" value={attrKey} />
      <input type="hidden" name="field_translations" value={fieldsJson} />
      <input type="hidden" name="enum_value_translations" value={enumsJson} />

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Field translations</h2>
        {fields.map((f, i) => (
          <div key={i} className="flex gap-2" data-testid={`field-row-${i}`}>
            <input
              aria-label="locale"
              data-testid={`field-locale-${i}`}
              placeholder="locale (en)"
              value={f.locale}
              onChange={(e) => setField(i, { locale: e.target.value })}
              className="w-24 rounded border px-2 py-1"
            />
            <input
              aria-label="label"
              data-testid={`field-label-${i}`}
              placeholder="Label"
              value={f.label}
              onChange={(e) => setField(i, { label: e.target.value })}
              className="flex-1 rounded border px-2 py-1"
            />
            <input
              aria-label="description"
              data-testid={`field-desc-${i}`}
              placeholder="Description (optional)"
              value={f.description}
              onChange={(e) => setField(i, { description: e.target.value })}
              className="flex-1 rounded border px-2 py-1"
            />
            <button
              type="button"
              data-testid={`field-remove-${i}`}
              onClick={() => setFields((r) => r.filter((_, idx) => idx !== i))}
              className="rounded border px-2 py-1 text-red-700"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          data-testid="field-add"
          onClick={() =>
            setFields((r) => [...r, { locale: "", label: "", description: "" }])
          }
          className="rounded border px-3 py-1"
        >
          Add locale
        </button>
        {dupField ? (
          <p data-testid="field-dup-error" className="text-sm text-red-700">
            Duplicate field locale: {dupField}
          </p>
        ) : null}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Enum-value translations</h2>
        {enums.map((e, i) => (
          <div key={i} className="flex gap-2" data-testid={`enum-row-${i}`}>
            <input
              aria-label="enum locale"
              data-testid={`enum-locale-${i}`}
              placeholder="locale (en)"
              value={e.locale}
              onChange={(ev) => setEnum(i, { locale: ev.target.value })}
              className="w-24 rounded border px-2 py-1"
            />
            <input
              aria-label="enum value"
              data-testid={`enum-value-${i}`}
              placeholder="enum value"
              value={e.enum_value}
              onChange={(ev) => setEnum(i, { enum_value: ev.target.value })}
              className="flex-1 rounded border px-2 py-1"
            />
            <input
              aria-label="enum label"
              data-testid={`enum-label-${i}`}
              placeholder="Label"
              value={e.label}
              onChange={(ev) => setEnum(i, { label: ev.target.value })}
              className="flex-1 rounded border px-2 py-1"
            />
            <button
              type="button"
              data-testid={`enum-remove-${i}`}
              onClick={() => setEnums((r) => r.filter((_, idx) => idx !== i))}
              className="rounded border px-2 py-1 text-red-700"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          data-testid="enum-add"
          onClick={() =>
            setEnums((r) => [...r, { locale: "", enum_value: "", label: "" }])
          }
          className="rounded border px-3 py-1"
        >
          Add enum translation
        </button>
        {dupEnum ? (
          <p data-testid="enum-dup-error" className="text-sm text-red-700">
            Duplicate enum translation: {dupEnum}
          </p>
        ) : null}
      </section>

      <div className="space-y-2">
        <button
          type="submit"
          disabled={pending || blocked}
          data-testid="translations-submit"
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save translations"}
        </button>
        {state && !state.ok && state.error ? (
          <p data-testid="translations-error" className="text-sm text-red-700">
            {state.error}
          </p>
        ) : null}
        {state && state.ok && !pending ? (
          <p data-testid="translations-saved" className="text-sm text-green-700">
            Saved.
          </p>
        ) : null}
      </div>
    </form>
  );
}
