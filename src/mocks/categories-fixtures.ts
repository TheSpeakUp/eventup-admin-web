// src/mocks/categories-fixtures.ts
import type { CategoryRead } from "@/lib/categories/types";

export function buildFixtureCategories(): CategoryRead[] {
  return [
    {
      id: 1,
      name: "Catering",
      slug: "catering",
      icon: "utensils",
      description: "Food & beverage providers",
      sort_order: 10,
      parent_id: null,
      is_leaf: false,
      attribute_schema: {
        cuisine: { type: "string", searchable: true },
        seats: { type: "integer", required: false },
      },
      publication_currency: "USD",
      publication_price_monthly: "49.00",
      publication_price_monthly_discounted: "39.00",
    },
    {
      id: 2,
      name: "Buffet Catering",
      slug: "buffet-catering",
      icon: null,
      description: "Self-serve buffet",
      sort_order: 20,
      parent_id: 1,
      is_leaf: true,
      attribute_schema: null,
      publication_currency: null,
      publication_price_monthly: null,
      publication_price_monthly_discounted: null,
    },
    {
      id: 3,
      name: "Venues",
      slug: "venues",
      icon: "building",
      description: "Event spaces",
      sort_order: 30,
      parent_id: null,
      is_leaf: true,
      attribute_schema: null,
      publication_currency: null,
      publication_price_monthly: null,
      publication_price_monthly_discounted: null,
    },
  ];
}
