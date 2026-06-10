// src/mocks/category-bindings-fixtures.ts
import type { CategoryAttributeBindingRead } from "@/lib/categories/types";

export function buildFixtureCategoryBindings(): CategoryAttributeBindingRead[] {
  return [
    {
      binding_id: 1,
      category_id: 1,
      attribute_definition_id: 1,
      attribute_key: "cuisine",
      descriptor: { type: "string", searchable: true },
      group_name: "catering",
      sort_order: 10,
      is_visible_in_filters: true,
      is_visible_in_card: true,
      is_system: false,
    },
    {
      binding_id: 2,
      category_id: 1,
      attribute_definition_id: 2,
      attribute_key: "seats",
      descriptor: { type: "integer", required: false },
      group_name: "venue",
      sort_order: 20,
      is_visible_in_filters: true,
      is_visible_in_card: false,
      is_system: false,
    },
  ];
}
