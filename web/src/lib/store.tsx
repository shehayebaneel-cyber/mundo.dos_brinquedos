import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "./api";
import type { Category, Settings } from "./types";

type StoreCtx = { settings: Settings; categories: Category[]; loading: boolean };
const Ctx = createContext<StoreCtx>({ settings: {}, categories: [], loading: true });

export function StoreProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get<Settings>("/api/settings"), api.get<Category[]>("/api/categories")])
      .then(([s, c]) => {
        setSettings(s);
        setCategories(c);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return <Ctx.Provider value={{ settings, categories, loading }}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore() {
  return useContext(Ctx);
}

// eslint-disable-next-line react-refresh/only-export-components
export function waLink(whatsapp: string, text: string) {
  return `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}
