import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import type { Category, Product } from "../../lib/types";

type ImgRow = { url: string; alt: string };
type VarRow = { kind: string; label: string; swatch: string; stock: number; priceDeltaReais: number };

const reais = (cents: number | null | undefined) => (cents == null ? "" : (cents / 100).toFixed(2));
const cents = (v: string | number) => Math.round(Number(v || 0) * 100);

export function AdminProductEdit() {
  const { id } = useParams();
  const isNew = id === "novo" || !id;
  const nav = useNavigate();
  const [cats, setCats] = useState<Category[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const [f, setF] = useState({
    slug: "", name: "", brand: "", sku: "", description: "", categoryId: "",
    price: "", old: "", cost: "", wholesale: "", pixPercent: "10",
    stock: "", lowStockAt: "5", minWholesaleQty: "0", packQty: "1", installmentsMax: "12",
    ageGroup: "", material: "", weightGrams: "", warranty: "",
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
        price: reais(p.priceCents), old: reais(p.oldPriceCents), cost: reais(p.costCents), wholesale: reais(p.wholesaleCents), pixPercent: String(p.pixPercent),
        stock: String(p.stock), lowStockAt: String(p.lowStockAt), minWholesaleQty: String(p.minWholesaleQty), packQty: String(p.packQty), installmentsMax: String(p.installmentsMax),
        ageGroup: p.ageGroup, material: p.material, weightGrams: String(p.weightGrams), warranty: p.warranty,
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
    if (!f.name || !f.price) { setErr("Nome e preço são obrigatórios."); return; }
    setBusy(true);
    const payload = {
      slug: f.slug || f.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      name: f.name, brand: f.brand, sku: f.sku, description: f.description, categoryId: f.categoryId || null,
      priceCents: cents(f.price), oldPriceCents: f.old ? cents(f.old) : null, costCents: cents(f.cost),
      wholesaleCents: f.wholesale ? cents(f.wholesale) : null, pixPercent: Number(f.pixPercent),
      stock: Number(f.stock), lowStockAt: Number(f.lowStockAt), minWholesaleQty: Number(f.minWholesaleQty),
      packQty: Number(f.packQty), installmentsMax: Number(f.installmentsMax),
      ageGroup: f.ageGroup, material: f.material, weightGrams: Number(f.weightGrams), warranty: f.warranty,
      featured: f.featured, isNew: f.isNew, bestSeller: f.bestSeller, wholesaleOnly: f.wholesaleOnly, active: f.active,
      images: images.filter((i) => i.url.trim()),
      variants: variants.map((v) => ({ kind: v.kind, label: v.label, swatch: v.swatch, stock: Number(v.stock), priceDeltaCents: cents(v.priceDeltaReais) })),
    };
    try {
      if (isNew) await api.aPost("/api/admin/products", payload);
      else await api.aPatch(`/api/admin/products/${id}`, payload);
      nav("/admin/produtos");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao salvar.");
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
        <h1 className="font-display text-2xl font-extrabold text-ink">{isNew ? "Novo produto" : "Editar produto"}</h1>
      </div>

      <div className="space-y-4">
        <section className="rounded-[16px] border border-line bg-surface p-4">
          <h2 className="mb-3 font-display font-bold text-ink">Informações básicas</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">{F({ k: "name", label: "Nome *" })}</div>
            <F k="brand" label="Marca" />
            <F k="sku" label="SKU / código" />
            <div>
              <label className={lbl}>Categoria</label>
              <select value={f.categoryId} onChange={(e) => set("categoryId", e.target.value)} className={input}>
                <option value="">Sem categoria</option>
                {cats.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
              </select>
            </div>
            <F k="slug" label="URL (slug)" ph="gerado do nome" />
            <div className="sm:col-span-2"><label className={lbl}>Descrição</label><textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={4} className={input} /></div>
          </div>
        </section>

        <section className="rounded-[16px] border border-line bg-surface p-4">
          <h2 className="mb-3 font-display font-bold text-ink">Preços (R$)</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <F k="price" label="Preço de venda *" type="number" />
            <F k="old" label="Preço antigo (de/por)" type="number" />
            <F k="cost" label="Custo" type="number" />
            <F k="wholesale" label="Preço atacado" type="number" />
            <F k="pixPercent" label="Desconto Pix (%)" type="number" />
            <F k="installmentsMax" label="Parcelas máx." type="number" />
          </div>
        </section>

        <section className="rounded-[16px] border border-line bg-surface p-4">
          <h2 className="mb-3 font-display font-bold text-ink">Estoque & atacado</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <F k="stock" label="Quantidade em estoque" type="number" />
            <F k="lowStockAt" label="Alerta estoque baixo" type="number" />
            <F k="minWholesaleQty" label="Qtd. mínima atacado" type="number" />
            <F k="packQty" label="Unidades por caixa" type="number" />
            <F k="weightGrams" label="Peso (gramas)" type="number" />
          </div>
        </section>

        <section className="rounded-[16px] border border-line bg-surface p-4">
          <h2 className="mb-3 font-display font-bold text-ink">Ficha técnica</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <F k="ageGroup" label="Idade recomendada" ph="3+" />
            <F k="material" label="Material" />
            <F k="warranty" label="Garantia" />
          </div>
        </section>

        {/* IMAGES */}
        <section className="rounded-[16px] border border-line bg-surface p-4">
          <h2 className="mb-1 font-display font-bold text-ink">Imagens</h2>
          <p className="mb-3 text-xs text-muted">No protótipo use <code className="rounded bg-surface-2 px-1">emoji|#cor</code> (ex.: <code className="rounded bg-surface-2 px-1">🚗|#e6f2ff</code>). Depois cole a URL da foto real.</p>
          <div className="space-y-2">
            {images.map((im, i) => (
              <div key={i} className="flex gap-2">
                <input value={im.url} onChange={(e) => setImages((cur) => cur.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} placeholder="🧸|#fff0f2 ou https://…" className={input} />
                <input value={im.alt} onChange={(e) => setImages((cur) => cur.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))} placeholder="descrição" className={`${input} max-w-[40%]`} />
                <button type="button" onClick={() => setImages((cur) => cur.filter((_, j) => j !== i))} className="px-2 text-danger">✕</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setImages((cur) => [...cur, { url: "", alt: "" }])} className="btn btn-ghost mt-2 px-3 py-1.5 text-sm">+ Adicionar imagem</button>
        </section>

        {/* VARIANTS */}
        <section className="rounded-[16px] border border-line bg-surface p-4">
          <h2 className="mb-3 font-display font-bold text-ink">Variações (cor / tamanho)</h2>
          <div className="space-y-2">
            {variants.map((v, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto_1fr_auto] items-center gap-2">
                <select value={v.kind} onChange={(e) => setVariants((c) => c.map((x, j) => (j === i ? { ...x, kind: e.target.value } : x)))} className={input}><option value="cor">cor</option><option value="tamanho">tamanho</option></select>
                <input value={v.label} onChange={(e) => setVariants((c) => c.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} placeholder="Rosa / Aro 16" className={input} />
                <input type="color" value={v.swatch || "#ffffff"} onChange={(e) => setVariants((c) => c.map((x, j) => (j === i ? { ...x, swatch: e.target.value } : x)))} className="h-9 w-9 rounded border border-line" />
                <input type="number" value={v.stock} onChange={(e) => setVariants((c) => c.map((x, j) => (j === i ? { ...x, stock: Number(e.target.value) } : x)))} placeholder="estoque" className={input} />
                <button type="button" onClick={() => setVariants((c) => c.filter((_, j) => j !== i))} className="px-2 text-danger">✕</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setVariants((c) => [...c, { kind: "cor", label: "", swatch: "#ff7ba8", stock: 0, priceDeltaReais: 0 }])} className="btn btn-ghost mt-2 px-3 py-1.5 text-sm">+ Adicionar variação</button>
        </section>

        {/* FLAGS */}
        <section className="rounded-[16px] border border-line bg-surface p-4">
          <h2 className="mb-3 font-display font-bold text-ink">Marcadores</h2>
          <div className="flex flex-wrap gap-4 text-sm">
            {([["featured", "Destaque"], ["isNew", "Novidade"], ["bestSeller", "Mais vendido"], ["wholesaleOnly", "Só atacado"], ["active", "Visível na loja"]] as const).map(([k, label]) => (
              <label key={k} className="flex items-center gap-2"><input type="checkbox" checked={f[k] as boolean} onChange={(e) => set(k, e.target.checked)} className="accent-brand" /> {label}</label>
            ))}
          </div>
        </section>

        {err && <p className="text-sm font-semibold text-danger">{err}</p>}
        <div className="sticky bottom-0 flex gap-2 border-t border-line bg-cream py-3">
          <button disabled={busy} className="btn btn-primary flex-1 py-3 disabled:opacity-60">{busy ? "Salvando…" : "Salvar produto"}</button>
          <button type="button" onClick={() => nav("/admin/produtos")} className="btn btn-ghost px-5 py-3">Cancelar</button>
        </div>
      </div>
    </form>
  );
}
