import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { brl } from "../../lib/money";
import type { Product } from "../../lib/types";
import { Thumb } from "../../components/Thumb";
import { useI18n } from "../../lib/i18n";

export function AdminProducts() {
  const { t } = useI18n();
  const [items, setItems] = useState<Product[] | null>(null);
  const [q, setQ] = useState("");

  const load = () => api.aGet<Product[]>("/api/admin/products").then(setItems).catch(() => setItems([]));
  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => (items ?? []).filter((p) => (p.name + p.brand + p.sku).toLowerCase().includes(q.toLowerCase())),
    [items, q],
  );

  async function del(p: Product) {
    if (!confirm(t('Excluir "{name}"? Esta ação não pode ser desfeita.', { name: p.name }))) return;
    await api.aDel(`/api/admin/products/${p.id}`);
    load();
  }
  async function duplicate(p: Product) {
    const full = await api.aGet<Product>(`/api/admin/products/${p.id}`);
    await api.aPost("/api/admin/products", {
      ...full, slug: `${full.slug}-copia-${Date.now().toString().slice(-4)}`, name: `${full.name} (cópia)`,
      images: full.images.map((i) => ({ url: i.url, alt: i.alt })), variants: full.variants,
    });
    load();
  }

  if (!items) return <p className="text-muted">{t("Carregando…")}</p>;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="font-display text-2xl font-extrabold text-ink">{t("Produtos")} <span className="text-muted">({items.length})</span></h1>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Buscar…")} className="ml-auto rounded-full border border-line bg-surface px-4 py-2 text-sm" />
        <Link to="/admin/produtos/novo" className="btn btn-primary px-4 py-2 text-sm">{t("+ Novo produto")}</Link>
      </div>

      <div className="overflow-x-auto rounded-[16px] border border-line bg-surface">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-line bg-surface-2 text-left text-xs uppercase text-muted">
            <tr><th className="p-3">{t("Produto")}</th><th className="p-3">{t("Preço")}</th><th className="p-3">{t("Estoque")}</th><th className="p-3">{t("Marcadores")}</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const out = p.stock <= 0, low = !out && p.stock <= p.lowStockAt;
              return (
                <tr key={p.id} className="border-b border-line last:border-0">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-line"><Thumb url={p.images[0]?.url} emojiSize="text-lg" /></div>
                      <div><div className="font-semibold text-ink">{p.name}</div><div className="text-xs text-muted">{p.brand} · {p.sku}</div></div>
                    </div>
                  </td>
                  <td className="p-3 tabular"><div className="font-bold">{brl(p.priceCents)}</div>{p.wholesaleCents && <div className="text-xs text-grape">{t("ata: {v}", { v: brl(p.wholesaleCents) })}</div>}</td>
                  <td className="p-3"><span className={`font-bold ${out ? "text-danger" : low ? "text-warn" : "text-pix"}`}>{p.stock}</span></td>
                  <td className="p-3"><div className="flex flex-wrap gap-1">
                    {p.featured && <Tag>{t("destaque")}</Tag>}{p.isNew && <Tag>{t("novo")}</Tag>}{p.bestSeller && <Tag>{t("top")}</Tag>}{!p.active && <Tag tone="bg-danger/10 text-danger">{t("oculto")}</Tag>}
                  </div></td>
                  <td className="p-3"><div className="flex justify-end gap-1">
                    <Link to={`/admin/produtos/${p.id}`} className="rounded-lg border border-line px-2.5 py-1 text-xs font-semibold hover:bg-surface-2">{t("Editar")}</Link>
                    <button onClick={() => duplicate(p)} className="rounded-lg border border-line px-2.5 py-1 text-xs font-semibold hover:bg-surface-2">{t("Duplicar")}</button>
                    <button onClick={() => del(p)} className="rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-danger hover:bg-danger/5">{t("Excluir")}</button>
                  </div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Tag({ children, tone = "bg-surface-2 text-muted" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tone}`}>{children}</span>;
}
