import type { ProviderDetail, ProviderStatus } from "@/lib/providers/types";

const STATUSES: ProviderStatus[] = [
  "pending_review",
  "approved",
  "suspended",
  "rejected",
];

const CATEGORIES = [
  "Catering",
  "Photography",
  "Music & DJ",
  "Venue",
  "Decor",
  "Transportation",
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

function pad(n: number, width = 3): string {
  return n.toString().padStart(width, "0");
}

function pick<T>(arr: readonly T[], i: number): T {
  return arr[i % arr.length] as T;
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function buildFixtureProviders(): ProviderDetail[] {
  const out: ProviderDetail[] = [];
  out.push({
    id: "prv_conflict",
    name: "Conflict fixture (always 409 on actions)",
    contact_email: "conflict@example.com",
    category: "Catering",
    status: "pending_review",
    description: "Used by Playwright to assert that 4xx surfaces inline.",
    website: null,
    phone: null,
    created_at: "2026-05-01T10:00:00.000Z",
    updated_at: "2026-05-01T10:00:00.000Z",
    last_moderation_note: null,
    last_moderator_email: null,
  });
  for (let i = 0; i < NAMES.length; i++) {
    const name = NAMES[i] as string;
    const status = pick(STATUSES, i);
    const day = (i % 28) + 1;
    const updatedDay = ((i * 3) % 28) + 1;
    const id = `prv_${pad(i + 1)}`;
    out.push({
      id,
      name,
      contact_email: `${slug(name)}@example.com`,
      category: pick(CATEGORIES, i),
      status,
      description:
        `Verified ${pick(CATEGORIES, i).toLowerCase()} provider operating ` +
        `since 2024. Fixture entry #${i + 1} for the mock backend.`,
      website: i % 2 === 0 ? `https://${slug(name)}.example.com` : null,
      phone: i % 3 === 0 ? `+1-555-01${pad(i + 1, 2)}` : null,
      created_at: `2026-05-${pad(day, 2)}T10:00:00.000Z`,
      updated_at: `2026-06-${pad(updatedDay, 2)}T10:00:00.000Z`,
      last_moderation_note:
        status === "rejected" || status === "suspended"
          ? "Documents incomplete — submit insurance certificate."
          : null,
      last_moderator_email: status === "pending_review" ? null : "admin@example.com",
    });
  }
  return out;
}
