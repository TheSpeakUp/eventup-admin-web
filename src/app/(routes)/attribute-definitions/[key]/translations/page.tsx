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
          className="mt-4 rounded border border-red-500/30 bg-red-500/10 p-3 text-red-300"
        >
          {trRes.status === 403
            ? "Editing translations requires an admin role."
            : `Failed to load translations: ${trRes.message}`}
        </div>
      </div>
    );
  }

  const tr = trRes.data;
  // No key-remount here: TranslationsEditor is fully controlled (useState rows),
  // so a revalidated GET must NOT remount it — a remount would wipe the form's
  // post-save success state. The editor's own state already reflects the save
  // (full-replace), and a fresh navigation re-seeds from the server GET.

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold" data-testid="translations-heading">
          {decodedKey} · Translations
        </h1>
        <Link
          href={`/attribute-definitions/${encodeURIComponent(decodedKey)}`}
          className="text-sm text-primary-hover"
        >
          ← Back to definition
        </Link>
      </div>
      <div className="mt-4 max-w-3xl">
        <TranslationsEditor
          attrKey={tr.attribute_key}
          initialFields={tr.field_translations}
          initialEnums={tr.enum_value_translations}
        />
      </div>
    </div>
  );
}
