import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type WishCtx = { ids: number[]; has: (id: number) => boolean; toggle: (id: number) => void; count: number };
const Ctx = createContext<WishCtx | null>(null);
const KEY = "mundo_wishlist_v1";

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? "[]");
    } catch {
      return [];
    }
  });
  useEffect(() => localStorage.setItem(KEY, JSON.stringify(ids)), [ids]);

  const value = useMemo<WishCtx>(
    () => ({
      ids,
      count: ids.length,
      has: (id) => ids.includes(id),
      toggle: (id) => setIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id])),
    }),
    [ids],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWishlist() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useWishlist must be used within WishlistProvider");
  return c;
}
