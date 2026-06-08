import type { ProviderDetail, ProviderStatus } from "@/lib/providers/types";

const STATUSES: ProviderStatus[] = [
  "pending",
  "verified",
  "blocked",
  "canceled",
];

const NAMES = [
  "Aurora Events Co.",
  "Blackbird Studios",
  "Cardinal Catering",
  "Drift Sound",
  "Emberbloom Decor",
  "Fjord Photography",
  "Glasswing Venue",
  "Harborlight Transport",
  "Ivory Lane Florals",
  "Juniper Bar",
  "Kindling Catering",
  "Lumen Lighting",
  "Maple & Birch Events",
  "Northstar Strings",
  "Onyx Productions",
];

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function pick<T>(arr: readonly T[], i: number): T {
  return arr[i % arr.length] as T;
}

export const CONFLICT_PROVIDER_ID = 9999;

export function buildFixtureProviders(): ProviderDetail[] {
  const out: ProviderDetail[] = [];
  out.push({
    id: CONFLICT_PROVIDER_ID,
    name: "Conflict fixture (always 409 on actions)",
    verification_status: "pending",
    location_id: null,
    services_count: 0,
    active_offers_count: 0,
    description: "Used by Playwright to assert that 4xx surfaces inline.",
    contact_email: "conflict@example.com",
    phone: null,
    website: null,
    verification_message: null,
    block_reason: null,
    created_at: "2026-05-01T10:00:00.000Z",
    updated_at: "2026-05-01T10:00:00.000Z",
  });
  for (let i = 0; i < NAMES.length; i++) {
    const name = NAMES[i] as string;
    const status = pick(STATUSES, i);
    const day = (i % 28) + 1;
    const updatedDay = ((i * 3) % 28) + 1;
    const dd = String(day).padStart(2, "0");
    const ud = String(updatedDay).padStart(2, "0");
    out.push({
      id: i + 1,
      name,
      verification_status: status,
      location_id: ((i % 5) + 1),
      services_count: (i * 2) % 7,
      active_offers_count: i % 4,
      description:
        `Fixture provider #${i + 1}: ${name}. Mid-size operator covering corporate events.`,
      contact_email: `${slug(name)}@example.com`,
      phone: i % 2 === 0 ? `+1-555-01${String(i).padStart(2, "0")}` : null,
      website: i % 3 === 0 ? `https://${slug(name)}.example.com` : null,
      verification_message: status === "verified" ? "All documents reviewed." : null,
      block_reason: status === "blocked" ? "Insurance certificate expired." : null,
      created_at: `2026-05-${dd}T10:00:00.000Z`,
      updated_at: `2026-06-${ud}T10:00:00.000Z`,
    });
  }
  return out;
}
