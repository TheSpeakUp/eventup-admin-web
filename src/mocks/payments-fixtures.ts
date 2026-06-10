import type { PaymentDetail } from "@/lib/payments/types";

// A realistic spread across statuses and currencies so the list/filter/detail
// surfaces have something to exercise. Amounts are integer minor units.

type Seed = {
  status: string;
  currency: string;
  amount_minor: number;
  provider_name: string;
  service_title: string;
  withDiscount?: boolean;
  withFailure?: boolean;
};

const SEEDS: Seed[] = [
  {
    status: "succeeded",
    currency: "USD",
    amount_minor: 12500,
    provider_name: "Aurora Events Co.",
    service_title: "Keynote: Future of Events",
    withDiscount: true,
  },
  {
    status: "succeeded",
    currency: "EUR",
    amount_minor: 8000,
    provider_name: "Blackbird Studios",
    service_title: "Stage lighting package",
  },
  {
    status: "pending",
    currency: "GBP",
    amount_minor: 4500,
    provider_name: "Cardinal Catering",
    service_title: "Canapé service (50 pax)",
  },
  {
    status: "processing",
    currency: "USD",
    amount_minor: 30000,
    provider_name: "Drift Sound",
    service_title: "Full PA + engineer",
  },
  {
    status: "failed",
    currency: "AED",
    amount_minor: 55000,
    provider_name: "Emberbloom Decor",
    service_title: "Floral installation",
    withFailure: true,
  },
  {
    status: "canceled",
    currency: "EUR",
    amount_minor: 6000,
    provider_name: "Fjord Photography",
    service_title: "Half-day shoot",
  },
  {
    status: "refunded",
    currency: "USD",
    amount_minor: 18000,
    provider_name: "Glasswing Venue",
    service_title: "Evening hall rental",
    withDiscount: true,
  },
  {
    status: "succeeded",
    currency: "JPY",
    amount_minor: 50000,
    provider_name: "Harborlight Transport",
    service_title: "Guest shuttle (8h)",
  },
  {
    status: "succeeded",
    currency: "USD",
    amount_minor: 9900,
    provider_name: "Ivory Lane Florals",
    service_title: "Centerpiece set",
  },
  {
    status: "pending",
    currency: "GBP",
    amount_minor: 12000,
    provider_name: "Juniper Bar",
    service_title: "Cocktail bar (3h)",
  },
  {
    status: "succeeded",
    currency: "EUR",
    amount_minor: 21000,
    provider_name: "Kindling Catering",
    service_title: "Buffet dinner (80 pax)",
  },
  {
    status: "failed",
    currency: "USD",
    amount_minor: 7500,
    provider_name: "Lumen Lighting",
    service_title: "Uplighting kit",
    withFailure: true,
  },
];

// A detail-only payment carrying every nullable Stripe reference populated, so
// the detail spec can assert the full field set renders. Lives outside the
// list range high enough not to collide with the seeded sequence.
export const FULL_PAYMENT_ID = 9001;

export function buildFixturePayments(): PaymentDetail[] {
  const out: PaymentDetail[] = [];

  for (let i = 0; i < SEEDS.length; i++) {
    const s = SEEDS[i] as Seed;
    const id = i + 1;
    const day = String((i % 28) + 1).padStart(2, "0");
    const discount = s.withDiscount ? Math.round(s.amount_minor * 0.1) : null;
    const tax = Math.round(s.amount_minor * 0.05);
    const totalGross = s.amount_minor + tax - (discount ?? 0);
    out.push({
      id,
      provider: "stripe",
      resource_type: "service_offer",
      resource_id: 1000 + id,
      amount_minor: s.amount_minor,
      tax_amount_minor: tax,
      total_gross_minor: totalGross,
      currency: s.currency,
      status: s.status,
      failure_code: s.withFailure ? "card_declined" : null,
      failure_message: s.withFailure
        ? "The card was declined by the issuing bank."
        : null,
      stripe_checkout_session_id:
        s.status === "pending" ? `cs_test_${id}abc` : `cs_test_${id}xyz`,
      stripe_payment_intent_id:
        s.status === "pending" ? null : `pi_test_${id}def`,
      receipt_url:
        s.status === "succeeded"
          ? `https://pay.stripe.com/receipts/test_${id}`
          : null,
      stripe_promotion_code: s.withDiscount ? "LAUNCH10" : null,
      stripe_coupon_id: s.withDiscount ? `coupon_${id}` : null,
      discount_amount_minor: discount,
      provider_name: s.provider_name,
      service_title: s.service_title,
      created_at: `2026-05-${day}T10:00:00.000Z`,
      updated_at: `2026-06-${day}T14:30:00.000Z`,
      refunded_amount_minor: 0,
      // Mirrors backend semantics: only succeeded payments are refundable.
      refundable_amount_minor: s.status === "succeeded" ? totalGross : 0,
      refunds: [],
    });
  }

  out.push({
    id: FULL_PAYMENT_ID,
    provider: "stripe",
    resource_type: "service_offer",
    resource_id: 12345,
    amount_minor: 250000,
    tax_amount_minor: 12500,
    total_gross_minor: 237500,
    currency: "USD",
    status: "succeeded",
    failure_code: null,
    failure_message: null,
    stripe_checkout_session_id: "cs_test_full_reference",
    stripe_payment_intent_id: "pi_test_full_reference",
    receipt_url: "https://pay.stripe.com/receipts/test_full",
    stripe_promotion_code: "VIP25",
    stripe_coupon_id: "coupon_vip",
    discount_amount_minor: 25000,
    provider_name: "Northstar Strings",
    service_title: "String quartet (full evening)",
    created_at: "2026-05-15T09:15:00.000Z",
    updated_at: "2026-06-01T11:45:00.000Z",
    refunded_amount_minor: 0,
    refundable_amount_minor: 237500,
    refunds: [],
  });

  return out;
}
