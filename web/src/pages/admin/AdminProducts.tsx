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
  const [importing, setImporting] = useState(false);

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

  async function quickSave(id: number, patch: Record<string, unknown>) {
    const updated = await api.aPatch<Product>(`/api/admin/products/${id}/quick`, patch);
    setData((d) => (d ? { ...d, items: d.items.map((p) => (p.id === id ? updated : p)) } : d));
  }

  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const activeFilters = (["category", "subcat", "brand", "status", "stock", "flag", "tier", "missing", "priceMin", "priceMax"] as const).filter((k) => sp.get(k));

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h1 className="font-display text-2xl font-extrabold text-ink">{t("Produtos")} <span className="text-muted">({total})</span></h1>
        <button onClick={() => setImporting(true)} className="btn btn-ghost ml-auto px-4 py-2 text-sm">⬆ {t("Importar CSV")}</button>
        <Link to="/admin/produtos/novo" className="btn btn-primary px-4 py-2 text-sm">{t("+ Novo produto")}</Link>
      </div>
      {importing && <ImportPanel onClose={() => setImporting(false)} onDone={reload} t={t} />}

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
                  <td className="p-3 text-xs">
                    <select value={p.categoryId ?? ""} onChange={(e) => quickSave(p.id, { categoryId: e.target.value })} className="max-w-[130px] rounded border border-line bg-surface px-1 py-0.5 text-xs">
                      <option value="">—</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {p.subcat ? <div className="mt-0.5 text-[10px] text-muted">{p.subcat}</div> : null}
                  </td>
                  <td className="p-3"><NumCell value={p.priceCents} cents onSave={(v) => quickSave(p.id, { priceCents: v ?? 0 })} className="font-bold text-ink" /></td>
                  <td className="p-3"><NumCell value={p.price10Cents} cents nullable onSave={(v) => quickSave(p.id, { price10Cents: v })} className="text-teal-dark" /></td>
                  <td className="p-3"><NumCell value={p.wholesaleCents} cents nullable onSave={(v) => quickSave(p.id, { wholesaleCents: v })} className="text-grape" /></td>
                  <td className="p-3"><NumCell value={p.stock} onSave={(v) => quickSave(p.id, { stock: v ?? 0 })} className={`font-bold ${out ? "text-danger" : low ? "text-warn" : "text-pix"}`} /></td>
                  <td className="p-3"><div className="flex flex-wrap gap-1">
                    <FlagChip on={p.isNew} label={t("novo")} onClick={() => quickSave(p.id, { isNew: !p.isNew })} />
                    <FlagChip on={p.featured} label={t("destaque")} onClick={() => quickSave(p.id, { featured: !p.featured })} />
                    <FlagChip on={p.bestSeller} label={t("top")} onClick={() => quickSave(p.id, { bestSeller: !p.bestSeller })} />
                    <FlagChip on={!p.active} label={t("oculto")} danger onClick={() => quickSave(p.id, { active: !p.active })} />
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
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = []; let field = "", row: string[] = [], inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) { if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; } else field += c; }
    else if (c === '"') inQ = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; if (field !== "" || row.length) { row.push(field); rows.push(row); row = []; field = ""; } }
    else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  const header = (rows.shift() ?? []).map((h) => h.replace(/^﻿/, "").trim().toLowerCase());
  return rows.filter((r) => r.some((x) => x.trim())).map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? "").trim()])));
}

type Review = { summary: { create: number; update: number; duplicate: number; error: number }; results: { row: number; action: string; name: string; msg?: string }[]; total: number };

