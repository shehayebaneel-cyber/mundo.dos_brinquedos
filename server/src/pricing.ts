// Cart-based tiered pricing — server copy (authoritative at checkout).
// MUST stay in sync with web/src/lib/pricing.ts.
//   Tier 1 regular (<10 items) · Tier 2 (10+ items) · Tier 3 (cart value ≥ threshold, overrides).
// Value is measured on the regular-price subtotal; a product only takes a tier
// price it actually has, else its best available lower price.

export const TIER2_MIN_ITEMS = 10;
export type Tier = 1 | 2 | 3;

export type TierPrices = {
  regularCents: number;
  price10Cents: number | null;
  wholesaleCents: number | null;
};

export function unitForTier(p: TierPrices, tier: Tier): number {
  if (tier === 3) return p.wholesaleCents ?? p.price10Cents ?? p.regularCents;
  if (tier === 2) return p.price10Cents ?? p.regularCents;
  return p.regularCents;
}

export function cartTier(totalItems: number, grossCents: number, thresholdCents: number): Tier {
  if (thresholdCents > 0 && grossCents >= thresholdCents) return 3;
  if (totalItems >= TIER2_MIN_ITEMS) return 2;
  return 1;
}

// Full-box pricing: complete boxes at the fixed box price, remainder at the tier unit price.
export function lineTotal(
  l: TierPrices & { boxUnits: number; boxPriceCents: number | null; boxActive: boolean; qty: number },
  tier: Tier,
): { boxes: number; remainderUnits: number; unitCents: number; boxPriceCents: number; total: number } {
  const unitCents = unitForTier(l, tier);
  const usesBox = l.boxActive && l.boxUnits > 0 && l.boxPriceCents != null;
  const boxes = usesBox ? Math.floor(l.qty / l.boxUnits) : 0;
  const boxPriceCents = usesBox ? (l.boxPriceCents as number) : 0;
  const remainderUnits = l.qty - boxes * l.boxUnits;
  return { boxes, remainderUnits, unitCents, boxPriceCents, total: boxes * boxPriceCents + remainderUnits * unitCents };
}
