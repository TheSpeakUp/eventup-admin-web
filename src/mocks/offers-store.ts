import { makeOfferDetailFixture } from "./offers-fixtures";
import type { OfferDetailCard, OfferStatus } from "@/lib/offers/types";

const OFFERS = new Map<number, OfferDetailCard>();

function seed(): void {
  if (OFFERS.size > 0) return;
  for (let i = 1; i <= 40; i++) {
    OFFERS.set(i, makeOfferDetailFixture(i));
  }
}

export function getOffer(id: number): OfferDetailCard | undefined {
  seed();
  return OFFERS.get(id);
}

export function getAllOffers(): OfferDetailCard[] {
  seed();
  return Array.from(OFFERS.values());
}

export function setOfferStatus(id: number, status: OfferStatus): OfferDetailCard | undefined {
  seed();
  const cur = OFFERS.get(id);
  if (!cur) return undefined;
  const next: OfferDetailCard = { ...cur, status };
  OFFERS.set(id, next);
  return next;
}
