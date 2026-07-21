import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartLine = {
  productId: number;
  slug: string;
  name: string;
  priceCents: number;
  image: string;
  variant: string;
  qty: number;
  stock: number;
};

type CartCtx = {
  lines: CartLine[];
  count: number;
  subtotalCents: number;
  add: (line: Omit<CartLine, "qty">, qty?: number) => void;
  setQty: (productId: number, variant: string, qty: number) => void;
  remove: (productId: number, variant: string) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "mundo_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(lines));
  }, [lines]);

  const key = (id: number, variant: string) => `${id}::${variant}`;

  const add: CartCtx["add"] = (line, qty = 1) => {
    setLines((cur) => {
      const k = key(line.productId, line.variant);
      const found = cur.find((l) => key(l.productId, l.variant) === k);
      if (found) {
        return cur.map((l) =>
          key(l.productId, l.variant) === k ? { ...l, qty: Math.min(l.stock, l.qty + qty) } : l,
        );
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

  const value = useMemo<CartCtx>(
    () => ({
      lines,
      count: lines.reduce((s, l) => s + l.qty, 0),
      subtotalCents: lines.reduce((s, l) => s + l.priceCents * l.qty, 0),
      add,
      setQty,
      remove,
      clear,
    }),
    [lines],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used within CartProvider");
  return c;
}
