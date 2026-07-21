import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useWishlist } from "../lib/wishlist";
import { useI18n } from "../lib/i18n";
import type { Product } from "../lib/types";
import { ProductGrid, Spinner } from "../components/ui";

export function Favoritos() {
  const wish = useWishlist();
  const { t } = useI18n();
  const [all, setAll] = useState<Product[] | null>(null);

  useEffect(() => {
    api.get<{ items: Product[] }>("/api/products?pageSize=100").then((r) => setAll(r.items)).catch(() => setAll([]));
  }, []);

  if (!all) return <Spinner />;
  const items = all.filter((p) => wish.has(p.id));

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-4 font-display text-2xl font-extrabold text-ink">{t("Meus favoritos")} ♥</h1>
      {items.length === 0 ? (
        <div className="rounded-[16px] border border-line bg-surface p-10 text-center">
          <p className="text-5xl">💛</p>
          <p className="mt-2 font-display text-lg font-bold text-ink">{t("Sua lista de favoritos está vazia")}</p>
          <p className="mt-1 text-sm text-muted">{t("Toque no coração dos produtos que você ama para salvá-los aqui.")}</p>
          <Link to="/produtos" className="btn btn-primary mt-4 px-6 py-3">{t("Explorar produtos")}</Link>
        </div>
      ) : (
        <ProductGrid items={items} />
      )}
    </div>
  );
}
