import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { useCart } from "../lib/cart";
import { useWishlist } from "../lib/wishlist";
import { useStore, waLink } from "../lib/store";
import { useI18n } from "../lib/i18n";
import type { Product as P, Review } from "../lib/types";
import { brl, discountPct, installment, pixCents } from "../lib/money";
import { Thumb } from "../components/Thumb";
import { Stars } from "../components/Stars";
import { ProductRow, SectionHead, Spinner } from "../components/ui";

export function Product() {
  const { slug } = useParams();
  const nav = useNavigate();
  const cart = useCart();
  const wish = useWishlist();
  const { settings } = useStore();
  const { t, tf } = useI18n();

  const [data, setData] = useState<{ product: P; related: P[] } | null>(null);
  const [imgIdx, setImgIdx] = useState(0);
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);
  const [cep, setCep] = useState("");
  const [ship, setShip] = useState<{ label: string; price: string; days: string }[] | null>(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setData(null);
    setImgIdx(0);
    setPicked({});
    setQty(1);
    api.get<{ product: P; related: P[] }>(`/api/products/${slug}`).then(setData).catch(() => setData(null));
  }, [slug]);

  const kinds = useMemo(() => {
    const p = data?.product;
    if (!p) return {} as Record<string, P["variants"]>;
    return p.variants.reduce((acc, v) => {
      (acc[v.kind] ??= []).push(v);
      return acc;
    }, {} as Record<string, P["variants"]>);
  }, [data]);

  if (data === null) return <div className="mx-auto max-w-6xl px-4"><Spinner label={t("Carregando produto…")} /></div>;
  const p = data.product;

  const deltaCents = Object.entries(picked).reduce((s, [kind, label]) => {
    const v = kinds[kind]?.find((x) => x.label === label);
    return s + (v?.priceDeltaCents ?? 0);
  }, 0);
  const priceCents = p.priceCents + deltaCents;
  const off = discountPct(p.oldPriceCents, p.priceCents);
  const inst = installment(priceCents, p.installmentsMax);
  const out = p.stock <= 0;
  const low = !out && p.stock <= p.lowStockAt;
  const missingVariant = Object.keys(kinds).some((k) => !picked[k]);
  const variantLabel = Object.values(picked).join(" · ");
  const name = tf(p, "name");

  const avg = p.reviews && p.reviews.length ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length : 0;

  function doAdd(buyNow = false) {
    if (out || missingVariant) return;
    cart.add(
      { productId: p.id, slug: p.slug, name, priceCents, image: p.images[0]?.url ?? "", variant: variantLabel, stock: p.stock },
      qty,
    );
    if (buyNow) nav("/carrinho");
    else {
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
    }
  }

  function calcShip(e: React.FormEvent) {
    e.preventDefault();
    const free = Number(settings.freeShippingMinCents ?? 19900);
    const opts = [
      { label: "PAC (Correios)", price: brl(2490), days: "5 a 9 dias úteis" },
      { label: "SEDEX (Correios)", price: brl(3990), days: "2 a 4 dias úteis" },
    ];
    if (priceCents * qty >= free) opts.unshift({ label: "Frete grátis", price: brl(0), days: "5 a 9 dias úteis" });
    setShip(opts);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 pb-28 md:pb-5">
      <nav className="mb-3 text-xs text-muted">
        <Link to="/" className="hover:text-brand-dark">{t("Início")}</Link> ›{" "}
        {p.category && <><Link to={`/categoria/${p.category.slug}`} className="hover:text-brand-dark">{tf(p.category, "name")}</Link> › </>}
        <span className="text-ink">{name}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* GALLERY */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-[16px] border border-line bg-surface">
            <Thumb url={p.images[imgIdx]?.url} alt={name} emojiSize="text-[120px]" />
            {off > 0 && <span className="absolute left-3 top-3 rounded-full bg-brand px-2.5 py-1 text-sm font-extrabold text-white">-{off}%</span>}
          </div>
          {p.images.length > 1 && (
            <div className="mt-2 flex gap-2">
              {p.images.map((im, i) => (
                <button key={im.id} onClick={() => setImgIdx(i)} className={`h-16 w-16 overflow-hidden rounded-xl border-2 ${i === imgIdx ? "border-brand" : "border-line"}`}>
                  <Thumb url={im.url} alt={im.alt} emojiSize="text-2xl" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* BUY BOX */}
        <div>
          {p.brand && <span className="text-xs font-bold uppercase tracking-wide text-muted">{p.brand}</span>}
          <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">{name}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm">
            {avg > 0 && <><Stars value={avg} /><span className="text-muted">({p.reviews?.length})</span></>}
            <span className="text-muted">· SKU {p.sku || "—"}</span>
          </div>

          <div className="mt-4">
            {p.oldPriceCents && <span className="mr-2 text-muted line-through tabular">{brl(p.oldPriceCents)}</span>}
            <span className="font-display text-3xl font-extrabold text-ink tabular">{brl(priceCents)}</span>
            <div className="mt-1 text-sm text-muted tabular">{t("em até {n}x de {each} sem juros", { n: inst.n, each: brl(inst.eachCents) })}</div>
            <div className="text-sm font-bold text-pix tabular">{t("💠 {v} no Pix ({pct}% de desconto)", { v: brl(pixCents(priceCents, p.pixPercent)), pct: p.pixPercent })}</div>
            {p.wholesaleCents && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-grape/10 px-3 py-1.5 text-sm font-bold text-grape">
                {t("📦 Atacado: {v}", { v: brl(p.wholesaleCents) })} <span className="font-normal text-muted">{t("(mín. {n} un.)", { n: p.minWholesaleQty })}</span>
              </div>
            )}
          </div>

          {/* VARIANTS */}
          {Object.entries(kinds).map(([kind, vs]) => (
            <div key={kind} className="mt-4">
              <p className="mb-1.5 text-sm font-bold capitalize text-ink">{t(kind)}: <span className="font-normal text-muted">{picked[kind] ? t(picked[kind]) : t("selecione")}</span></p>
              <div className="flex flex-wrap gap-2">
                {vs.map((v) => {
                  const on = picked[kind] === v.label;
                  const dis = v.stock <= 0;
                  return (
                    <button key={v.id} disabled={dis} onClick={() => setPicked((cur) => ({ ...cur, [kind]: v.label }))}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold disabled:opacity-40 ${on ? "border-brand bg-brand text-white" : "border-line bg-surface text-ink"}`}>
                      {v.swatch && <span className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ background: v.swatch }} />}
                      {t(v.label)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* STOCK + QTY */}
          <div className="mt-4 flex items-center gap-4">
            <span className={`text-sm font-bold ${out ? "text-danger" : low ? "text-warn" : "text-pix"}`}>
              {out ? `● ${t("Esgotado")}` : low ? `● ${t("Últimas {n} unidades", { n: p.stock })}` : `● ${t("Em estoque")}`}
            </span>
            {!out && (
              <div className="flex items-center rounded-full border border-line">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-1.5 text-lg">−</button>
                <span className="min-w-8 text-center font-bold tabular">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(p.stock, q + 1))} className="px-3 py-1.5 text-lg">+</button>
              </div>
            )}
          </div>

          {/* CTAs (desktop) */}
          <div className="mt-4 hidden gap-2 md:flex">
            <button onClick={() => doAdd(false)} disabled={out || missingVariant} className="btn btn-ghost flex-1 py-3 disabled:opacity-50">{added ? t("✓ Adicionado!") : t("Adicionar ao carrinho")}</button>
            <button onClick={() => doAdd(true)} disabled={out || missingVariant} className="btn btn-primary flex-1 py-3 disabled:opacity-50">{t("Comprar agora")}</button>
            <button onClick={() => wish.toggle(p.id)} aria-label={t("Favoritos")} className="btn btn-ghost px-4 py-3">{wish.has(p.id) ? "♥" : "♡"}</button>
          </div>
          {missingVariant && <p className="mt-1.5 text-xs font-semibold text-warn">{t("Selecione as opções acima para continuar.")}</p>}

          <a href={waLink(settings.whatsapp ?? "", `${name} (${brl(priceCents)})`)} target="_blank" rel="noreferrer" className="btn mt-2 w-full border border-[#25d366] py-2.5 text-[#128c4a]">{t("💬 Tirar dúvida no WhatsApp")}</a>

          {/* SHIPPING */}
          <form onSubmit={calcShip} className="mt-4 rounded-[16px] border border-line bg-surface p-4">
            <p className="text-sm font-bold text-ink">{t("🚚 Calcular frete e prazo")}</p>
            <div className="mt-2 flex gap-2">
              <input value={cep} onChange={(e) => setCep(e.target.value)} placeholder={t("Digite seu CEP")} className="flex-1 rounded-lg border border-line px-3 py-2 text-sm" />
              <button className="btn btn-ghost px-4 py-2 text-sm">{t("Calcular")}</button>
            </div>
            {ship && (
              <ul className="mt-3 space-y-1.5 text-sm">
                {ship.map((o) => (
                  <li key={o.label} className="flex justify-between"><span>{t(o.label)} <span className="text-muted">· {t(o.days)}</span></span><span className="font-bold tabular">{o.price}</span></li>
                ))}
                <li className="pt-1 text-xs text-muted">{t("Retirada grátis na loja em Goiânia disponível.")}</li>
              </ul>
            )}
          </form>
        </div>
      </div>

      {/* DESCRIPTION + INFO */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-[16px] border border-line bg-surface p-5">
          <h2 className="font-display text-lg font-extrabold text-ink">{t("Descrição")}</h2>
          <p className="mt-2 whitespace-pre-line leading-relaxed text-ink/90">{tf(p, "description")}</p>
        </section>
        <section className="rounded-[16px] border border-line bg-surface p-5">
          <h2 className="font-display text-lg font-extrabold text-ink">{t("Informações do produto")}</h2>
          <dl className="mt-2 divide-y divide-line text-sm">
            {[
              [t("Marca"), p.brand],
              [t("Idade recomendada"), t(p.ageGroup)],
              [t("Material"), t(p.material)],
              [t("Peso"), p.weightGrams ? `${(p.weightGrams / 1000).toFixed(2)} kg` : ""],
              [t("Garantia"), t(p.warranty)],
              [t("Código (SKU)"), p.sku],
            ].filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-1.5"><dt className="text-muted">{k}</dt><dd className="text-right font-semibold text-ink">{v}</dd></div>
            ))}
          </dl>
        </section>
      </div>

      {/* REVIEWS */}
      <ReviewsBlock product={p} />

      {/* RELATED */}
      {data.related.length > 0 && (
        <section className="mt-10">
          <SectionHead title={t("Você também pode gostar")} emoji="🧡" />
          <ProductRow items={data.related} />
        </section>
      )}

      {/* STICKY MOBILE CTA */}
      {!out && (
        <div className="fixed inset-x-0 bottom-[57px] z-20 flex items-center gap-2 border-t border-line bg-surface/95 p-2.5 backdrop-blur md:hidden">
          <div className="pl-1">
            <div className="text-[11px] text-muted">{qty}x</div>
            <div className="font-display text-lg font-extrabold leading-none text-ink tabular">{brl(priceCents * qty)}</div>
          </div>
          <button onClick={() => doAdd(true)} disabled={missingVariant} className="btn btn-primary ml-auto flex-1 py-3 disabled:opacity-50">{missingVariant ? t("Escolha as opções") : t("Comprar agora")}</button>
          <button onClick={() => doAdd(false)} disabled={missingVariant} className="btn btn-ghost px-4 py-3 disabled:opacity-50" aria-label={t("Adicionar ao carrinho")}>🛒</button>
        </div>
      )}
    </div>
  );
}

function ReviewsBlock({ product }: { product: P }) {
  const { t } = useI18n();
  const [reviews] = useState<Review[]>(product.reviews ?? []);
  const [form, setForm] = useState({ author: "", rating: 5, comment: "" });
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.author.trim()) return;
    setBusy(true);
    try {
      await api.post("/api/reviews", { productId: product.id, ...form });
      setSent(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8 rounded-[16px] border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-lg font-extrabold text-ink">{t("Avaliações")}</h2>
        {avg > 0 && <div className="flex items-center gap-1.5"><Stars value={avg} /><span className="font-bold text-ink">{avg.toFixed(1)}</span><span className="text-sm text-muted">({reviews.length})</span></div>}
      </div>

      <div className="mt-4 space-y-3">
        {reviews.length === 0 && <p className="text-sm text-muted">{t("Ainda não há avaliações. Seja o primeiro!")}</p>}
        {reviews.map((r) => (
          <div key={r.id} className="border-b border-line pb-3 last:border-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-ink">{r.author}</span>
              {r.verified && <span className="rounded-full bg-pix/10 px-2 py-0.5 text-[10px] font-bold text-pix">{t("✓ Compra verificada")}</span>}
            </div>
            <Stars value={r.rating} size="text-xs" />
            <p className="mt-1 text-sm text-ink/90">{r.comment}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 border-t border-line pt-4">
        <h3 className="font-display font-bold text-ink">{t("Avaliar este produto")}</h3>
        {sent ? (
          <p className="mt-2 font-semibold text-pix">{t("Obrigado! Sua avaliação será publicada após aprovação. 💛")}</p>
        ) : (
          <form onSubmit={submit} className="mt-2 space-y-2">
            <div className="flex items-center gap-1 text-2xl">
              {[1, 2, 3, 4, 5].map((n) => (
                <button type="button" key={n} onClick={() => setForm((f) => ({ ...f, rating: n }))} className={n <= form.rating ? "text-sun" : "text-line"}>★</button>
              ))}
            </div>
            <input value={form.author} onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))} placeholder={t("Seu nome")} className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
            <textarea value={form.comment} onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))} rows={3} placeholder={t("Conte o que achou do produto")} className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
            <button disabled={busy} className="btn btn-primary px-5 py-2.5 disabled:opacity-60">{busy ? t("Enviando…") : t("Enviar avaliação")}</button>
          </form>
        )}
      </div>
    </section>
  );
}
