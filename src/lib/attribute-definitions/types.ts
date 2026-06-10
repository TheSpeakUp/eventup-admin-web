export const ATTRIBUTE_DEFINITION_SORTS = [
  "key_asc",
  "key_desc",
  "sort_order_asc",
  "sort_order_desc",
] as const;
export type AttributeDefinitionSort =
  (typeof ATTRIBUTE_DEFINITION_SORTS)[number];

// descriptor is a freeform JSON object on read (backend normalizes dict|str → dict).
export type AttributeDescriptorDoc = Record<string, unknown>;

export type AttributeDefinitionRead = {
  id: number;
  key: string;
  descriptor: AttributeDescriptorDoc;
  group_name: string | null;
  sort_order: number;
  is_active: boolean;
  is_system: boolean;
  bindings_count: number;
};

export type AttributeDefinitionCursorPage = {
  items: AttributeDefinitionRead[];
  next_last_id: number | null;
  has_more: boolean;
  count: number;
};

export type AttributeDefinitionListQuery = {
  search?: string;
  group_name?: string;
  is_active?: boolean;
  sort?: AttributeDefinitionSort;
  last_id?: number;
  limit?: number;
};

// Mutation payload. `key` is create-only (immutable PK). Omitted keys = unchanged on PUT.
export type AttributeDefinitionMutationPayload = {
  key?: string;
  descriptor?: AttributeDescriptorDoc | string;
  group_name?: string | null;
  sort_order?: number;
  is_active?: boolean;
  is_system?: boolean;
};

export function isAttributeDefinitionSort(
  value: string,
): value is AttributeDefinitionSort {
  return (ATTRIBUTE_DEFINITION_SORTS as readonly string[]).includes(value);
}
