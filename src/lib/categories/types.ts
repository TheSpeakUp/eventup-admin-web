// src/lib/categories/types.ts

export const CATEGORY_SORTS = [
  "sort_order_asc",
  "sort_order_desc",
  "name_asc",
  "name_desc",
] as const;
export type CategorySort = (typeof CATEGORY_SORTS)[number];

// Supported attribute descriptor types (backend validate_category_attributes_schema).
export const ATTRIBUTE_TYPES = [
  "string",
  "integer",
  "number",
  "boolean",
  "date",
  "datetime",
  "array_string",
  "array_integer",
  "array_number",
  "array_boolean",
] as const;
export type AttributeType = (typeof ATTRIBUTE_TYPES)[number];

export type AttributeDescriptor = {
  type?: AttributeType;
  required?: boolean;
  searchable?: boolean;
  enum?: Array<string | number | boolean>;
};
export type AttributeSchema = Record<string, AttributeDescriptor>;

export type CategoryRead = {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  sort_order: number;
  parent_id: number | null;
  is_leaf: boolean;
  attribute_schema: AttributeSchema | null;
  publication_currency: string | null;
  publication_price_monthly: string | null;
  publication_price_monthly_discounted: string | null;
};

export type CategoryCursorPage = {
  items: CategoryRead[];
  next_last_id: number | null;
  has_more: boolean;
  count: number;
};

export type CategoryListQuery = {
  search?: string;
  sort?: CategorySort;
  last_id?: number;
  limit?: number;
};

// Mutation payload: prices serialized as strings (backend Decimal accepts strings,
// avoids float rounding). Omitted keys = unchanged on PUT.
export type CategoryMutationPayload = {
  name?: string;
  slug?: string;
  icon?: string | null;
  description?: string | null;
  name_translations?: Record<string, string>;
  description_translations?: Record<string, string>;
  sort_order?: number;
  parent_id?: number | null;
  attribute_schema?: AttributeSchema | null;
  publication_currency?: string | null;
  publication_price_monthly?: string | null;
  publication_price_monthly_discounted?: string | null;
};

export function isCategorySort(value: string): value is CategorySort {
  return (CATEGORY_SORTS as readonly string[]).includes(value);
}

// ---- Category↔attribute bindings sub-resource (F14) ----

export type CategoryAttributeBindingRead = {
  binding_id: number;
  category_id: number;
  attribute_definition_id: number;
  attribute_key: string;
  descriptor: Record<string, unknown>;
  group_name: string | null;
  sort_order: number;
  is_visible_in_filters: boolean;
  is_visible_in_card: boolean;
  is_system: boolean;
};

export type CategoryAttributeBindingListResponse = {
  items: CategoryAttributeBindingRead[];
  count: number;
};

// PUT is a FULL upsert: omitted fields fall back to schema defaults on the
// backend (group_name=null, sort_order=100, flags=true) — they do NOT mean
// "unchanged". All fields are required here so the form always sends them.
export type CategoryAttributeBindingUpsertPayload = {
  descriptor: Record<string, unknown> | string;
  group_name: string | null;
  sort_order: number;
  is_visible_in_filters: boolean;
  is_visible_in_card: boolean;
};
