import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useStore } from "./store";
import { priceCart, type Priced, type Tier } from "./pricing";
import { api } from "./api";
import type { Product } from "./types";

export type CartLine = {
  productId: number;
  slug: string;
  name: string;
  image: string;
  variant: string;
  qty: number;
  stock: number;
  // three tier prices carried per line so the cart can re-price itself
  regularCents: number;
  price10Cents: number | null;
  wholesaleCents: number | null;
};

type CartCtx = {
  lines: Priced<CartLine>[]; // each line carries the active-tier unitCents
  count: number;
  subtotalCents: number; // at the active tier
  grossCents: number; // at regular prices
  savingsCents: number;
  tier: Tier;
  itemsToTier2: number;
  centsToTier3: number;
  thresholdCents: number;
  add: (line: Omit<CartLine, "qty">, qty?: number) => void;
  setQty: (productId: number, variant: string, qty: number) => void;
  remove: (productId: number, variant: string) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "mundo_cart_v2";

// Back-compat: older carts stored a single `priceCents`. Map it to regularCents.
function normalize(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((l) => ({
    productId: l.productId,
    slug: l.slug,
    name: l.name,
    image: l.image ?? "",
    variant: l.variant ?? "",
    qty: l.qty ?? 1,
    stock: l.stock ?? 99,
    regularCents: l.regularCents ?? l.priceCents ?? 0,
    price10Cents: l.price10Cents ?? null,
    wholesaleCents: l.wholesaleCents ?? null,
  }));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { settings } = useStore();
  const thresholdCents = Number(settings.wholesaleThresholdCents ?? 30000) || 0;

  const [lines, setLines] = useState<CartLine[]>(() => {
    try {
      return normalize(JSON.parse(localStorage.getItem(KEY) ?? localStorage.getItem("mundo_cart_v1") ?? "[]"));
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(lines));
  }, [lines]);

  // Re-price each line from LIVE product data so the cart always reflects the
  // current regular + tier prices (prices are never trusted from the snapshot).
  const refreshed = useRef(new Set<string>());
  const idKey = lines.map((l) => l.slug).join(",");
  useEffect(() => {
    const todo = lines.filter((l) => !refreshed.current.has(l.slug));
    if (!todo.length) return;
    todo.forEach((l) => refreshed.current.add(l.slug));
    Promise.all(
      todo.map((l) => api.get<{ product: Product }>(`/api/products/${l.slug}`).then((r) => r.product).catch(() => null)),
    ).then((prods) => {
      const bySlug = new Map(prods.filter(Boolean).map((p) => [p!.slug, p!]));
      setLines((cur) =>
        cur.map((l) => {
          const p = bySlug.get(l.slug);
          return p ? { ...l, regularCents: p.priceCents, price10Cents: p.price10Cents, wholesaleCents: p.wholesaleCents, stock: p.stock } : l;
        }),
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idKey]);

  const key = (id: number, variant: string) => `${id}::${variant}`;

  const add: CartCtx["add"] = (line, qty = 1) => {
    setLines((cur) => {
      const k = key(line.productId, line.variant);
      const found = cur.find((l) => key(l.productId, l.variant) === k);
      if (found) {
        return cur.map((l) => (key(l.productId, l.variant) === k ? { ...l, qty: Math.min(l.stock, l.qty + qty) } : l));
      }
      return [...cur, { ...line, qty: Math.min(line.stock, qty) }];
    });
  };

  const setQty: CartCtx["setQty"] = (id, variant, qty) => {
    setLines((cur) =>
      cur
        .map((l) => (key(l.productId, l.variant) === key(id, variant) ? { ...l, qty: Math.max(0, Math.min(l.stock, qty)) } : l))
        .filter((l) => l.qty > 0),
    );
  };

  const remove: CartCtx["remove"] = (id, variant) =>
    setLines((cur) => cur.filter((l) => key(l.productId, l.variant) !== key(id, variant)));

  const clear = () => setLines([]);

  const value = useMemo<CartCtx>(() => {
    const p = priceCart(lines, thresholdCents);
    return {
      lines: p.lines,
      count: p.totalItems,
      subtotalCents: p.subtotalCents,
      grossCents: p.grossCents,
      savingsCents: p.savingsCents,
      tier: p.tier,
      itemsToTier2: p.itemsToTier2,
      centsToTier3: p.centsToTier3,
      thresholdCents: p.thresholdCents,
      add,
      setQty,
      remove,
      clear,
    };
  }, [lines, thresholdCents]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used within CartProvider");
  return c;
}
