import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../../lib/api";
import { brl } from "../../lib/money";
import type { Product } from "../../lib/types";
import { Thumb } from "../../components/Thumb";
import { useI18n } from "../../lib/i18n";
import { useStore } from "../../lib/store";

type Resp = { items: Product[]; total: number; page: number; pageSize: number };

const SORTS = [
  ["recent", "Mais recentes"], ["oldest", "Mais antigos"], ["updated", "Editado recentemente"],
  ["name", "Nome (A-Z)"], ["price_asc", "Menor preço"], ["price_desc", "Maior preço"],
  ["stock_asc", "Menor estoque"], ["stock_desc", "Maior estoque"], ["best", "Mais vendidos"],
] as const;

export function AdminProducts() {
  const { t } = useI18n();
  const { categories } = useStore();
  const [sp, setSp] = useSearchParams();
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(true);
  const [qInput, setQInput] = useState(sp.get("q") ?? "");
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [allMatching, setAllMatching] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);

  // read state from the URL so it survives returning from an edit
  const get = (k: string, d = "") => sp.get(k) ?? d;
  const page = Math.max(1, Number(get("page", "1")));
  const pageSize = Number(get("pageSize", "24"));

  const set = (patch: Record<string, string | number | null>) => {
    const next = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "" ) next.delete(k);
      else next.set(k, String(v));
    }
    if (!("page" in patch)) next.set("page", "1"); // reset to page 1 on any filter change
    setSp(next, { replace: true });
  };

  const query = useMemo(() => sp.toString(), [sp]);
  useEffect(() => {
    setLoading(true);
    api.aGet<Resp>(`/api/admin/products?${query}`).then((r) => { setData(r); setLoading(false); }).catch(() => { setData({ items: [], total: 0, page: 1, pageSize }); setLoading(false); });
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  // debounced search box → URL
  useEffect(() => {
    const id = setTimeout(() => { if (qInput !== get("q")) set({ q: qInput }); }, 350);
    return () => clearTimeout(id);
  }, [qInput]); // eslint-disable-line react-hooks/exhaustive-deps

  async function del(p: Product) {
    if (!confirm(t('Excluir "{name}"? Esta ação não pode ser desfeita.', { name: p.name }))) return;
    await api.aDel(`/api/admin/products/${p.id}`);
    reload();
  }
  async function duplicate(p: Product) {
    const full = await api.aGet<Product>(`/api/admin/products/${p.id}`);
    await api.aPost("/api/admin/products", {
      ...full, slug: `${full.slug}-copia-${Date.now().toString().slice(-4)}`, name: `${full.name} (cópia)`,
      images: full.images.map((i) => ({ url: i.url, alt: i.alt })), variants: full.variants,
    });
    reload();
  }
  const reload = () => api.aGet<Resp>(`/api/admin/products?${query}`).then(setData);

  // clear selection whenever the filter/page/search changes
  useEffect(() => { setSel(new Set()); setAllMatching(false); }, [query]);

  const pageItems = data?.items ?? [];
  const pageIds = pageItems.map((p) => p.id);
  const pageAllSelected = pageIds.length > 0 && pageIds.every((id) => sel.has(id));
  const selCount = allMatching ? (data?.total ?? 0) : sel.size;

  const toggleOne = (id: number) => setSel((cur) => { const n = new Set(cur); n.has(id) ? n.delete(id) : n.add(id); setAllMatching(false); return n; });
  const togglePage = () => { setAllMatching(false); setSel((cur) => { const n = new Set(cur); if (pageAllSelected) pageIds.forEach((id) => n.delete(id)); else pageIds.forEach((id) => n.add(id)); return n; }); };
  const clearSel = () => { setSel(new Set()); setAllMatching(false); };

  async function resolveIds(): Promise<number[]> {
    if (allMatching) return (await api.aGet<{ ids: number[] }>(`/api/admin/products?${query}&idsOnly=1`)).ids;
    return [...sel];
  }
  async function bulk(action: string, params: Record<string, unknown> = {}, confirmMsg?: string) {
    const ids = await resolveIds();
    if (!ids.length) return;
    if (confirmMsg && !confirm(confirmMsg.replace("{n}", String(ids.length)))) return;
    setBulkBusy(true);
    try {
      const r = await api.aPost<{ affected: number }>("/api/admin/products/bulk", { action, ids, ...params });
      clearSel();
      await reload();
      alert(t("{n} produtos atualizados.", { n: r.affected }));
    } finally { setBulkBusy(false); }
  }
  async function exportCsv() {
    const r = await api.aGet<Resp>(`/api/admin/products?${query}&pageSize=100000`);
    const qc = (s: unknown) => `"${String(s ?? "").replace(/"/g, '""')}"`;
    const head = ["id", "nome", "codigo", "categoria", "subcategoria", "preco", "preco10", "atacado", "estoque", "ativo", "novo", "destaque", "top", "imagem"];
    const body = r.items.map((p) => [p.id, qc(p.name), qc(p.sku), qc(p.category?.name ?? ""), qc(p.subcat), p.priceCents, p.price10Cents ?? "", p.wholesaleCents ?? "", p.stock, p.active, p.isNew, p.featured, p.bestSeller, qc(p.images[0]?.url ?? "")].join(","));
    const blob = new Blob(["﻿" + [head.join(","), ...body].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "produtos.csv"; a.click(); URL.revokeObjectURL(url);
  }

  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const activeFilters = (["category", "subcat", "brand", "status", "stock", "flag", "tier", "missing", "priceMin", "priceMax"] as const).filter((k) => sp.get(k));

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h1 className="font-display text-2xl font-extrabold text-ink">{t("Produtos")} <span className="text-muted">({total})</span></h1>
        <Link to="/admin/produtos/novo" className="btn btn-primary ml-auto px-4 py-2 text-sm">{t("+ Novo produto")}</Link>
      </div>

      {/* search + sort + page size */}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <input value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder={t("Buscar por nome, código, categoria, marca…")} className="min-w-[240px] flex-1 rounded-full border border-line bg-surface px-4 py-2 text-sm" />
        <select value={get("sort", "recent")} onChange={(e) => set({ sort: e.target.value })} className="rounded-full border border-line bg-surface px-3 py-2 text-sm font-semibold">
          {SORTS.map(([v, l]) => <option key={v} value={v}>{t(l)}</option>)}
        </select>
        <select value={String(pageSize)} onChange={(e) => set({ pageSize: e.target.value })} className="rounded-full border border-line bg-surface px-3 py-2 text-sm">
          {[24, 50, 100, 200].map((n) => <option key={n} value={n}>{n}/pág.</option>)}
        </select>
      </div>

      {/* filters row */}
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <select value={get("category")} onChange={(e) => set({ category: e.target.value })} className="rounded-lg border border-line bg-surface px-2.5 py-1.5">
          <option value="">{t("Todas as categorias")}</option>
          {categories.map((c) => <option key={c.id} value={c.slug}>{c.emoji} {c.name}</option>)}
        </select>
        <FSel v={get("status")} on={(x) => set({ status: x })} opts={[["", t("Status")], ["active", t("Ativos")], ["hidden", t("Ocultos")]]} />
        <FSel v={get("stock")} on={(x) => set({ stock: x })} opts={[["", t("Estoque")], ["in", t("Em estoque")], ["low", t("Estoque baixo")], ["out", t("Sem estoque")]]} />
        <FSel v={get("flag")} on={(x) => set({ flag: x })} opts={[["", t("Marcadores")], ["new", t("Novidades")], ["best", t("Mais vendidos")], ["featured", t("Destaque")], ["promo", t("Promoção")]]} />
        <FSel v={get("tier")} on={(x) => set({ tier: x })} opts={[["", t("Níveis de preço")], ["has10", t("Com preço 10+")], ["hasWholesale", t("Com preço atacado")]]} />
        <FSel v={get("missing")} on={(x) => set({ missing: x })} opts={[["", t("Faltando…")], ["image", t("Sem imagem")], ["price", t("Sem preço")], ["category", t("Sem categoria")], ["sku", t("Sem código")]]} />
        {activeFilters.length > 0 && <button onClick={() => setSp(new URLSearchParams(get("q") ? { q: get("q") } : {}), { replace: true })} className="rounded-full bg-brand-soft px-3 py-1.5 text-xs font-bold text-brand-dark">{t("Limpar filtros")} ✕</button>}
      </div>

      {selCount > 0 && (
        <BulkBar
          count={selCount} canSelectAll={pageAllSelected && !allMatching && total > sel.size} total={total}
          onSelectAll={() => setAllMatching(true)} onClear={clearSel} onExport={exportCsv}
          categories={categories} busy={bulkBusy} t={t}
          onApply={(action, params, confirmMsg) => bulk(action, params, confirmMsg)}
        />
      )}

      <div className="overflow-x-auto rounded-[16px] border border-line bg-surface">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b border-line bg-surface-2 text-left text-xs uppercase text-muted">
            <tr>
              <th className="w-8 p-3"><input type="checkbox" checked={pageAllSelected} onChange={togglePage} className="accent-brand" aria-label={t("Selecionar página")} /></th>
              <th className="p-3">{t("Produto")}</th><th className="p-3">{t("Categoria")}</th>
              <th className="p-3">{t("Normal")}</th><th className="p-3">{t("10+")}</th><th className="p-3">{t("Atacado")}</th>
              <th className="p-3">{t("Estoque")}</th><th className="p-3">{t("Marcadores")}</th><th className="p-3">{t("Editado")}</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="p-8 text-center text-muted">{t("Carregando…")}</td></tr>
            ) : data && data.items.length === 0 ? (
              <tr><td colSpan={10} className="p-8 text-center text-muted">{t("Nenhum produto encontrado")}</td></tr>
            ) : (data?.items ?? []).map((p) => {
              const out = p.stock <= 0, low = !out && p.stock <= p.lowStockAt;
              return (
                <tr key={p.id} className={`border-b border-line last:border-0 hover:bg-surface-2/50 ${allMatching || sel.has(p.id) ? "bg-brand-soft/40" : ""}`}>
                  <td className="p-3"><input type="checkbox" checked={allMatching || sel.has(p.id)} onChange={() => toggleOne(p.id)} className="accent-brand" aria-label={p.name} /></td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-line"><Thumb url={p.images[0]?.url} emojiSize="text-lg" /></div>
                      <div className="min-w-0"><div className="truncate font-semibold text-ink max-w-[220px]">{p.name}</div><div className="text-xs text-muted">{p.sku || t("sem código")}</div></div>
                    </div>
                  </td>
                  <td className="p-3 text-xs text-muted">{p.category?.name ?? "—"}{p.subcat ? <div className="text-[10px]">{p.subcat}</div> : null}</td>
                  <td className="p-3 font-bold tabular">{brl(p.priceCents)}</td>
                  <td className="p-3 text-xs tabular text-teal-dark">{p.price10Cents != null ? brl(p.price10Cents) : "—"}</td>
                  <td className="p-3 text-xs tabular text-grape">{p.wholesaleCents != null ? brl(p.wholesaleCents) : "—"}</td>
                  <td className="p-3"><span className={`font-bold ${out ? "text-danger" : low ? "text-warn" : "text-pix"}`}>{p.stock}</span></td>
                  <td className="p-3"><div className="flex flex-wrap gap-1">
                    {p.featured && <Tag>{t("destaque")}</Tag>}{p.isNew && <Tag>{t("novo")}</Tag>}{p.bestSeller && <Tag>{t("top")}</Tag>}{!p.active && <Tag tone="bg-danger/10 text-danger">{t("oculto")}</Tag>}
                  </div></td>
                  <td className="p-3 whitespace-nowrap text-xs text-muted">{new Date(p.updatedAt).toLocaleDateString(t("pt-BR"))}</td>
                  <td className="p-3"><div className="flex justify-end gap-1">
                    <Link to={`/admin/produtos/${p.id}?${query}`} className="rounded-lg border border-line px-2.5 py-1 text-xs font-semibold hover:bg-surface-2">{t("Editar")}</Link>
                    <button onClick={() => duplicate(p)} className="rounded-lg border border-line px-2.5 py-1 text-xs font-semibold hover:bg-surface-2">{t("Duplicar")}</button>
                    <button onClick={() => del(p)} className="rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-danger hover:bg-danger/5">{t("Excluir")}</button>
                  </div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      {pages > 1 && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 text-sm">
          <PgBtn disabled={page <= 1} onClick={() => set({ page: page - 1 })}>←</PgBtn>
          {pageList(page, pages).map((n, i) => n === "…" ? <span key={i} className="px-1 text-muted">…</span> : (
            <PgBtn key={i} active={n === page} onClick={() => set({ page: n })}>{n}</PgBtn>
          ))}
          <PgBtn disabled={page >= pages} onClick={() => set({ page: page + 1 })}>→</PgBtn>
          <span className="ml-2 text-xs text-muted">{t("Página {n} de {m}", { n: page, m: pages })}</span>
        </div>
      )}
    </div>
  );
}

function FSel({ v, on, opts }: { v: string; on: (x: string) => void; opts: [string, string][] }) {
  return (
    <select value={v} onChange={(e) => on(e.target.value)} className={`rounded-lg border px-2.5 py-1.5 ${v ? "border-brand bg-brand-soft font-bold text-brand-dark" : "border-line bg-surface"}`}>
      {opts.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
    </select>
  );
}
function PgBtn({ children, onClick, active, disabled }: { children: React.ReactNode; onClick: () => void; active?: boolean; disabled?: boolean }) {
  return <button disabled={disabled} onClick={onClick} className={`grid h-8 min-w-8 place-items-center rounded-lg px-2 text-sm font-bold disabled:opacity-40 ${active ? "bg-brand text-white" : "border border-line bg-surface hover:bg-surface-2"}`}>{children}</button>;
}
function pageList(cur: number, total: number): (number | "…")[] {
  const out: (number | "…")[] = [];
  const add = (n: number) => out.push(n);
  const window = 1;
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= cur - window && i <= cur + window)) add(i);
    else if (out[out.length - 1] !== "…") out.push("…");
  }
  return out;
}
function Tag({ children, tone = "bg-surface-2 text-muted" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tone}`}>{children}</span>;
}

type BulkCat = { id: number; slug: string; name: string; emoji: string };
function BulkBar({ count, canSelectAll, total, onSelectAll, onClear, onExport, categories, busy, t, onApply }: {
  count: number; canSelectAll: boolean; total: number; onSelectAll: () => void; onClear: () => void; onExport: () => void;
  categories: BulkCat[]; busy: boolean; t: (s: string, p?: Record<string, string | number>) => string;
  onApply: (action: string, params: Record<string, unknown>, confirmMsg?: string) => void;
}) {
  const [action, setAction] = useState("");
  const [val, setVal] = useState("");
  const needsCat = action === "categoria";
  const needsText = action === "subcat";
  const needsNum = ["estoque", "preco", "nivel2", "nivel3", "promo"].includes(action);
  const numHint = action === "preco" ? t("% (+aumenta / -diminui)") : action === "estoque" ? t("novo estoque") : t("% de desconto");

  function apply() {
    const M: Record<string, [string, Record<string, unknown>]> = {
      ativar: ["setFlags", { active: true }], ocultar: ["setFlags", { active: false }],
      destaque_on: ["setFlags", { featured: true }], destaque_off: ["setFlags", { featured: false }],
      novo_on: ["setFlags", { isNew: true }], novo_off: ["setFlags", { isNew: false }],
      top_on: ["setFlags", { bestSeller: true }], top_off: ["setFlags", { bestSeller: false }],
      categoria: ["setCategory", { categoryId: val || null }], subcat: ["setSubcat", { subcat: val }],
      estoque: ["setStock", { stock: Number(val) || 0 }], preco: ["adjustPrice", { percent: Number(val) || 0 }],
      nivel2: ["setTier2", { percent: Number(val) || 0 }], nivel3: ["setTier3", { percent: Number(val) || 0 }],
      promo: ["setPromo", { percent: Number(val) || 0 }], remover_promo: ["clearPromo", {}],
      duplicar: ["duplicate", {}], excluir: ["delete", {}],
    };
    const m = M[action];
    if (!m) return;
    if ((needsCat && !val) || (needsNum && val === "")) return;
    const confirmMsg = action === "excluir" ? t("Excluir {n} produtos? Esta ação não pode ser desfeita.")
      : action === "duplicar" ? t("Duplicar {n} produtos?") : undefined;
    onApply(m[0], m[1], confirmMsg);
    setAction(""); setVal("");
  }

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border-2 border-brand/40 bg-brand-soft/50 p-3 text-sm">
      <span className="font-extrabold text-brand-dark">{t("{n} selecionados", { n: count })}</span>
      {canSelectAll && <button onClick={onSelectAll} className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-brand-dark">{t("Selecionar todos os {n}", { n: total })}</button>}
      <button onClick={onClear} className="text-xs font-bold text-muted hover:text-ink">{t("Limpar")} ✕</button>
      <span className="mx-1 h-5 w-px bg-brand/20" />
      <select value={action} onChange={(e) => { setAction(e.target.value); setVal(""); }} className="rounded-lg border border-line bg-surface px-2.5 py-1.5 font-semibold">
        <option value="">{t("Ação em massa…")}</option>
        <optgroup label={t("Marcadores")}>
          <option value="ativar">{t("Ativar")}</option><option value="ocultar">{t("Ocultar")}</option>
          <option value="destaque_on">{t("Marcar destaque")}</option><option value="destaque_off">{t("Tirar destaque")}</option>
          <option value="novo_on">{t("Marcar novo")}</option><option value="novo_off">{t("Tirar novo")}</option>
          <option value="top_on">{t("Marcar mais vendido")}</option><option value="top_off">{t("Tirar mais vendido")}</option>
        </optgroup>
        <optgroup label={t("Organização")}>
          <option value="categoria">{t("Alterar categoria")}</option><option value="subcat">{t("Alterar subcategoria")}</option>
        </optgroup>
        <optgroup label={t("Estoque & preço")}>
          <option value="estoque">{t("Definir estoque")}</option><option value="preco">{t("Ajustar preço (%)")}</option>
          <option value="nivel2">{t("Preço 10+ (% desc.)")}</option><option value="nivel3">{t("Preço atacado (% desc.)")}</option>
          <option value="promo">{t("Aplicar promoção (%)")}</option><option value="remover_promo">{t("Remover promoção")}</option>
        </optgroup>
        <optgroup label={t("Outros")}>
          <option value="duplicar">{t("Duplicar")}</option><option value="excluir">{t("Excluir")}</option>
        </optgroup>
      </select>
      {needsCat && (
        <select value={val} onChange={(e) => setVal(e.target.value)} className="rounded-lg border border-line bg-surface px-2.5 py-1.5">
          <option value="">{t("Sem categoria")}</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
        </select>
      )}
      {needsText && <input value={val} onChange={(e) => setVal(e.target.value)} placeholder={t("Subcategoria")} className="rounded-lg border border-line bg-surface px-2.5 py-1.5" />}
      {needsNum && <input type="number" value={val} onChange={(e) => setVal(e.target.value)} placeholder={numHint} className="w-36 rounded-lg border border-line bg-surface px-2.5 py-1.5" />}
      {action && <button onClick={apply} disabled={busy} className="btn btn-primary px-4 py-1.5 text-xs disabled:opacity-60">{busy ? t("Aplicando…") : t("Aplicar")}</button>}
      <button onClick={onExport} className="btn btn-ghost ml-auto px-3 py-1.5 text-xs">⬇ {t("Exportar CSV")}</button>
    </div>
  );
}
