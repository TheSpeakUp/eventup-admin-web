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
// Pending provider with NO evidence — verify 400s unless `override` is sent
// (mirrors backend T4 evidence gate for a company-kind provider).
export const EVIDENCE_MISSING_PROVIDER_ID = 9998;

export function buildFixtureProviders(): ProviderDetail[] {
  const out: ProviderDetail[] = [];
  out.push({
    id: CONFLICT_PROVIDER_ID,
    name: "Conflict fixture (always 409 on actions)",
    verification_status: "pending",
    location_id: null,
    location_name: null,
    services_count: 0,
    active_offers_count: 0,
    description: "Used by Playwright to assert that 4xx surfaces inline.",
    contact_email: "conflict@example.com",
    phone: null,
    website: null,
    account_currency: "USD",
    address: null,
    logo_url: null,
    verification_message: null,
    block_reason: null,
    verification_evidence: [],
    created_at: "2026-05-01T10:00:00.000Z",
    updated_at: "2026-05-01T10:00:00.000Z",
  });
  out.push({
    id: EVIDENCE_MISSING_PROVIDER_ID,
    name: "Evidence-missing fixture (verify needs override)",
    verification_status: "pending",
    location_id: null,
    location_name: null,
    services_count: 0,
    active_offers_count: 0,
    description: "Used by Playwright to assert the T4 evidence gate + override.",
    contact_email: "evidence@example.com",
    phone: null,
    website: null,
    account_currency: "USD",
    address: null,
    logo_url: null,
    verification_message: null,
    block_reason: null,
    verification_evidence: [],
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
      location_name: ["Dubai, UAE", "London, UK", "Berlin, DE", "Paris, FR", "Madrid, ES"][i % 5] as string,
      services_count: (i * 2) % 7,
      active_offers_count: i % 4,
      description:
        `Fixture provider #${i + 1}: ${name}. Mid-size operator covering corporate events.`,
      contact_email: `${slug(name)}@example.com`,
      phone: i % 2 === 0 ? `+1-555-01${String(i).padStart(2, "0")}` : null,
      website: i % 3 === 0 ? `https://${slug(name)}.example.com` : null,
      account_currency: ["USD", "EUR", "GBP", "AED"][i % 4] as string,
      address: i % 2 === 0 ? `${100 + i} Market St, Suite ${i + 1}` : null,
      logo_url: i % 3 === 0 ? `https://${slug(name)}.example.com/logo.png` : null,
      verification_message: status === "verified" ? "All documents reviewed." : null,
      block_reason: status === "blocked" ? "Insurance certificate expired." : null,
      // Seed evidence on the first fixture so the evidence-list UI has data to
      // render in tests; the rest submit nothing.
      verification_evidence:
        i === 0
          ? [
              {
                id: 1,
                evidence_type: "org_document",
                file_url: `https://${slug(name)}.example.com/org-cert.pdf`,
                caption: "Company registration certificate",
                created_at: `2026-05-${dd}T09:00:00.000Z`,
              },
              {
                id: 2,
                evidence_type: "identity_document",
                file_url: `https://${slug(name)}.example.com/id.jpg`,
                caption: null,
                created_at: `2026-05-${dd}T09:05:00.000Z`,
              },
            ]
          : [],
      created_at: `2026-05-${dd}T10:00:00.000Z`,
      updated_at: `2026-06-${ud}T10:00:00.000Z`,
    });
  }
  return out;
}
