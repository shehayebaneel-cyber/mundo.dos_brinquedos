import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useStore, waLink } from "../lib/store";
import { useI18n } from "../lib/i18n";
import type { Banner, Product } from "../lib/types";
import { brl } from "../lib/money";
import { grad, ProductRow, SectionHead, Spinner } from "../components/ui";

type Sections = { best: Product[]; ofertas: Product[]; novidades: Product[]; destaque: Product[] };

export function Home() {
  const { categories, settings } = useStore();
  const { t, tf } = useI18n();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [s, setS] = useState<Sections | null>(null);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    api.get<Banner[]>("/api/banners").then(setBanners).catch(() => {});
    const q = (flag: string) => api.get<{ items: Product[] }>(`/api/products?flag=${flag}&pageSize=10`).then((r) => r.items);
    Promise.all([q("mais-vendidos"), q("ofertas"), q("novidades"), q("destaque")])
      .then(([best, ofertas, novidades, destaque]) => setS({ best, ofertas, novidades, destaque }))
      .catch(() => setS({ best: [], ofertas: [], novidades: [], destaque: [] }));
  }, []);

  const hero = banners[0];
  const wholesaleMin = Number(settings.wholesaleMinOrderCents ?? 30000);

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-4">
      {/* HERO */}
      {hero && (
        <section className={`relative overflow-hidden rounded-[16px] bg-gradient-to-br ${grad[hero.bg] ?? grad.brand} p-6 text-white shadow-[var(--shadow-pop)] sm:p-10`}>
          <span className="pointer-events-none absolute -right-4 -bottom-6 text-[120px] opacity-30 sm:text-[180px]">{hero.emoji}</span>
          <div className="relative max-w-lg">
            {hero.badge && <span className="inline-block rounded-full bg-pix px-3 py-1 text-xs font-extrabold">{tf(hero, "badge")}</span>}
            <h1 className="mt-3 text-3xl font-extrabold sm:text-5xl">{tf(hero, "title")}</h1>
            {hero.subtitle && <p className="mt-2 font-body text-white/95 sm:text-lg">{tf(hero, "subtitle")}</p>}
            <div className="mt-5 flex flex-wrap gap-2">
              {hero.ctaLabel && <Link to={hero.ctaHref || "/produtos"} className="btn bg-white px-5 py-2.5 text-brand-dark">{tf(hero, "ctaLabel")}</Link>}
              {hero.cta2Label && <Link to={hero.cta2Href || "/ofertas"} className="btn border border-white/60 bg-white/20 px-5 py-2.5 text-white">{tf(hero, "cta2Label")}</Link>}
            </div>
          </div>
        </section>
      )}

      {/* TRUST */}
      <section className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {[
          ["🚚", "Entrega para todo o Brasil"],
          ["🔒", "Pagamento seguro"],
          ["🏷️", "Atacado e varejo"],
          ["💬", "Atendimento no WhatsApp"],
          ["⭐", "Produtos selecionados"],
        ].map(([i, key]) => (
          <div key={key} className="flex min-w-[130px] flex-1 items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5 text-xs font-semibold text-ink">
            <span className="text-lg">{i}</span>
            {t(key)}
          </div>
        ))}
      </section>

      {/* CATEGORIES */}
      <section>
        <SectionHead title={t("Categorias")} to="/produtos" />
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3 lg:grid-cols-8">
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/categoria/${c.slug}`}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface p-3 text-center transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-[var(--shadow-card)]"
            >
              <span className="grid h-14 w-14 place-items-center rounded-full text-2xl transition-transform group-hover:scale-110" style={{ background: `color-mix(in srgb, var(--color-${c.accent}) 16%, white)` }}>
                {c.emoji}
              </span>
              <span className="line-clamp-2 min-h-[2.4em] text-[11px] font-bold leading-tight text-ink sm:text-xs">{tf(c, "name")}</span>
            </Link>
          ))}
        </div>
      </section>

      {!s ? (
        <Spinner label={t("Carregando a lojinha…")} />
      ) : (
        <>
          <section><SectionHead title={t("Mais vendidos")} emoji="🔥" to="/produtos?flag=mais-vendidos" /><ProductRow items={s.best} /></section>

          {s.ofertas.length > 0 && (
            <section className="rounded-[16px] bg-brand-soft/60 p-4">
              <SectionHead title={t("Ofertas do dia")} emoji="⏰" to="/ofertas" />
              <ProductRow items={s.ofertas} />
            </section>
          )}

          <section><SectionHead title={t("Novidades")} emoji="✨" to="/produtos?flag=novidades" /><ProductRow items={s.novidades} /></section>

          {/* WHOLESALE */}
          <section className="overflow-hidden rounded-[16px] bg-gradient-to-br from-ink to-grape p-6 text-white sm:p-8">
            <h2 className="font-display text-2xl font-extrabold">{t("🧸📦 Compre no atacado")}</h2>
            <p className="mt-1 max-w-lg text-white/85">{t("Preços especiais para lojistas e revendedores. Pedido mínimo de {min} · entrega para todo o Brasil.", { min: brl(wholesaleMin) })}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/atacado" className="btn bg-sun px-5 py-2.5 text-ink">{t("Criar conta atacado")}</Link>
              <a href={waLink(settings.whatsapp ?? "", "Olá! Tenho interesse em comprar no atacado.")} target="_blank" rel="noreferrer" className="btn bg-[#25d366] px-5 py-2.5 text-white">{t("💬 Falar com o atacado")}</a>
            </div>
          </section>

          <section><SectionHead title={t("Em destaque")} emoji="⭐" to="/produtos?flag=destaque" /><ProductRow items={s.destaque} /></section>
        </>
      )}

      {/* NEWSLETTER */}
      <section className="rounded-[16px] border border-dashed border-brand bg-surface p-6 text-center">
        <h2 className="font-display text-xl font-extrabold text-ink">{t("Receba ofertas e cupons 🎉")}</h2>
        <p className="mt-1 text-sm text-muted">{t("Novidades, promoções e descontos no seu e-mail ou WhatsApp.")}</p>
        {subscribed ? (
          <p className="mt-3 font-bold text-pix">{t("Prontinho! Você vai receber nossas novidades. 💌")}</p>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); if (email.trim()) setSubscribed(true); }} className="mx-auto mt-3 flex max-w-md gap-2">
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("Seu e-mail ou WhatsApp")} className="flex-1 rounded-full border border-line bg-surface-2 px-4 py-2.5 text-sm outline-none" />
            <button className="btn btn-primary px-5 py-2.5">{t("Quero!")}</button>
          </form>
        )}
      </section>
    </div>
  );
}
