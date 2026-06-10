// src/lib/promo-codes/types.ts
//
// Types mirror the EventUp backend admin promo-code schemas
// (`src/eventup/admin/marketplace/promo_admin_schemas.py`). Money/Decimal
// values cross the wire as strings to avoid float rounding; targeting is a
// rule-tree (`src/eventup/marketplace/promo/targeting.py`).

export const DISCOUNT_TYPES = ["percent", "fixed_amount"] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

// Targeting rule-tree dimensions (v1: provider / category / location).
export const TARGETING_DIMENSIONS = [
  "provider",
  "category",
  "location",
] as const;
export type TargetingDimension = (typeof TARGETING_DIMENSIONS)[number];

export type TargetingMatch = "in" | "not_in";

// Leaf node: a dimension matched against a set of positive entity ids.
export type TargetingCondition = {
  dimension: TargetingDimension;
  match: TargetingMatch;
  values: number[];
};

// Group node combining children with AND / OR.
export type TargetingGroup = {
  op: "AND" | "OR";
  rules: TargetingNode[];
};

export type TargetingNode = TargetingGroup | TargetingCondition;

// The backend accepts either {"root": <node>} or a bare root node; we always
// send the wrapped form for clarity.
export type TargetingRuleTree = { root: TargetingNode } | TargetingNode;

export type PromoCodeRead = {
  id: number;
  code: string;
  discount_type: string;
  discount_value: string; // Decimal serialized as string
  currency: string | null;
  max_uses: number | null;
  used_count: number;
  min_order_amount_minor: number | null;
  allowed_item_types: string[] | null;
  allowed_periods_count: number[] | null;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  stripe_coupon_id: string | null;
  targeting_rules: TargetingRuleTree | null;
  created_at: string;
};

export type PromoCodeListResponse = {
  items: PromoCodeRead[];
  total: number;
  has_more: boolean;
};

export type PromoCodeFilter = {
  code?: string;
  is_active?: boolean;
  item_type?: string;
  limit?: number;
  offset?: number;
};

// Create payload — code + discount are immutable after creation, so they only
// appear here (not in the update payload). Decimal/money fields are strings.
export type PromoCodeCreatePayload = {
  code: string;
  discount_type: DiscountType;
  discount_value: string;
  currency?: string | null;
  max_uses?: number | null;
  min_order_amount_minor?: number | null;
  allowed_item_types?: string[] | null;
  allowed_periods_count?: number[] | null;
  valid_from?: string | null;
  valid_until?: string | null;
  is_active?: boolean;
  stripe_coupon_id?: string | null;
  targeting_rules?: TargetingRuleTree | null;
};

// Update payload — mutable fields only (backend PromoCodeUpdate).
export type PromoCodeUpdatePayload = {
  is_active?: boolean | null;
  valid_until?: string | null;
  max_uses?: number | null;
  targeting_rules?: TargetingRuleTree | null;
};

export function isDiscountType(value: string): value is DiscountType {
  return (DISCOUNT_TYPES as readonly string[]).includes(value);
}

// --- Targeting helpers (shared by table summary, detail, and the form) --- //

// Unwrap the {root} wrapper if present, returning the top node (or null).
export function targetingRoot(
  tree: TargetingRuleTree | null | undefined,
): TargetingNode | null {
  if (!tree) return null;
  if ("root" in tree) return tree.root;
  return tree;
}

function isCondition(node: TargetingNode): node is TargetingCondition {
  return "dimension" in node;
}

// Walk the tree and bucket every leaf condition's value-count by dimension.
// Operator-tool targeting is created as a flat AND of one condition per
// dimension, but we count recursively so arbitrary backend trees still render.
export function targetingCounts(
  tree: TargetingRuleTree | null | undefined,
): Record<TargetingDimension, number> {
  const counts: Record<TargetingDimension, number> = {
    provider: 0,
    category: 0,
    location: 0,
  };
  const root = targetingRoot(tree);
  if (!root) return counts;
  const walk = (node: TargetingNode): void => {
    if (isCondition(node)) {
      counts[node.dimension] += node.values.length;
      return;
    }
    for (const child of node.rules) walk(child);
  };
  walk(root);
  return counts;
}

// "3 providers / 2 categories / 1 location" — or "Everyone" when untargeted.
export function targetingSummary(
  tree: TargetingRuleTree | null | undefined,
): string {
  const counts = targetingCounts(tree);
  const parts: string[] = [];
  if (counts.provider) parts.push(`${counts.provider} providers`);
  if (counts.category) parts.push(`${counts.category} categories`);
  if (counts.location) parts.push(`${counts.location} locations`);
  return parts.length > 0 ? parts.join(" / ") : "Everyone";
}

// Build a flat AND rule-tree from per-dimension id lists (operator UX). Empty
// lists are dropped; if nothing remains, returns null (= applies to everyone).
export function buildTargetingTree(input: {
  provider?: number[];
  category?: number[];
  location?: number[];
}): TargetingRuleTree | null {
  const conditions: TargetingCondition[] = [];
  const dims: TargetingDimension[] = ["provider", "category", "location"];
  for (const dim of dims) {
    const values = input[dim];
    if (values && values.length > 0) {
      conditions.push({ dimension: dim, match: "in", values });
    }
  }
  if (conditions.length === 0) return null;
  return { root: { op: "AND", rules: conditions } };
}

// Inverse of buildTargetingTree for prefilling the edit form: collect the
// "in" values per dimension from a flat tree.
export function extractTargetingIds(
  tree: TargetingRuleTree | null | undefined,
): Record<TargetingDimension, number[]> {
  const out: Record<TargetingDimension, number[]> = {
    provider: [],
    category: [],
    location: [],
  };
  const root = targetingRoot(tree);
  if (!root) return out;
  const walk = (node: TargetingNode): void => {
    if (isCondition(node)) {
      if (node.match === "in") out[node.dimension].push(...node.values);
      return;
    }
    for (const child of node.rules) walk(child);
  };
  walk(root);
  return out;
}