function ImportPanel({ onClose, onDone, t }: { onClose: () => void; onDone: () => void; t: (s: string, p?: Record<string, string | number>) => string }) {
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [review, setReview] = useState<Review | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Review | null>(null);
  const [fileName, setFileName] = useState("");

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = async () => {
      const parsed = parseCsv(String(reader.result));
      setRows(parsed); setDone(null); setReview(null);
      if (parsed.length) { setBusy(true); try { setReview(await api.aPost<Review>("/api/admin/products/import", { rows: parsed, dry: true })); } finally { setBusy(false); } }
    };
    reader.readAsText(file);
  }
  async function apply() {
    setBusy(true);
    try { const r = await api.aPost<Review>("/api/admin/products/import", { rows, dry: false }); setDone(r); onDone(); } finally { setBusy(false); }
  }
  const tone: Record<string, string> = { create: "text-pix", update: "text-sky", duplicate: "text-warn", error: "text-danger" };
  const label: Record<string, string> = { create: t("Criar"), update: t("Atualizar"), duplicate: t("Duplicado"), error: t("Erro") };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-surface p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-extrabold text-ink">⬆ {t("Importar produtos (CSV)")}</h2>
          <button onClick={onClose} className="text-xl">✕</button>
        </div>
        <p className="mt-1 text-sm text-muted">{t("Use o mesmo formato do arquivo exportado. Colunas: nome, codigo, categoria, subcategoria, preco, preco10, atacado, estoque, ativo, novo, destaque, top, imagem.")}</p>

        <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand bg-brand-soft/30 p-6 text-sm font-bold text-brand-dark">
          <input type="file" accept=".csv,text/csv" onChange={onFile} className="hidden" />
          📄 {fileName || t("Escolher arquivo CSV")}
        </label>

        {busy && !done && <p className="mt-3 text-center text-sm text-muted">{t("Analisando…")}</p>}

        {review && !done && (
          <div className="mt-4">
            <div className="flex flex-wrap gap-2 text-sm font-bold">
              <span className="rounded-full bg-pix/10 px-3 py-1 text-pix">{t("Criar")}: {review.summary.create}</span>
              <span className="rounded-full bg-sky/10 px-3 py-1 text-sky">{t("Atualizar")}: {review.summary.update}</span>
              <span className="rounded-full bg-warn/10 px-3 py-1 text-warn">{t("Duplicados")}: {review.summary.duplicate}</span>
              <span className="rounded-full bg-danger/10 px-3 py-1 text-danger">{t("Erros")}: {review.summary.error}</span>
            </div>
            <div className="mt-3 max-h-56 overflow-y-auto rounded-xl border border-line text-sm">
              {review.results.slice(0, 200).map((r) => (
                <div key={r.row} className="flex items-center gap-2 border-b border-line px-3 py-1.5 last:border-0">
                  <span className={`w-16 shrink-0 text-xs font-bold ${tone[r.action]}`}>{label[r.action]}</span>
                  <span className="truncate text-ink">{r.name || `linha ${r.row}`}</span>
                  {r.msg && <span className="ml-auto shrink-0 text-xs text-muted">{r.msg}</span>}
                </div>
              ))}
            </div>
            <button onClick={apply} disabled={busy} className="btn btn-primary mt-4 w-full py-3 disabled:opacity-60">
              {busy ? t("Importando…") : t("Confirmar importação ({n} itens)", { n: review.summary.create + review.summary.update })}
            </button>
          </div>
        )}

        {done && (
          <div className="mt-4 rounded-xl bg-pix/10 p-4 text-center">
            <p className="font-bold text-pix">✓ {t("Importação concluída!")}</p>
            <p className="mt-1 text-sm text-ink">{t("{c} criados · {u} atualizados · {d} ignorados", { c: done.summary.create, u: done.summary.update, d: done.summary.duplicate })}</p>
            <button onClick={onClose} className="btn btn-ghost mt-3 px-5 py-2">{t("Fechar")}</button>
          </div>
        )}
      </div>
    </div>
  );
}

function NumCell({ value, cents, nullable, onSave, className = "" }: { value: number | null; cents?: boolean; nullable?: boolean; onSave: (v: number | null) => void; className?: string }) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState("");
  const disp = value == null ? "—" : cents ? brl(value) : String(value);
  if (editing) {
    const commit = () => {
      setEditing(false);
      const raw = v.trim();
      if (raw === "" && value == null) return;
      const parsed = raw === "" ? (nullable ? null : 0) : cents ? Math.round(Number(raw.replace(",", ".")) * 100) : Math.round(Number(raw));
      if (parsed !== value) onSave(parsed);
    };
    return <input autoFocus type="number" step={cents ? "0.01" : "1"} value={v} onChange={(e) => setV(e.target.value)} onBlur={commit} onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEditing(false); }} className="w-20 rounded border border-brand px-1 py-0.5 text-sm tabular outline-none" />;
  }
  return <button onClick={() => { setV(value == null ? "" : cents ? (value / 100).toFixed(2) : String(value)); setEditing(true); }} className={`rounded px-1 tabular hover:bg-brand-soft/60 ${className}`} title="Editar">{disp}</button>;
}
function FlagChip({ on, label, danger, onClick }: { on: boolean; label: string; danger?: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={`rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors ${on ? (danger ? "bg-danger/10 text-danger" : "bg-brand text-white") : "bg-surface-2 text-muted hover:bg-surface-2/60 hover:text-ink"}`}>{label}</button>;
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
