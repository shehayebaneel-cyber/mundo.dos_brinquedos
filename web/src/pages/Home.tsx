import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useStore, waLink } from "../lib/store";
import { useI18n } from "../lib/i18n";
import type { Product } from "../lib/types";
import { brl } from "../lib/money";
import { ProductRow, SectionHead, Spinner } from "../components/ui";
import { BlobFace, DashLoop, Squiggle, Star, Wave } from "../components/Doodles";

export function Home() {
  const { categories, settings } = useStore();
  const { t, tf } = useI18n();
  const [all, setAll] = useState<Product[] | null>(null);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    api.get<{ items: Product[] }>("/api/products?pageSize=100")
      .then((r) => setAll(r.items))
      .catch(() => setAll([]));
  }, []);

  const wholesaleMin = Number(settings.wholesaleMinOrderCents ?? 30000);
  const list = all ?? [];
  const novidades = list.filter((p) => p.isNew).slice(0, 12);
  const best = list.slice().sort((a, b) => Number(b.bestSeller) - Number(a.bestSeller)).slice(0, 12);
  const ofertas = list.filter((p) => p.oldPriceCents).slice(0, 12);

  return (
    <div className="space-y-12 pb-6">
      {/* ======================= HERO ======================= */}
      <section className="relative overflow-hidden bg-blue text-white">
        <span className="dots pointer-events-none absolute inset-0 text-white/15" aria-hidden />
        <Star className="absolute left-[6%] top-8 h-8 w-8 text-yellow" />
        <Star className="absolute right-[42%] top-6 h-5 w-5 text-white/70" />
        <Squiggle className="absolute left-[30%] bottom-24 h-6 w-28 text-white/40" />
        <BlobFace className="absolute -left-8 bottom-[-10px] h-28 w-28 text-teal opacity-90" />
        <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 py-6 sm:py-8 lg:grid-cols-2">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-yellow px-3 py-1 text-xs font-extrabold text-ink">🎉 {settings.tagline || "Varejo e atacado · entrega para todo o Brasil"}</span>
            <h1 className="mt-3 font-display text-3xl font-extrabold leading-[1.05] sm:text-5xl">
              O mundo da diversão começa <span className="text-yellow">aqui!</span>
            </h1>
            <p className="mt-2.5 max-w-md text-sm text-white/90 sm:text-base">
              Carros de ferro, educativos, garrafas e muito mais — <b>varejo e atacado</b>, entrega para todo o Brasil. 🚚
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/produtos" className="btn bg-white px-5 py-2.5 text-blue-dark hover:bg-white/90">🛍️ {t("Ver produtos")}</Link>
              <Link to="/ofertas" className="btn bg-brand px-5 py-2.5 text-white hover:bg-brand-dark">🏷️ {t("Ofertas")}</Link>
              <Link to="/atacado" className="btn border-2 border-white/70 px-5 py-2.5 text-white hover:bg-white/10">📦 {t("Atacado")}</Link>
            </div>
          </div>
          {/* brand mascot composition */}
          <div className="relative z-10 hidden lg:block">
            <div className="relative mx-auto aspect-square max-w-[440px]">
              {/* spotlight halo for depth */}
              <div className="absolute inset-6 rounded-full bg-[radial-gradient(circle_at_50%_38%,rgba(255,255,255,0.30),rgba(255,255,255,0.05)_62%,transparent_74%)]" />
              <BlobFace className="absolute left-0 top-6 h-16 w-16 text-yellow drop-shadow" />
              <BlobFace className="absolute -right-1 bottom-14 h-14 w-14 text-brand drop-shadow" />
              <Star className="absolute right-12 top-0 h-9 w-9 text-yellow" />
              <Star className="absolute left-16 bottom-6 h-5 w-5 text-white/70" />
              <DashLoop className="absolute right-2 top-20 h-16 w-20 text-white/40" />
              {/* ground shadow (synced with bounce) */}
              <div className="animate-mascot-shadow absolute bottom-4 left-1/2 z-0 h-4 w-44 rounded-[50%] bg-[#081633] blur-md" />
              {/* mascot */}
              <img src="/mascot.png" alt="Mundo dos Brinquedos" className="animate-mascot relative z-10 mx-auto h-full w-auto object-contain" />
              <span className="absolute left-1 top-24 z-20 grid h-12 w-12 place-items-center rounded-2xl bg-white text-2xl shadow-play">🧸</span>
              <span className="absolute right-0 top-8 z-20 grid h-12 w-12 place-items-center rounded-2xl bg-white text-2xl shadow-play">🎈</span>
              <span className="absolute bottom-2 left-16 z-20 grid h-12 w-12 place-items-center rounded-2xl bg-white text-2xl shadow-play">🎨</span>
            </div>
          </div>
        </div>
        <Wave className="block h-6 w-full text-cream sm:h-9" />
      </section>

      <div className="mx-auto max-w-6xl space-y-12 px-4">
        {/* ======================= TRUST ======================= */}
        <section className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {[
            ["🚚", "Entrega para todo o Brasil", "sky"],
            ["🔒", "Pagamento seguro", "mint"],
            ["🏷️", "Atacado e varejo", "orange"],
            ["💬", "Atendimento no WhatsApp", "teal"],
          ].map(([i, key, ac]) => (
            <div key={key} className="flex min-w-[150px] flex-1 items-center gap-2 rounded-2xl border-2 px-3 py-2.5 text-xs font-bold text-ink" style={{ borderColor: `color-mix(in srgb, var(--color-${ac}) 30%, white)`, background: `color-mix(in srgb, var(--color-${ac}) 8%, white)` }}>
              <span className="text-lg">{i}</span>
              {t(key)}
            </div>
          ))}
        </section>

        {/* ======================= CATEGORIES (badges) ======================= */}
        <section>
          <SectionHead title={t("Categorias")} to="/produtos" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((c, i) => (
              <Link
                key={c.id}
                to={`/categoria/${c.slug}`}
                className="group relative flex flex-col items-center gap-2 overflow-hidden rounded-[26px] border-2 p-4 text-center transition-transform hover:-translate-y-1"
                style={{ background: `color-mix(in srgb, var(--color-${c.accent}) 12%, white)`, borderColor: `color-mix(in srgb, var(--color-${c.accent}) 30%, white)` }}
              >
                <DashLoop className="pointer-events-none absolute -right-3 -top-3 h-16 w-16 opacity-20" color={`var(--color-${c.accent})`} />
                <span className={`grid h-16 w-16 place-items-center text-3xl text-white blob-${(i % 3) + 1}`} style={{ background: `var(--color-${c.accent})` }}>{c.emoji}</span>
                <span className="font-display text-sm font-extrabold leading-tight text-ink">{tf(c, "name")}</span>
                <span className="text-[11px] font-bold text-muted">{c._count?.products ?? 0} {t("produtos")}</span>
              </Link>
            ))}
          </div>
        </section>

        {!all ? (
          <Spinner label={t("Carregando a lojinha…")} />
        ) : (
          <>
            {/* ======================= OFFERS BAND ======================= */}
            <section className="relative overflow-hidden rounded-[30px] bg-orange p-6 text-white sm:p-8">
              <span className="dots pointer-events-none absolute inset-0 text-white/20" aria-hidden />
              <Star className="absolute right-6 top-5 h-7 w-7 text-yellow" />
              <Squiggle className="absolute right-24 bottom-6 hidden h-6 w-28 text-white/40 sm:block" />
              <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Tudo até R$6! 🤑</h2>
                  <p className="mt-1 max-w-md text-white/90">Slime, bolhas de sabão, cartas, brinquedos de água e muito mais — preços que cabem no bolso.</p>
                  <Link to="/ofertas" className="btn mt-4 bg-white px-6 py-3 text-orange-dark hover:bg-white/90">Ver todas as ofertas →</Link>
                </div>
                <div className="flex gap-3">
                  {ofertas.slice(0, 3).map((p) => (
                    <Link key={p.id} to={`/produto/${p.slug}`} className="w-24 shrink-0 overflow-hidden rounded-2xl bg-white p-1.5 sm:w-28">
                      <img src={p.images[0]?.url} alt={p.name} className="aspect-square w-full rounded-xl object-contain" />
                      <div className="px-1 pt-1 text-center font-display text-base font-extrabold text-brand">{brl(p.priceCents)}</div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>

            {/* ======================= NEW ARRIVALS ======================= */}
            {novidades.length > 0 && (
              <section><SectionHead title={t("Novidades")} emoji="✨" to="/produtos?flag=novidades" /><ProductRow items={novidades} /></section>
            )}

            {/* ======================= BEST SELLERS ======================= */}
            <section><SectionHead title={t("Mais vendidos")} emoji="🔥" to="/produtos?flag=mais-vendidos" /><ProductRow items={best} /></section>

            {/* ======================= WHOLESALE ======================= */}
            <section className="relative overflow-hidden rounded-[30px] bg-grape p-6 text-white sm:p-9">
              <BlobFace className="absolute -right-6 -bottom-8 h-40 w-40 text-blue opacity-80" />
              <div className="relative max-w-lg">
                <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-extrabold">📦 {t("Atacado")}</span>
                <h2 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">{t("🧸📦 Compre no atacado")}</h2>
                <p className="mt-2 text-white/90">{t("Preços especiais para lojistas e revendedores. Pedido mínimo de {min} · entrega para todo o Brasil.", { min: brl(wholesaleMin) })}</p>
                <div className="mt-5 flex flex-wrap gap-2.5">
                  <Link to="/atacado" className="btn bg-yellow px-6 py-3 text-ink hover:brightness-95">{t("Criar conta atacado")}</Link>
                  <a href={waLink(settings.whatsapp ?? "", "Olá! Tenho interesse em comprar no atacado.")} target="_blank" rel="noreferrer" className="btn bg-[#25d366] px-6 py-3 text-white">{t("💬 Falar com o atacado")}</a>
                </div>
              </div>
            </section>

            {/* ======================= DELIVERY + STORE INFO ======================= */}
            <section className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[26px] border-2 border-line bg-surface p-6">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sky/15 text-2xl">🚚</span>
                <h3 className="mt-3 font-display text-xl font-extrabold text-ink">{t("Entrega para todo o Brasil")}</h3>
                <p className="mt-1 text-sm text-muted">Enviamos para todo o país. Retirada grátis na loja em Goiânia. Frete grátis acima de {brl(Number(settings.freeShippingMinCents ?? 19900))}.</p>
                <Link to="/produtos" className="mt-3 inline-block font-bold text-brand-dark">Começar a comprar →</Link>
              </div>
              <div className="rounded-[26px] border-2 border-line bg-surface p-6">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-mint/15 text-2xl">📍</span>
                <h3 className="mt-3 font-display text-xl font-extrabold text-ink">{settings.storeName ?? "Mundo dos Brinquedos e Variedades"}</h3>
                <p className="mt-1 text-sm text-muted">{settings.address ?? "Goiânia - GO"} · {settings.hours ?? "Seg a Sáb, 08:00–18:00"}</p>
                <a href={waLink(settings.whatsapp ?? "", "Olá! Tenho uma dúvida.")} target="_blank" rel="noreferrer" className="btn mt-3 bg-[#25d366] px-5 py-2.5 text-sm text-white">💬 {settings.whatsappLabel ?? "WhatsApp"}</a>
              </div>
            </section>

            {/* ======================= NEWSLETTER ======================= */}
            <section className="relative overflow-hidden rounded-[26px] border-2 border-dashed border-brand bg-brand-soft/40 p-6 text-center">
              <h2 className="font-display text-xl font-extrabold text-ink">{t("Receba ofertas e cupons 🎉")}</h2>
              <p className="mt-1 text-sm text-muted">{t("Novidades, promoções e descontos no seu e-mail ou WhatsApp.")}</p>
              {subscribed ? (
                <p className="mt-3 font-bold text-pix">{t("Prontinho! Você vai receber nossas novidades. 💌")}</p>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); if (email.trim()) setSubscribed(true); }} className="mx-auto mt-3 flex max-w-md gap-2">
                  <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("Seu e-mail ou WhatsApp")} className="flex-1 rounded-full border-2 border-line bg-surface px-4 py-2.5 text-sm outline-none" />
                  <button className="btn btn-primary px-5 py-2.5">{t("Quero!")}</button>
                </form>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
