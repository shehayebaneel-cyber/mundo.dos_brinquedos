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

export type Priced<T> = T & { unitCents: number };

export type CartPricing<T> = {
  tier: Tier;
  totalItems: number;
  grossCents: number; // subtotal at regular prices
  subtotalCents: number; // subtotal at the active tier
  savingsCents: number;
  itemsToTier2: number; // more items needed to unlock tier 2 (0 if reached)
  centsToTier3: number; // more value needed to unlock tier 3 (0 if reached / no threshold)
  thresholdCents: number;
  lines: Priced<T>[];
};

export function priceCart<T extends TierPrices & { qty: number }>(lines: T[], thresholdCents: number): CartPricing<T> {
  const totalItems = lines.reduce((s, l) => s + l.qty, 0);
  const grossCents = lines.reduce((s, l) => s + l.regularCents * l.qty, 0);
  const tier = cartTier(totalItems, grossCents, thresholdCents);
  const priced = lines.map((l) => ({ ...l, unitCents: unitForTier(l, tier) }));
  const subtotalCents = priced.reduce((s, l) => s + l.unitCents * l.qty, 0);
  return {
    tier,
    totalItems,
    grossCents,
    subtotalCents,
    savingsCents: grossCents - subtotalCents,
    itemsToTier2: Math.max(0, TIER2_MIN_ITEMS - totalItems),
    centsToTier3: thresholdCents > 0 ? Math.max(0, thresholdCents - grossCents) : 0,
    thresholdCents,
    lines: priced,
  };
}
