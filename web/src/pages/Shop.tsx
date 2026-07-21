import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { useStore } from "../lib/store";
import type { Product } from "../lib/types";
import { discountPct } from "../lib/money";
import { ProductGrid, Spinner } from "../components/ui";

const SORTS = [
  ["relevancia", "Relevância"],
  ["menor-preco", "Menor preço"],
  ["maior-preco", "Maior preço"],
  ["mais-vendidos", "Mais vendidos"],
  ["novidades", "Novidades"],
  ["maiores-descontos", "Maiores descontos"],
] as const;

export function Shop({ mode }: { mode?: "ofertas" | "search" | "all" }) {
  const { slug } = useParams();
  const [sp] = useSearchParams();
  const { categories } = useStore();
  const q = sp.get("q") ?? "";
  const flagParam = sp.get("flag") ?? (mode === "ofertas" ? "ofertas" : "");

  const [items, setItems] = useState<Product[] | null>(null);
  const [sort, setSort] = useState("relevancia");
  const [onlyStock, setOnlyStock] = useState(false);
  const [onlyDiscount, setOnlyDiscount] = useState(mode === "ofertas");
  const [onlyNew, setOnlyNew] = useState(false);
  const [maxPrice, setMaxPrice] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const cat = categories.find((c) => c.slug === slug);

  useEffect(() => {
    setItems(null);
    const params = new URLSearchParams();
    if (slug) params.set("category", slug);
    if (q) params.set("q", q);
    if (flagParam) params.set("flag", flagParam);
    if (sort) params.set("sort", sort);
    if (onlyStock) params.set("available", "1");
    params.set("pageSize", "100");
    api.get<{ items: Product[] }>(`/api/products?${params}`).then((r) => setItems(r.items)).catch(() => setItems([]));
  }, [slug, q, flagParam, sort, onlyStock]);

  const filtered = useMemo(() => {
    let list = items ?? [];
    if (onlyDiscount) list = list.filter((p) => discountPct(p.oldPriceCents, p.priceCents) > 0);
    if (onlyNew) list = list.filter((p) => p.isNew);
    if (maxPrice > 0) list = list.filter((p) => p.priceCents <= maxPrice * 100);
    return list;
  }, [items, onlyDiscount, onlyNew, maxPrice]);

  const title = mode === "search" ? `Busca: "${q}"` : mode === "ofertas" ? "Ofertas" : cat ? cat.name : "Todos os produtos";

  const Filters = (
    <div className="space-y-4 text-sm">
      <div>
        <p className="mb-2 font-display font-bold text-ink">Ordenar por</p>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="w-full rounded-lg border border-line bg-surface px-3 py-2">
          {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <div>
        <p className="mb-2 font-display font-bold text-ink">Filtrar</p>
        <label className="flex items-center gap-2 py-1"><input type="checkbox" checked={onlyStock} onChange={(e) => setOnlyStock(e.target.checked)} className="accent-brand" /> Em estoque</label>
        <label className="flex items-center gap-2 py-1"><input type="checkbox" checked={onlyDiscount} onChange={(e) => setOnlyDiscount(e.target.checked)} className="accent-brand" /> Com desconto</label>
        <label className="flex items-center gap-2 py-1"><input type="checkbox" checked={onlyNew} onChange={(e) => setOnlyNew(e.target.checked)} className="accent-brand" /> Novidades</label>
      </div>
      <div>
        <p className="mb-1 font-display font-bold text-ink">Preço máximo</p>
        <div className="flex items-center gap-2">
          <span className="text-muted">R$</span>
          <input type="number" min={0} value={maxPrice || ""} onChange={(e) => setMaxPrice(Number(e.target.value))} placeholder="qualquer" className="w-full rounded-lg border border-line bg-surface px-3 py-2" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-5">
      <div className="mb-4">
        <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">{title}</h1>
        {cat?.blurb && <p className="mt-1 text-muted">{cat.blurb}</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block"><div className="sticky top-40 rounded-[16px] border border-line bg-surface p-4">{Filters}</div></aside>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted">{items ? `${filtered.length} produto${filtered.length === 1 ? "" : "s"}` : "…"}</span>
            <button onClick={() => setFiltersOpen(true)} className="btn btn-ghost px-4 py-2 text-sm lg:hidden">⚙️ Filtros</button>
          </div>

          {!items ? (
            <Spinner />
          ) : filtered.length === 0 ? (
            <div className="rounded-[16px] border border-line bg-surface p-10 text-center">
              <p className="text-4xl">🔍</p>
              <p className="mt-2 font-display text-lg font-bold text-ink">Nenhum produto encontrado</p>
              <p className="mt-1 text-sm text-muted">Tente remover alguns filtros ou buscar outro termo.</p>
            </div>
          ) : (
            <ProductGrid items={filtered} />
          )}
        </div>
      </div>

      {/* mobile filter drawer */}
      {filtersOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setFiltersOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-[1.5rem] bg-surface p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <span className="font-display text-lg font-extrabold text-ink">Filtros</span>
              <button onClick={() => setFiltersOpen(false)} className="text-xl">✕</button>
            </div>
            {Filters}
            <button onClick={() => setFiltersOpen(false)} className="btn btn-primary mt-4 w-full py-3">Ver {filtered.length} produtos</button>
          </div>
        </div>
      )}
    </div>
  );
}
