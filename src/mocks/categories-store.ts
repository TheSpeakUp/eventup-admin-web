// src/mocks/categories-store.ts
import type {
  CategoryCursorPage,
  CategoryRead,
} from "@/lib/categories/types";
import { buildFixtureCategories } from "./categories-fixtures";

const categories = new Map<number, CategoryRead>();
// Translations are write-only on the mock (Read DTO omits them); persist so
// edit round-trips can assert they were stored.
const translations = new Map<
  number,
  {
    name_translations?: Record<string, string>;
    description_translations?: Record<string, string>;
  }
>();
let nextId = 100;

function ensureSeed(): void {
  if (categories.size > 0) return;
  for (const c of buildFixtureCategories()) categories.set(c.id, c);
}

export function resetCategoriesStore(): void {
  categories.clear();
  translations.clear();
  nextId = 100;
  ensureSeed();
}

export function getCategoryById(id: number): CategoryRead | null {
  ensureSeed();
  return categories.get(id) ?? null;
}

export function getCategoryTranslations(id: number) {
  ensureSeed();
  return translations.get(id) ?? {};
}

export function listCategoriesPage(opts: {
  search?: string;
  sort?: string;
  last_id?: number;
  limit?: number;
}): CategoryCursorPage {
  ensureSeed();
  let rows = Array.from(categories.values());
  if (opts.search) {
    const q = opts.search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) || r.slug.toLowerCase().includes(q),
    );
  }
  switch (opts.sort) {
    case "name_asc":
      rows.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "name_desc":
      rows.sort((a, b) => b.name.localeCompare(a.name));
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

type CategoryWrite = Partial<Omit<CategoryRead, "id" | "is_leaf">> & {
  name_translations?: Record<string, string>;
  description_translations?: Record<string, string>;
};

export function createCategoryRecord(input: CategoryWrite): CategoryRead {
  ensureSeed();
  const id = nextId++;
  const record: CategoryRead = {
    id,
    name: input.name ?? "",
    slug: input.slug ?? "",
    icon: input.icon ?? null,
    description: input.description ?? null,
    sort_order: input.sort_order ?? 100,
    parent_id: input.parent_id ?? null,
    is_leaf: true,
    attribute_schema: input.attribute_schema ?? null,
    publication_currency: input.publication_currency ?? null,
    publication_price_monthly: input.publication_price_monthly ?? null,
    publication_price_monthly_discounted:
      input.publication_price_monthly_discounted ?? null,
  };
  categories.set(id, record);
  translations.set(id, {
    name_translations: input.name_translations,
    description_translations: input.description_translations,
  });
  // Parent is no longer a leaf.
  if (record.parent_id != null) {
    const parent = categories.get(record.parent_id);
    if (parent) categories.set(parent.id, { ...parent, is_leaf: false });
  }
  return record;
}

export function updateCategoryRecord(
  id: number,
  patch: CategoryWrite,
): CategoryRead | null {
  ensureSeed();
  const current = categories.get(id);
  if (!current) return null;
  const updated: CategoryRead = {
    ...current,
    ...(patch.name !== undefined ? { name: patch.name } : {}),
    ...(patch.slug !== undefined ? { slug: patch.slug } : {}),
    ...(patch.icon !== undefined ? { icon: patch.icon } : {}),
    ...(patch.description !== undefined
      ? { description: patch.description }
      : {}),
    ...(patch.sort_order !== undefined
      ? { sort_order: patch.sort_order }
      : {}),
    ...(patch.parent_id !== undefined ? { parent_id: patch.parent_id } : {}),
    ...(patch.attribute_schema !== undefined
      ? { attribute_schema: patch.attribute_schema }
      : {}),
    ...(patch.publication_currency !== undefined
      ? { publication_currency: patch.publication_currency }
      : {}),
    ...(patch.publication_price_monthly !== undefined
      ? { publication_price_monthly: patch.publication_price_monthly }
      : {}),
    ...(patch.publication_price_monthly_discounted !== undefined
      ? {
          publication_price_monthly_discounted:
            patch.publication_price_monthly_discounted,
        }
      : {}),
  };
  categories.set(id, updated);
  const prevTr = translations.get(id) ?? {};
  translations.set(id, {
    name_translations:
      patch.name_translations ?? prevTr.name_translations,
    description_translations:
      patch.description_translations ?? prevTr.description_translations,
  });
  return updated;
}

export function deleteCategoryRecord(id: number): boolean {
  ensureSeed();
  return categories.delete(id);
}

export function hasChildren(id: number): boolean {
  ensureSeed();
  return Array.from(categories.values()).some((c) => c.parent_id === id);
}
