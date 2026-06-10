// src/app/(routes)/attribute-definitions/[key]/translations/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAttributeDefinition,
  getAttributeDefinitionTranslations,
} from "@/lib/attribute-definitions/api";
import { TranslationsEditor } from "./_components/TranslationsEditor";

export default async function AttributeDefinitionTranslationsPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const decodedKey = decodeURIComponent(key);
  const [defRes, trRes] = await Promise.all([
    getAttributeDefinition(decodedKey),
    getAttributeDefinitionTranslations(decodedKey),
  ]);

  if (defRes.status === 404 || trRes.status === 404) notFound();
  if (!trRes.ok) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold">Translations</h1>
        <div
          data-testid="translations-load-error"
          className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-red-800"
        >
          {trRes.status === 403
            ? "Editing translations requires an admin role."
            : `Failed to load translations: ${trRes.message}`}
        </div>
      </div>
    );
  }

  const tr = trRes.data;
  // Key-remount so a revalidated GET resets the editor's seeded state.
  const formKey = `${tr.attribute_key}:${tr.field_translations.length}:${tr.enum_value_translations.length}`;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold" data-testid="translations-heading">
          {decodedKey} · Translations
        </h1>
        <Link
          href={`/attribute-definitions/${encodeURIComponent(decodedKey)}`}
          className="text-sm text-blue-700"
        >
          ← Back to definition
        </Link>
      </div>
      <div className="mt-4 max-w-3xl">
        <TranslationsEditor
          key={formKey}
          attrKey={tr.attribute_key}
          initialFields={tr.field_translations}
          initialEnums={tr.enum_value_translations}
        />
      </div>
    </div>
  );
}
