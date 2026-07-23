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
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setData(null);
    setImgIdx(0);
    setPicked({});
    setQty(1);
    api.get<{ product: P; related: P[] }>(`/api/products/${slug}`).then(setData).catch(() => setData(null));
  }, [slug]);

  useEffect(() => { const pp = data?.product; if (pp?.boxOnly && pp.packQty > 1) setQty(pp.packQty); }, [data]);

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
  const qtyStep = p.boxOnly && p.packQty > 1 ? p.packQty : 1;

  const avg = p.reviews && p.reviews.length ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length : 0;

  function doAdd(buyNow = false, qtyOverride?: number) {
    if (out || missingVariant) return;
    cart.add(
      {
        productId: p.id, slug: p.slug, name, image: p.images[0]?.url ?? "", variant: variantLabel, stock: p.stock,
        regularCents: p.priceCents + deltaCents,
        price10Cents: p.price10Cents != null ? p.price10Cents + deltaCents : null,
        wholesaleCents: p.wholesaleCents != null ? p.wholesaleCents + deltaCents : null,
        boxUnits: p.packQty, boxPriceCents: p.boxPriceCents, boxActive: p.boxActive, boxOnly: p.boxOnly,
      },
      qtyOverride ?? qty,
    );
    if (buyNow) nav("/carrinho");
    else {
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
    }
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
          <div className="relative aspect-square overflow-hidden rounded-[22px] border-2 border-line bg-white p-3">
            <span className="absolute inset-x-0 top-0 z-10 h-1.5" style={{ background: `var(--color-${p.category?.accent ?? "brand"})` }} />
            <Thumb url={p.images[imgIdx]?.url} alt={name} emojiSize="text-[120px]" fit="contain" className="rounded-2xl" />
            {off > 0 && <span className="absolute left-3 top-4 z-10 rounded-full bg-brand px-2.5 py-1 text-sm font-extrabold text-white">-{off}%</span>}
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
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
            {avg > 0 && <><Stars value={avg} /><span className="text-muted">({p.reviews?.length})</span></>}
            {p.ageGroup && <span className="rounded-full bg-teal/15 px-2.5 py-0.5 text-xs font-extrabold text-teal-dark">{p.ageGroup}</span>}
            <span className="text-muted">· SKU {p.sku || "—"}</span>
          </div>

          <div className="mt-4">
            {p.oldPriceCents && <span className="mr-2 text-muted line-through tabular">{brl(p.oldPriceCents)}</span>}
            <span className="font-display text-4xl font-extrabold text-brand tabular">{brl(priceCents)}</span>
            {priceCents >= 3000 && <div className="mt-1 text-sm text-muted tabular">{t("em até {n}x de {each} sem juros", { n: inst.n, each: brl(inst.eachCents) })}</div>}
            <div className="mt-1 text-sm font-bold text-pix tabular">{t("💠 {v} no Pix ({pct}% de desconto)", { v: brl(pixCents(priceCents, p.pixPercent)), pct: p.pixPercent })}</div>
            {(p.price10Cents || p.wholesaleCents) && (
              <div className="mt-3 rounded-xl border border-line bg-surface-2 p-3">
                <p className="text-xs font-extrabold uppercase tracking-wide text-muted">{t("Preços por volume no carrinho")}</p>
                <ul className="mt-1.5 space-y-1 text-sm">
                  {p.price10Cents != null && (
                    <li className="flex items-center justify-between gap-2"><span>📦 {t("Carrinho com 10+ itens")}</span><b className="text-teal-dark tabular">{brl(p.price10Cents + deltaCents)}</b></li>
                  )}
                  {p.wholesaleCents != null && (
                    <li className="flex items-center justify-between gap-2"><span>🏆 {t("Carrinho no valor de atacado")}</span><b className="text-grape tabular">{brl(p.wholesaleCents + deltaCents)}</b></li>
                  )}
                </ul>
                <p className="mt-1.5 text-[11px] text-muted">{t("Vale para o carrinho todo, misturando qualquer produto.")}</p>
              </div>
            )}

            {p.boxActive && p.packQty > 1 && p.boxPriceCents != null && (
              <div className="mt-3 rounded-xl border-2 border-grape/40 bg-grape/5 p-3">
                <p className="text-xs font-extrabold uppercase tracking-wide text-grape">📦 {t("Caixa fechada")}</p>
                <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
                  <span className="font-display text-2xl font-extrabold tabular text-grape">{brl(p.boxPriceCents)}</span>
                  <span className="text-sm text-muted">{t("por caixa de {n} unidades", { n: p.packQty })}</span>
                  <span className="text-xs text-muted">({brl(Math.round(p.boxPriceCents / p.packQty))} {t("cada")})</span>
                </div>
                {p.packQty * priceCents - p.boxPriceCents > 0 && (
                  <p className="mt-0.5 text-xs font-bold text-pix">{t("Economize {v} por caixa", { v: brl(p.packQty * priceCents - p.boxPriceCents) })}</p>
                )}
                <button type="button" onClick={() => doAdd(false, p.packQty)} disabled={out || missingVariant} className="btn mt-2 w-full bg-grape py-2.5 text-white disabled:opacity-50">📦 {t("Comprar caixa completa")}</button>
                {qty > 0 && qty % p.packQty !== 0 && (
                  <p className="mt-1.5 text-[11px] text-muted">{t("Faltam {n} unidades para completar uma caixa.", { n: p.packQty - (qty % p.packQty) })}</p>
                )}
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
                <button onClick={() => setQty((q) => Math.max(qtyStep, q - qtyStep))} className="px-3 py-1.5 text-lg">−</button>
                <span className="min-w-8 text-center font-bold tabular">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(p.stock, q + qtyStep))} className="px-3 py-1.5 text-lg">+</button>
              </div>
            )}
            {p.boxOnly && p.packQty > 1 && <span className="text-xs font-semibold text-grape">📦 {t("vendido em caixas de {n}", { n: p.packQty })}</span>}
          </div>

          {/* CTAs (desktop) */}
          <div className="mt-4 hidden gap-2 md:flex">
            <button onClick={() => doAdd(false)} disabled={out || missingVariant} className="btn btn-ghost flex-1 py-3 disabled:opacity-50">{added ? t("✓ Adicionado!") : t("Adicionar ao carrinho")}</button>
            <button onClick={() => doAdd(true)} disabled={out || missingVariant} className="btn btn-primary flex-1 py-3 disabled:opacity-50">{t("Comprar agora")}</button>
            <button onClick={() => wish.toggle(p.id)} aria-label={t("Favoritos")} className="btn btn-ghost px-4 py-3">{wish.has(p.id) ? "♥" : "♡"}</button>
          </div>
          {missingVariant && <p className="mt-1.5 text-xs font-semibold text-warn">{t("Selecione as opções acima para continuar.")}</p>}

          <a href={waLink(settings.whatsapp ?? "", `${name} (${brl(priceCents)})`)} target="_blank" rel="noreferrer" className="btn mt-2 w-full border border-[#25d366] py-2.5 text-[#128c4a]">{t("💬 Tirar dúvida no WhatsApp")}</a>

          {/* HOW ORDERING WORKS */}
          <div className="mt-4 rounded-[16px] border border-line bg-surface p-4 text-sm text-muted">
            <p className="font-bold text-ink">{t("Como comprar")}</p>
            <p className="mt-1">{t("Adicione ao carrinho e envie o pedido com seu nome e WhatsApp. A gente entra em contato para combinar o pagamento e a retirada ou entrega.")}</p>
          </div>
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
