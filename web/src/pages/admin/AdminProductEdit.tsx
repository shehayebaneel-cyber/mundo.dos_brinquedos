import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import type { Category, Product } from "../../lib/types";
import { useI18n } from "../../lib/i18n";

type ImgRow = { url: string; alt: string };
type VarRow = { kind: string; label: string; swatch: string; stock: number; priceDeltaReais: number };

const reais = (cents: number | null | undefined) => (cents == null ? "" : (cents / 100).toFixed(2));
const cents = (v: string | number) => Math.round(Number(v || 0) * 100);

export function AdminProductEdit() {
  const { t } = useI18n();
  const { id } = useParams();
  const isNew = id === "novo" || !id;
  const nav = useNavigate();
  const [cats, setCats] = useState<Category[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const [f, setF] = useState({
    slug: "", name: "", brand: "", sku: "", description: "", categoryId: "",
    price: "", old: "", cost: "", price10: "", wholesale: "", pixPercent: "10",
    stock: "", lowStockAt: "5", minWholesaleQty: "0", packQty: "1", installmentsMax: "12",
    subcat: "", ageGroup: "", material: "", weightGrams: "", warranty: "",
    featured: false, isNew: false, bestSeller: false, wholesaleOnly: false, active: true,
  });
  const [images, setImages] = useState<ImgRow[]>([{ url: "🧸|#fff0f2", alt: "" }]);
  const [variants, setVariants] = useState<VarRow[]>([]);

  useEffect(() => {
    api.get<Category[]>("/api/categories").then(setCats).catch(() => {});
    if (isNew) return;
    api.aGet<Product>(`/api/admin/products/${id}`).then((p) => {
      setF({
        slug: p.slug, name: p.name, brand: p.brand, sku: p.sku, description: p.description, categoryId: String(p.categoryId ?? ""),
        price: reais(p.priceCents), old: reais(p.oldPriceCents), cost: reais(p.costCents), price10: reais(p.price10Cents), wholesale: reais(p.wholesaleCents), pixPercent: String(p.pixPercent),
        stock: String(p.stock), lowStockAt: String(p.lowStockAt), minWholesaleQty: String(p.minWholesaleQty), packQty: String(p.packQty), installmentsMax: String(p.installmentsMax),
        subcat: p.subcat, ageGroup: p.ageGroup, material: p.material, weightGrams: String(p.weightGrams), warranty: p.warranty,
        featured: p.featured, isNew: p.isNew, bestSeller: p.bestSeller, wholesaleOnly: p.wholesaleOnly, active: p.active,
      });
      setImages(p.images.length ? p.images.map((i) => ({ url: i.url, alt: i.alt })) : [{ url: "🧸|#fff0f2", alt: "" }]);
      setVariants(p.variants.map((v) => ({ kind: v.kind, label: v.label, swatch: v.swatch, stock: v.stock, priceDeltaReais: v.priceDeltaCents / 100 })));
    });
  }, [id]);

  const set = (k: string, v: string | boolean) => setF((cur) => ({ ...cur, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!f.name || !f.price) { setErr(t("Nome e preço são obrigatórios.")); return; }
    setBusy(true);
    const payload = {
      slug: f.slug || f.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      name: f.name, brand: f.brand, sku: f.sku, description: f.description, categoryId: f.categoryId || null,
      priceCents: cents(f.price), oldPriceCents: f.old ? cents(f.old) : null, costCents: cents(f.cost),
      price10Cents: f.price10 ? cents(f.price10) : null,
      wholesaleCents: f.wholesale ? cents(f.wholesale) : null, pixPercent: Number(f.pixPercent),
      stock: Number(f.stock), lowStockAt: Number(f.lowStockAt), minWholesaleQty: Number(f.minWholesaleQty),
      packQty: Number(f.packQty), installmentsMax: Number(f.installmentsMax),
      subcat: f.subcat, ageGroup: f.ageGroup, material: f.material, weightGrams: Number(f.weightGrams), warranty: f.warranty,
      featured: f.featured, isNew: f.isNew, bestSeller: f.bestSeller, wholesaleOnly: f.wholesaleOnly, active: f.active,
      images: images.filter((i) => i.url.trim()),
      variants: variants.map((v) => ({ kind: v.kind, label: v.label, swatch: v.swatch, stock: Number(v.stock), priceDeltaCents: cents(v.priceDeltaReais) })),
    };
    try {
      if (isNew) await api.aPost("/api/admin/products", payload);
      else await api.aPatch(`/api/admin/products/${id}`, payload);
      nav("/admin/produtos");
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("Erro ao salvar."));
    } finally {
      setBusy(false);
    }
  }

  const input = "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand";
  const lbl = "mb-1 block text-xs font-bold text-muted";
  const F = ({ k, label, ph, type = "text" }: { k: keyof typeof f; label: string; ph?: string; type?: string }) => (
    <div><label className={lbl}>{label}</label><input type={type} value={f[k] as string} onChange={(e) => set(k, e.target.value)} placeholder={ph} className={input} /></div>
  );

  return (
    <form onSubmit={save} className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center gap-2">
        <button type="button" onClick={() => nav("/admin/produtos")} className="text-muted">←</button>
        <h1 className="font-display text-2xl font-extrabold text-ink">{isNew ? t("Novo produto") : t("Editar produto")}</h1>
      </div>

      <div className="space-y-4">
        <section className="rounded-[16px] border border-line bg-surface p-4">
          <h2 className="mb-3 font-display font-bold text-ink">{t("Informações básicas")}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">{F({ k: "name", label: t("Nome *") })}</div>
            <F k="brand" label={t("Marca")} />
            <F k="sku" label={t("SKU / código")} />
            <div>
              <label className={lbl}>{t("Categoria")}</label>
              <select value={f.categoryId} onChange={(e) => set("categoryId", e.target.value)} className={input}>
                <option value="">{t("Sem categoria")}</option>
                {cats.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
              </select>
            </div>
            <F k="slug" label={t("URL (slug)")} ph={t("gerado do nome")} />
            <div className="sm:col-span-2"><label className={lbl}>{t("Descrição")}</label><textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={4} className={input} /></div>
          </div>
        </section>

        <section className="rounded-[16px] border border-line bg-surface p-4">
          <h2 className="mb-1 font-display font-bold text-ink">{t("Preços por nível (R$)")}</h2>
          <p className="mb-3 text-xs text-muted">{t("O preço muda conforme o carrinho do cliente. Deixe em branco os níveis que não se aplicam.")}</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-sky/5 p-2"><F k="price" label={t("1 · Preço normal *")} type="number" /><p className="mt-1 px-1 text-[10px] text-muted">{t("menos de 10 itens")}</p></div>
            <div className="rounded-xl bg-teal/5 p-2"><F k="price10" label={t("2 · Preço 10+ itens")} type="number" /><p className="mt-1 px-1 text-[10px] text-muted">{t("carrinho com 10+ itens")}</p></div>
            <div className="rounded-xl bg-grape/5 p-2"><F k="wholesale" label={t("3 · Preço atacado")} type="number" /><p className="mt-1 px-1 text-[10px] text-muted">{t("carrinho no valor de atacado")}</p></div>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            <F k="old" label={t("Preço antigo (de/por)")} type="number" />
            <F k="cost" label={t("Custo")} type="number" />
            <F k="pixPercent" label={t("Desconto Pix (%)")} type="number" />
            <F k="installmentsMax" label={t("Parcelas máx.")} type="number" />
          </div>
        </section>

        <section className="rounded-[16px] border border-line bg-surface p-4">
          <h2 className="mb-3 font-display font-bold text-ink">{t("Estoque & atacado")}</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <F k="stock" label={t("Quantidade em estoque")} type="number" />
            <F k="lowStockAt" label={t("Alerta estoque baixo")} type="number" />
            <F k="minWholesaleQty" label={t("Qtd. mínima atacado")} type="number" />
            <F k="packQty" label={t("Unidades por caixa")} type="number" />
            <F k="weightGrams" label={t("Peso (gramas)")} type="number" />
          </div>
        </section>

        <section className="rounded-[16px] border border-line bg-surface p-4">
          <h2 className="mb-3 font-display font-bold text-ink">{t("Ficha técnica")}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <F k="subcat" label={t("Subcategoria")} ph={t("ex.: Motos, Quebra-cabeças")} />
            <F k="ageGroup" label={t("Idade recomendada")} ph="3+" />
            <F k="material" label={t("Material")} />
            <F k="warranty" label={t("Garantia")} />
          </div>
        </section>

        {/* IMAGES */}
        <section className="rounded-[16px] border border-line bg-surface p-4">
          <h2 className="mb-1 font-display font-bold text-ink">{t("Imagens")}</h2>
          <p className="mb-3 text-xs text-muted">{t("No protótipo use")} <code className="rounded bg-surface-2 px-1">emoji|#cor</code> {t("(ex.:")} <code className="rounded bg-surface-2 px-1">🚗|#e6f2ff</code>{t("). Depois cole a URL da foto real.")}</p>
          <div className="space-y-2">
            {images.map((im, i) => (
              <div key={i} className="flex gap-2">
                <input value={im.url} onChange={(e) => setImages((cur) => cur.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} placeholder={t("🧸|#fff0f2 ou https://…")} className={input} />
                <input value={im.alt} onChange={(e) => setImages((cur) => cur.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))} placeholder={t("descrição")} className={`${input} max-w-[40%]`} />
                <button type="button" onClick={() => setImages((cur) => cur.filter((_, j) => j !== i))} className="px-2 text-danger">✕</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setImages((cur) => [...cur, { url: "", alt: "" }])} className="btn btn-ghost mt-2 px-3 py-1.5 text-sm">{t("+ Adicionar imagem")}</button>
        </section>

        {/* VARIANTS */}
        <section className="rounded-[16px] border border-line bg-surface p-4">
          <h2 className="mb-3 font-display font-bold text-ink">{t("Variações (cor / tamanho)")}</h2>
          <div className="space-y-2">
            {variants.map((v, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto_1fr_auto] items-center gap-2">
                <select value={v.kind} onChange={(e) => setVariants((c) => c.map((x, j) => (j === i ? { ...x, kind: e.target.value } : x)))} className={input}><option value="cor">{t("cor")}</option><option value="tamanho">{t("tamanho")}</option></select>
                <input value={v.label} onChange={(e) => setVariants((c) => c.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} placeholder={t("Rosa / Aro 16")} className={input} />
                <input type="color" value={v.swatch || "#ffffff"} onChange={(e) => setVariants((c) => c.map((x, j) => (j === i ? { ...x, swatch: e.target.value } : x)))} className="h-9 w-9 rounded border border-line" />
                <input type="number" value={v.stock} onChange={(e) => setVariants((c) => c.map((x, j) => (j === i ? { ...x, stock: Number(e.target.value) } : x)))} placeholder={t("estoque")} className={input} />
                <button type="button" onClick={() => setVariants((c) => c.filter((_, j) => j !== i))} className="px-2 text-danger">✕</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setVariants((c) => [...c, { kind: "cor", label: "", swatch: "#ff7ba8", stock: 0, priceDeltaReais: 0 }])} className="btn btn-ghost mt-2 px-3 py-1.5 text-sm">{t("+ Adicionar variação")}</button>
        </section>

        {/* FLAGS */}
        <section className="rounded-[16px] border border-line bg-surface p-4">
          <h2 className="mb-3 font-display font-bold text-ink">{t("Marcadores")}</h2>
          <div className="flex flex-wrap gap-4 text-sm">
            {([["featured", "Destaque"], ["isNew", "Novidade"], ["bestSeller", "Mais vendido"], ["wholesaleOnly", "Só atacado"], ["active", "Visível na loja"]] as const).map(([k, label]) => (
              <label key={k} className="flex items-center gap-2"><input type="checkbox" checked={f[k] as boolean} onChange={(e) => set(k, e.target.checked)} className="accent-brand" /> {t(label)}</label>
            ))}
          </div>
        </section>

        {err && <p className="text-sm font-semibold text-danger">{err}</p>}
        <div className="sticky bottom-0 flex gap-2 border-t border-line bg-cream py-3">
          <button disabled={busy} className="btn btn-primary flex-1 py-3 disabled:opacity-60">{busy ? t("Salvando…") : t("Salvar produto")}</button>
          <button type="button" onClick={() => nav("/admin/produtos")} className="btn btn-ghost px-5 py-3">{t("Cancelar")}</button>
        </div>
      </div>
    </form>
  );
}
