import type {
  AttributeDefinitionCursorPage,
  AttributeDefinitionRead,
  AttributeDefinitionTranslations,
  AttributeDefinitionTranslationsPayload,
} from "@/lib/attribute-definitions/types";
import { buildFixtureAttributeDefinitions } from "./attribute-definitions-fixtures";
import { globalSingleton } from "./global-store";

// Keyed by `key` (the public PK). `id` is the internal cursor pivot.
const defs = globalSingleton(
  "__eventupAttributeDefs",
  () => new Map<string, AttributeDefinitionRead>(),
);
let nextId = 100;

type TranslationSet = {
  field_translations: AttributeDefinitionTranslations["field_translations"];
  enum_value_translations: AttributeDefinitionTranslations["enum_value_translations"];
};
const translations = globalSingleton(
  "__eventupAttributeTranslations",
  () => new Map<string, TranslationSet>(),
);

function ensureTranslationSeed(): void {
  if (translations.size > 0) return;
  // Seed one set on the `cuisine` fixture so the GET-render e2e has data.
  translations.set("cuisine", {
    field_translations: [
      { locale: "en", label: "Cuisine", description: "Type of cuisine" },
      { locale: "ru", label: "Кухня", description: null },
    ],
    enum_value_translations: [
      { locale: "ru", enum_value: "italian", label: "Итальянская" },
    ],
  });
}

function ensureSeed(): void {
  if (defs.size > 0) return;
  for (const d of buildFixtureAttributeDefinitions()) defs.set(d.key, d);
}

export function resetAttributeDefinitionsStore(): void {
  translations.clear();
  defs.clear();
  nextId = 100;
  ensureSeed();
  ensureTranslationSeed();
}

export function getAttributeDefinitionByKey(
  key: string,
): AttributeDefinitionRead | null {
  ensureSeed();
  return defs.get(key) ?? null;
}

export function listAttributeDefinitionsPage(opts: {
  search?: string;
  group_name?: string;
  is_active?: boolean;
  sort?: string;
  last_id?: number;
  limit?: number;
}): AttributeDefinitionCursorPage {
  ensureSeed();
  let rows = Array.from(defs.values());
  if (opts.search) {
    const q = opts.search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.key.toLowerCase().includes(q) ||
        (r.group_name?.toLowerCase().includes(q) ?? false),
    );
  }
  if (opts.group_name) {
    rows = rows.filter((r) => r.group_name === opts.group_name);
  }
  if (opts.is_active !== undefined) {
    rows = rows.filter((r) => r.is_active === opts.is_active);
  }
  switch (opts.sort) {
    case "key_asc":
      rows.sort((a, b) => a.key.localeCompare(b.key));
      break;
    case "key_desc":
      rows.sort((a, b) => b.key.localeCompare(a.key));
      break;
    case "sort_order_desc":
      rows.sort((a, b) => b.sort_order - a.sort_order || a.id - b.id);
      break;
    default: // sort_order_asc
      rows.sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
  }
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 100);
  let start = 0;
  if (opts.last_id !== undefined) {
    const idx = rows.findIndex((r) => r.id === opts.last_id);
    start = idx >= 0 ? idx + 1 : 0;
  }
  const slice = rows.slice(start, start + limit);
  const hasMore = start + limit < rows.length;
  return {
    items: slice,
    next_last_id: hasMore ? (slice[slice.length - 1]?.id ?? null) : null,
    has_more: hasMore,
    count: slice.length,
  };
}

export type AttributeDefinitionWrite = Partial<
  Omit<AttributeDefinitionRead, "id" | "bindings_count">
>;

export function createAttributeDefinitionRecord(
  input: AttributeDefinitionWrite,
): AttributeDefinitionRead {
  ensureSeed();
  const id = nextId++;
  const record: AttributeDefinitionRead = {
    id,
    key: input.key ?? "",
    descriptor: input.descriptor ?? {},
    group_name: input.group_name ?? null,
    sort_order: input.sort_order ?? 100,
    is_active: input.is_active ?? true,
    is_system: input.is_system ?? false,
    bindings_count: 0,
  };
  defs.set(record.key, record);
  return record;
}

export function updateAttributeDefinitionRecord(
  key: string,
  patch: AttributeDefinitionWrite,
): AttributeDefinitionRead | null {
  ensureSeed();
  const current = defs.get(key);
  if (!current) return null;
  const updated: AttributeDefinitionRead = {
    ...current,
    ...(patch.descriptor !== undefined ? { descriptor: patch.descriptor } : {}),
    ...(patch.group_name !== undefined
      ? { group_name: patch.group_name }
      : {}),
    ...(patch.sort_order !== undefined ? { sort_order: patch.sort_order } : {}),
    ...(patch.is_active !== undefined ? { is_active: patch.is_active } : {}),
    ...(patch.is_system !== undefined ? { is_system: patch.is_system } : {}),
  };
  defs.set(key, updated);
  return updated;
}

export function deleteAttributeDefinitionRecord(key: string): boolean {
  ensureSeed();
  return defs.delete(key);
}

export function getAttributeDefinitionTranslations(
  key: string,
): TranslationSet {
  ensureSeed();
  ensureTranslationSeed();
  return (
    translations.get(key) ?? {
      field_translations: [],
      enum_value_translations: [],
    }
  );
}

// Returns the stored set, or null if the definition key does not exist.
export function setAttributeDefinitionTranslations(
  key: string,
  payload: AttributeDefinitionTranslationsPayload,
): TranslationSet | null {
  ensureSeed();
  if (!defs.has(key)) return null;
  const set: TranslationSet = {
    field_translations: payload.field_translations ?? [],
    enum_value_translations: payload.enum_value_translations ?? [],
  };
  translations.set(key, set);
  return set;
}
