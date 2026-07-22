import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { useStore } from "../lib/store";
import { useI18n } from "../lib/i18n";
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
  ["melhor-avaliados", "Melhor avaliados"],
] as const;

type Filters = {
  priceMin: string;
  priceMax: string;
  brands: string[];
  ages: string[];
  colours: string[];
  sizes: string[];
  inStock: boolean;
  lowStock: boolean;
  onSale: boolean;
  isNew: boolean;
  bestSeller: boolean;
  wholesale: boolean;
  minRating: number;
};
const EMPTY: Filters = {
  priceMin: "", priceMax: "", brands: [], ages: [], colours: [], sizes: [],
  inStock: false, lowStock: false, onSale: false, isNew: false, bestSeller: false, wholesale: false, minRating: 0,
};

export function Shop({ mode }: { mode?: "ofertas" | "search" | "all" }) {
  const { slug } = useParams();
  const [sp] = useSearchParams();
  const { categories } = useStore();
  const { t, tf } = useI18n();
  const q = sp.get("q") ?? "";
  const flagParam = sp.get("flag") ?? (mode === "ofertas" ? "ofertas" : "");

  const [items, setItems] = useState<Product[] | null>(null);
  const [sort, setSort] = useState("relevancia");
  const [f, setF] = useState<Filters>(() => ({
    ...EMPTY,
    onSale: mode === "ofertas" || flagParam === "ofertas",
    isNew: flagParam === "novidades",
    bestSeller: flagParam === "mais-vendidos",
  }));
  const [drawer, setDrawer] = useState(false);

  const cat = categories.find((c) => c.slug === slug);

  useEffect(() => {
    setItems(null);
    const params = new URLSearchParams();
    if (slug) params.set("category", slug);
    if (q) params.set("q", q);
    params.set("pageSize", "200");
    api.get<{ items: Product[] }>(`/api/products?${params}`).then((r) => setItems(r.items)).catch(() => setItems([]));
  }, [slug, q]);

  // facets derived from the fetched set
  const facets = useMemo(() => {
    const list = items ?? [];
    const brands = [...new Set(list.map((p) => p.brand).filter(Boolean))].sort();
    const ages = [...new Set(list.map((p) => p.ageGroup).filter(Boolean))].sort();
    const colourMap = new Map<string, string>();
    const sizes = new Set<string>();
    for (const p of list)
      for (const v of p.variants) {
        if (v.kind.includes("cor")) colourMap.set(v.label, v.swatch || "#ddd");
        if (v.kind.includes("tamanho")) sizes.add(v.label);
      }
    return { brands, ages, colours: [...colourMap.entries()], sizes: [...sizes] };
  }, [items]);

  const filtered = useMemo(() => {
    let list = items ?? [];
    if (f.priceMin) list = list.filter((p) => p.priceCents >= Number(f.priceMin) * 100);
    if (f.priceMax) list = list.filter((p) => p.priceCents <= Number(f.priceMax) * 100);
    if (f.brands.length) list = list.filter((p) => f.brands.includes(p.brand));
    if (f.ages.length) list = list.filter((p) => f.ages.includes(p.ageGroup));
    if (f.colours.length) list = list.filter((p) => p.variants.some((v) => v.kind.includes("cor") && f.colours.includes(v.label)));
    if (f.sizes.length) list = list.filter((p) => p.variants.some((v) => v.kind.includes("tamanho") && f.sizes.includes(v.label)));
    if (f.inStock) list = list.filter((p) => p.stock > 0);
    if (f.lowStock) list = list.filter((p) => p.stock > 0 && p.stock <= p.lowStockAt);
    if (f.onSale) list = list.filter((p) => discountPct(p.oldPriceCents, p.priceCents) > 0);
    if (f.isNew) list = list.filter((p) => p.isNew);
    if (f.bestSeller) list = list.filter((p) => p.bestSeller);
    if (f.wholesale) list = list.filter((p) => p.wholesaleCents != null);
    if (f.minRating) list = list.filter((p) => (p.avgRating ?? 0) >= f.minRating);

    const disc = (p: Product) => discountPct(p.oldPriceCents, p.priceCents);
    const arr = [...list];
    arr.sort((a, b) => {
      if (sort === "menor-preco") return a.priceCents - b.priceCents;
      if (sort === "maior-preco") return b.priceCents - a.priceCents;
      if (sort === "novidades") return +b.isNew - +a.isNew;
      if (sort === "mais-vendidos") return +b.bestSeller - +a.bestSeller || b.priceCents - a.priceCents;
      if (sort === "maiores-descontos") return disc(b) - disc(a);
      if (sort === "melhor-avaliados") return (b.avgRating ?? 0) - (a.avgRating ?? 0);
      return +b.featured - +a.featured || +b.bestSeller - +a.bestSeller;
    });
    return arr;
  }, [items, f, sort]);

  const activeCount =
    (f.priceMin || f.priceMax ? 1 : 0) + f.brands.length + f.ages.length + f.colours.length + f.sizes.length +
    [f.inStock, f.lowStock, f.onSale, f.isNew, f.bestSeller, f.wholesale].filter(Boolean).length + (f.minRating ? 1 : 0);

  const title = mode === "search" ? t('Busca: "{q}"', { q }) : mode === "ofertas" ? t("Ofertas") : cat ? tf(cat, "name") : t("Todos os produtos");

  const upd = (patch: Partial<Filters>) => setF((cur) => ({ ...cur, ...patch }));
  const toggleIn = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const panel = (
    <FilterPanel f={f} facets={facets} upd={upd} toggleIn={toggleIn} t={t} />
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-5">
      {cat ? (
        <div className="relative mb-5 overflow-hidden rounded-[26px] p-5 text-white sm:p-7" style={{ background: `var(--color-${cat.accent})` }}>
          <span className="dots pointer-events-none absolute inset-0 text-white/15" aria-hidden />
          <div className="relative flex items-center gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[22px] bg-white/20 text-4xl sm:h-20 sm:w-20 sm:text-5xl">{cat.emoji}</span>
            <div>
              <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{tf(cat, "name")}</h1>
              <p className="mt-0.5 text-sm text-white/90">
                <b>{items ? filtered.length : "…"}</b> {t("produtos")}{cat.blurb ? ` · ${tf(cat, "blurb")}` : ""}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <header className="mb-4">
          <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">{title}</h1>
        </header>
      )}

      {/* toolbar */}
      <div className="mb-4 flex items-center gap-2">
        <button onClick={() => setDrawer(true)} className="btn btn-ghost relative px-4 py-2 text-sm lg:hidden">
          ⚙️ {t("Filtros")}
          {activeCount > 0 && <span className="ml-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[10px] font-extrabold text-white">{activeCount}</span>}
        </button>
        <span className="text-sm text-muted">{items ? `${filtered.length} ${filtered.length === 1 ? t("produto") : t("produtos")}` : "…"}</span>
        <label className="ml-auto flex items-center gap-2 text-sm">
          <span className="hidden text-muted sm:inline">{t("Ordenar por")}:</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold">
            {SORTS.map(([v, l]) => <option key={v} value={v}>{t(l)}</option>)}
          </select>
        </label>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-40 max-h-[calc(100vh-11rem)] overflow-y-auto rounded-2xl border border-line bg-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-display font-bold text-ink">{t("Filtrar por")}</span>
              {activeCount > 0 && <button onClick={() => setF(EMPTY)} className="text-xs font-bold text-brand-dark">{t("Limpar")}</button>}
            </div>
            {panel}
          </div>
        </aside>

        <div>
          {!items ? (
            <Spinner />
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-line bg-surface p-12 text-center">
              <p className="text-4xl">🔍</p>
              <p className="mt-2 font-display text-lg font-bold text-ink">{t("Nenhum produto encontrado")}</p>
              <p className="mt-1 text-sm text-muted">{t("Tente remover alguns filtros ou buscar outro termo.")}</p>
              {activeCount > 0 && <button onClick={() => setF(EMPTY)} className="btn btn-ghost mt-4 px-5 py-2.5 text-sm">{t("Limpar filtros")}</button>}
            </div>
          ) : (
            <ProductGrid items={filtered} />
          )}
        </div>
      </div>

      {/* mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setDrawer(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-[1.5rem] bg-surface" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-line p-4">
              <span className="font-display text-lg font-extrabold text-ink">{t("Filtros")}{activeCount > 0 ? ` (${activeCount})` : ""}</span>
              <button onClick={() => setDrawer(false)} className="grid h-8 w-8 place-items-center rounded-full bg-surface-2 text-lg" aria-label={t("Fechar")}>✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{panel}</div>
            <div className="flex gap-2 border-t border-line p-3">
              <button onClick={() => setF(EMPTY)} className="btn btn-ghost flex-1 py-3">{t("Limpar")}</button>
              <button onClick={() => setDrawer(false)} className="btn btn-primary flex-[2] py-3">{t("Ver {n} produtos", { n: filtered.length })}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterPanel({
  f, facets, upd, toggleIn, t,
}: {
  f: Filters;
  facets: { brands: string[]; ages: string[]; colours: [string, string][]; sizes: string[] };
  upd: (p: Partial<Filters>) => void;
  toggleIn: (arr: string[], v: string) => string[];
  t: (s: string, p?: Record<string, string | number>) => string;
}) {
  const toggles: [keyof Filters, string][] = [
    ["inStock", "Em estoque"], ["onSale", "Promoção"], ["isNew", "Novidades"],
    ["bestSeller", "Mais vendidos"], ["lowStock", "Estoque baixo"], ["wholesale", "Disponível no atacado"],
  ];
  return (
    <div className="space-y-5 text-sm">
      {/* quick toggles */}
      <div className="flex flex-wrap gap-2">
        {toggles.map(([k, label]) => (
          <button
            key={k}
            onClick={() => upd({ [k]: !f[k] } as Partial<Filters>)}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${f[k] ? "border-brand bg-brand text-white" : "border-line bg-surface text-ink hover:border-brand/40"}`}
          >
            {t(label)}
          </button>
        ))}
      </div>

      {/* price */}
      <Group title={t("Preço")}>
        <div className="flex items-center gap-2">
          <span className="text-muted">R$</span>
          <input type="number" min={0} value={f.priceMin} onChange={(e) => upd({ priceMin: e.target.value })} placeholder={t("min")} className="w-full rounded-lg border border-line bg-surface px-2.5 py-1.5" />
          <span className="text-muted">–</span>
          <input type="number" min={0} value={f.priceMax} onChange={(e) => upd({ priceMax: e.target.value })} placeholder={t("máx")} className="w-full rounded-lg border border-line bg-surface px-2.5 py-1.5" />
        </div>
      </Group>

      {/* rating */}
      <Group title={t("Avaliação")}>
        <div className="flex flex-wrap gap-2">
          {[4, 3, 2].map((n) => (
            <button
              key={n}
              onClick={() => upd({ minRating: f.minRating === n ? 0 : n })}
              className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-bold ${f.minRating === n ? "border-brand bg-brand-soft text-brand-dark" : "border-line bg-surface text-ink"}`}
            >
              <span className="text-sun">★</span> {t("{n}+ estrelas", { n })}
            </button>
          ))}
        </div>
      </Group>

      <Group title={t("Marca")}>
        {facets.brands.length ? (
          <div className="space-y-1">
            {facets.brands.map((b) => (
              <label key={b} className="flex cursor-pointer items-center gap-2 py-0.5">
                <input type="checkbox" checked={f.brands.includes(b)} onChange={() => upd({ brands: toggleIn(f.brands, b) })} className="accent-brand" /> {b}
              </label>
            ))}
          </div>
        ) : <Soon t={t} />}
      </Group>

      <Group title={t("Idade")}>
        {facets.ages.length ? (
          <div className="flex flex-wrap gap-2">
            {facets.ages.map((a) => (
              <button key={a} onClick={() => upd({ ages: toggleIn(f.ages, a) })} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${f.ages.includes(a) ? "border-brand bg-brand text-white" : "border-line bg-surface text-ink"}`}>{t(a)}</button>
            ))}
          </div>
        ) : <Soon t={t} />}
      </Group>

      <Group title={t("Cor")}>
        {facets.colours.length ? (
          <div className="flex flex-wrap gap-2">
            {facets.colours.map(([label, swatch]) => {
              const on = f.colours.includes(label);
              return (
                <button key={label} onClick={() => upd({ colours: toggleIn(f.colours, label) })} title={t(label)} className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${on ? "border-brand bg-brand-soft text-brand-dark" : "border-line bg-surface text-ink"}`}>
                  <span className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ background: swatch }} /> {t(label)}
                </button>
              );
            })}
          </div>
        ) : <Soon t={t} />}
      </Group>

      <Group title={t("Tamanho / capacidade")}>
        {facets.sizes.length ? (
          <div className="flex flex-wrap gap-2">
            {facets.sizes.map((s) => (
              <button key={s} onClick={() => upd({ sizes: toggleIn(f.sizes, s) })} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${f.sizes.includes(s) ? "border-brand bg-brand text-white" : "border-line bg-surface text-ink"}`}>{t(s)}</button>
            ))}
          </div>
        ) : <Soon t={t} />}
      </Group>

      <Group title={t("Material")}><Soon t={t} /></Group>
    </div>
  );
}

function Soon({ t }: { t: (s: string) => string }) {
  return <p className="text-xs text-muted">{t("Em breve — em atualização.")}</p>;
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 font-display text-sm font-bold text-ink">{title}</p>
      {children}
    </div>
  );
}
