import type { AttributeDefinitionRead } from "@/lib/attribute-definitions/types";

export function buildFixtureAttributeDefinitions(): AttributeDefinitionRead[] {
  return [
    {
      id: 1,
      key: "cuisine",
      descriptor: { type: "string", searchable: true },
      group_name: "catering",
      sort_order: 10,
      is_active: true,
      is_system: false,
      bindings_count: 3,
    },
    {
      id: 2,
      key: "seats",
      descriptor: { type: "integer", required: false },
      group_name: "venue",
      sort_order: 20,
      is_active: true,
      is_system: false,
      bindings_count: 1,
    },
    {
      id: 3,
      key: "legacy_flag",
      descriptor: { type: "boolean" },
      group_name: null,
      sort_order: 30,
      is_active: false,
      is_system: true,
      bindings_count: 0,
    },
  ];
}
