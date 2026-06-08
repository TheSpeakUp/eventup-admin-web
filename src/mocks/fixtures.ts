import type { ServiceDetail, ServiceStatus } from "@/lib/services/types";

const STATUSES: ServiceStatus[] = [
  "draft",
  "on_review",
  "published",
  "unpublished",
  "archived",
];

const CATEGORIES = [
  "Catering",
  "Photography",
  "Music & DJ",
  "Venue",
  "Decor",
  "Transportation",
];

const PROVIDER_IDS = [1, 2, 3, 4, 5];

function pick<T>(arr: readonly T[], i: number): T {
  return arr[i % arr.length] as T;
}

// id=9999 is the always-409 conflict fixture used by e2e to assert error surfacing.
export const CONFLICT_SERVICE_ID = 9999;

export function buildFixtureServices(): ServiceDetail[] {
  const out: ServiceDetail[] = [];
  out.push({
    id: CONFLICT_SERVICE_ID,
    title: "Conflict fixture (always 409 on actions)",
    provider_id: 1,
    status: "on_review",
    category_id: 1,
    recipient_type: 0,
    base_price_minor: 12_345,
    currency: "USD",
    remote_available: false,
    description: "Used by Playwright to assert that 4xx surfaces inline.",
    pricing_type: "once",
    pricing_interval_minutes: null,
    max_units_per_order: null,
    external_url: null,
    address: null,
    attributes: null,
    created_at: "2026-05-01T10:00:00.000Z",
    updated_at: "2026-05-01T10:00:00.000Z",
  });
  for (let i = 0; i < 25; i++) {
    const providerId = pick(PROVIDER_IDS, i);
    const status = pick(STATUSES, i);
    const day = (i % 28) + 1;
    const updatedDay = ((i * 3) % 28) + 1;
    const dd = String(day).padStart(2, "0");
    const ud = String(updatedDay).padStart(2, "0");
    out.push({
      id: i + 1,
      title: `${pick(CATEGORIES, i)} package #${i + 1}`,
      provider_id: providerId,
      status,
      category_id: ((i % 6) + 1),
      recipient_type: i % 3,
      base_price_minor: 5_000 + i * 1_750,
      currency: "USD",
      remote_available: i % 2 === 0,
      description:
        `Sample service description for fixture #${i + 1}. ` +
        `Provider offers a ${pick(CATEGORIES, i).toLowerCase()} package suitable ` +
        `for mid-size corporate events.`,
      pricing_type: "once",
      pricing_interval_minutes: null,
      max_units_per_order: null,
      external_url: null,
      address: null,
      attributes: null,
      created_at: `2026-05-${dd}T10:00:00.000Z`,
      updated_at: `2026-06-${ud}T10:00:00.000Z`,
    });
  }
  return out;
}
