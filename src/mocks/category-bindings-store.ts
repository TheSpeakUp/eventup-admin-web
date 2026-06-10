// src/mocks/category-bindings-store.ts
import type { CategoryAttributeBindingRead } from "@/lib/categories/types";
import { getAttributeDefinitionByKey } from "./attribute-definitions-store";
import { getCategoryById } from "./categories-store";
import { buildFixtureCategoryBindings } from "./category-bindings-fixtures";

// Keyed by "{category_id}:{attribute_key}" — the backend's natural upsert key.
const bindings = new Map<string, CategoryAttributeBindingRead>();
let nextBindingId = 100;

function bindingKey(categoryId: number, attributeKey: string): string {
  return `${categoryId}:${attributeKey}`;
}

function ensureSeed(): void {
  if (bindings.size > 0) return;
  for (const b of buildFixtureCategoryBindings())
    bindings.set(bindingKey(b.category_id, b.attribute_key), b);
}

export function resetCategoryBindingsStore(): void {
  bindings.clear();
  nextBindingId = 100;
  ensureSeed();
}

// null → unknown category (404). Sorting is the page's job (client-side).
export function listCategoryBindingRecords(
  categoryId: number,
): CategoryAttributeBindingRead[] | null {
  ensureSeed();
  if (!getCategoryById(categoryId)) return null;
  return Array.from(bindings.values()).filter(
    (b) => b.category_id === categoryId,
  );
}

export type CategoryBindingWrite = {
  descriptor?: Record<string, unknown>;
  group_name?: string | null;
  sort_order?: number;
  is_visible_in_filters?: boolean;
  is_visible_in_card?: boolean;
};

// Full upsert: omitted fields take schema defaults (NOT previous values) —
// mirrors the backend MarketplaceCategoryAttributeBindingUpsertRequest.
// null → unknown category or unknown attribute key (404).
export function upsertCategoryBindingRecord(
  categoryId: number,
  attributeKey: string,
  input: CategoryBindingWrite,
): CategoryAttributeBindingRead | null {
  ensureSeed();
  if (!getCategoryById(categoryId)) return null;
  const definition = getAttributeDefinitionByKey(attributeKey);
  if (!definition) return null;
  const k = bindingKey(categoryId, attributeKey);
  const existing = bindings.get(k);
  const record: CategoryAttributeBindingRead = {
    binding_id: existing?.binding_id ?? nextBindingId++,
    category_id: categoryId,
    attribute_definition_id: definition.id,
    attribute_key: attributeKey,
    descriptor: input.descriptor ?? {},
    group_name: input.group_name ?? null,
    sort_order: input.sort_order ?? 100,
    is_visible_in_filters: input.is_visible_in_filters ?? true,
    is_visible_in_card: input.is_visible_in_card ?? true,
    is_system: definition.is_system,
  };
  bindings.set(k, record);
  return record;
}

export function deleteCategoryBindingRecord(
  categoryId: number,
  attributeKey: string,
): boolean {
  ensureSeed();
  return bindings.delete(bindingKey(categoryId, attributeKey));
}
