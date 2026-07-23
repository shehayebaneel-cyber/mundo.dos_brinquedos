// ============================================================================
// Cart-based tiered pricing (Mundo dos Brinquedos)
//   Tier 1 — regular price          : fewer than 10 items in the cart
//   Tier 2 — 10+ items price        : 10 or more items total (any mix of products)
//   Tier 3 — wholesale-value price  : cart's regular value reaches the threshold
// Tier 3 overrides Tier 2. The value threshold is measured on the REGULAR-price
// subtotal so the tier only ever improves as the cart grows (never oscillates).
// A product only moves to a tier if it has that tier's price set; otherwise it
// keeps its best available lower price.
// This file is mirrored in server/src/pricing.ts — keep them in sync.
// ============================================================================

export const TIER2_MIN_ITEMS = 10;
export type Tier = 1 | 2 | 3;

export type TierPrices = {
  regularCents: number;
  price10Cents: number | null;
  wholesaleCents: number | null;
};

// Per-product full-box pricing (independent of the cart-wide tier)
export type BoxPrices = {
  boxUnits: number; // units in one full box (packQty)
  boxPriceCents: number | null; // fixed price for a full box
  boxActive: boolean;
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

// Extra per-line fields the cart/UI needs
export type LineExtras = {
  unitCents: number; // current tier unit price (for loose/remainder units)
  boxes: number; // number of full boxes in this line
  boxUnits: number; // units per box (0 if not a box product)
  boxPriceCents: number; // price of one box (0 if not a box product)
  remainderUnits: number; // units billed individually (qty - boxes*boxUnits)
  lineTotalCents: number; // total for the whole line (boxes + remainder)
};
export type Priced<T> = T & LineExtras;

export type CartPricing<T> = {
  tier: Tier;
  totalItems: number;
  grossCents: number; // subtotal at regular prices
  subtotalCents: number; // subtotal actually charged (tiers + boxes)
  savingsCents: number;
  itemsToTier2: number; // more items needed to unlock tier 2 (0 if reached)
  centsToTier3: number; // more value needed to unlock tier 3 (0 if reached / no threshold)
  thresholdCents: number;
  lines: Priced<T>[];
};

export function priceCart<T extends TierPrices & Partial<BoxPrices> & { qty: number }>(lines: T[], thresholdCents: number): CartPricing<T> {
  const totalItems = lines.reduce((s, l) => s + l.qty, 0);
  const grossCents = lines.reduce((s, l) => s + l.regularCents * l.qty, 0);
  const tier = cartTier(totalItems, grossCents, thresholdCents);
  const priced = lines.map((l) => {
    const unitCents = unitForTier(l, tier);
    const boxUnits = l.boxUnits ?? 0;
    const usesBox = !!l.boxActive && boxUnits > 0 && l.boxPriceCents != null;
    const boxes = usesBox ? Math.floor(l.qty / boxUnits) : 0;
    const boxPriceCents = usesBox ? (l.boxPriceCents as number) : 0;
    const remainderUnits = l.qty - boxes * boxUnits;
    const lineTotalCents = boxes * boxPriceCents + remainderUnits * unitCents;
    return { ...l, unitCents, boxes, boxUnits, boxPriceCents, remainderUnits, lineTotalCents };
  });
  const subtotalCents = priced.reduce((s, l) => s + l.lineTotalCents, 0);
  return {
    tier,
    totalItems,
    grossCents,
    subtotalCents,
    savingsCents: Math.max(0, grossCents - subtotalCents),
    itemsToTier2: Math.max(0, TIER2_MIN_ITEMS - totalItems),
    centsToTier3: thresholdCents > 0 ? Math.max(0, thresholdCents - grossCents) : 0,
    thresholdCents,
    lines: priced,
  };
}
