import type { ServiceDetail, ServiceStatus } from "@/lib/services/types";

const STATUSES: ServiceStatus[] = [
  "pending_review",
  "published",
  "needs_changes",
  "hidden",
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

const PROVIDERS = [
  { id: "prv_aurora", name: "Aurora Events Co." },
  { id: "prv_blackbird", name: "Blackbird Studios" },
  { id: "prv_cardinal", name: "Cardinal Catering" },
  { id: "prv_drift", name: "Drift Sound" },
  { id: "prv_emberbloom", name: "Emberbloom Decor" },
];

function pad(n: number, width = 3): string {
  return n.toString().padStart(width, "0");
}

function pick<T>(arr: readonly T[], i: number): T {
  return arr[i % arr.length] as T;
}

export function buildFixtureServices(): ServiceDetail[] {
  const out: ServiceDetail[] = [];
  // Dedicated fixture the handlers treat as always-409 to exercise the
  // moderation error surface in e2e tests.
  out.push({
    id: "svc_conflict",
    title: "Conflict fixture (always 409 on actions)",
    provider_id: "prv_aurora",
    provider_name: "Aurora Events Co.",
    category: "Catering",
    price_cents: 12_345,
    currency: "USD",
    status: "pending_review",
    description: "Used by Playwright to assert that 4xx surfaces inline.",
    created_at: "2026-05-01T10:00:00.000Z",
    updated_at: "2026-05-01T10:00:00.000Z",
    last_moderation_note: null,
    last_moderator_email: null,
  });
  for (let i = 0; i < 25; i++) {
    const provider = pick(PROVIDERS, i);
    const status = pick(STATUSES, i);
    const day = (i % 28) + 1;
    const updatedDay = ((i * 3) % 28) + 1;
    out.push({
      id: `svc_${pad(i + 1)}`,
      title: `${pick(CATEGORIES, i)} package #${i + 1}`,
      provider_id: provider.id,
      provider_name: provider.name,
      category: pick(CATEGORIES, i),
      price_cents: 5_000 + i * 1_750,
      currency: "USD",
      status,
      description:
        `Sample service description for fixture #${i + 1}. ` +
        `Provider offers a ${pick(CATEGORIES, i).toLowerCase()} package suitable ` +
        `for mid-size corporate events.`,
      created_at: `2026-05-${pad(day, 2)}T10:00:00.000Z`,
      updated_at: `2026-06-${pad(updatedDay, 2)}T10:00:00.000Z`,
      last_moderation_note: status === "needs_changes" || status === "rejected"
        ? "Please attach pricing breakdown and one reference photo."
        : null,
      last_moderator_email: status === "pending_review" ? null : "admin@example.com",
    });
  }
  return out;
}
