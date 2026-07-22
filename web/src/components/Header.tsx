import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../lib/cart";
import { useWishlist } from "../lib/wishlist";
import { useStore, waLink } from "../lib/store";
import { useI18n } from "../lib/i18n";
import type { Category } from "../lib/types";

export function Header() {
  const cart = useCart();
  const wish = useWishlist();
  const { categories, settings } = useStore();
  const { t, tf } = useI18n();
  const nav = useNavigate();
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState("");

  function search(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    nav(`/busca?q=${encodeURIComponent(q)}`);
    setMenu(false);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
      {/* top row */}
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2.5 sm:gap-4 sm:px-4">
        <button className="grid h-9 w-9 place-items-center rounded-lg text-xl md:hidden" onClick={() => setMenu(true)} aria-label={t("Abrir menu")}>
          ☰
        </button>
        <Link to="/" className="shrink-0 font-display text-xl font-extrabold tracking-tight text-brand-dark sm:text-2xl">
          Mundo
          <span className="ml-1 hidden align-middle text-[10px] font-semibold text-muted sm:inline">dos Brinquedos</span>
        </Link>

        <form onSubmit={search} className="ml-2 hidden flex-1 items-center gap-2 rounded-full bg-surface-2 px-4 py-2 md:flex">
          <span className="text-muted">🔍</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Buscar brinquedos, bonecas, bicicletas…")} className="w-full bg-transparent text-sm outline-none placeholder:text-muted" />
        </form>

        <nav className="ml-auto flex items-center gap-2 text-sm sm:gap-3">
          <LangToggle />
          <a href={waLink(settings.whatsapp ?? "", "Olá! Tenho uma dúvida.")} target="_blank" rel="noreferrer" className="hidden text-lg lg:inline" aria-label="WhatsApp">💬</a>
          <Link to="/conta" className="grid h-9 w-9 place-items-center rounded-lg text-lg" aria-label={t("Minha conta")}>👤</Link>
          <Link to="/favoritos" className="relative grid h-9 w-9 place-items-center rounded-lg text-lg" aria-label={t("Favoritos")}>
            ♡{wish.count > 0 && <Badge n={wish.count} tone="bg-grape" />}
          </Link>
          <Link to="/carrinho" className="relative grid h-9 w-9 place-items-center rounded-lg text-lg" aria-label={t("Carrinho")}>
            🛒{cart.count > 0 && <Badge n={cart.count} tone="bg-brand" />}
          </Link>
        </nav>
      </div>

      {/* secondary nav (desktop): Categorias dropdown + key links */}
      <div className="hidden border-t border-line md:block">
        <div className="mx-auto flex max-w-6xl items-center gap-1 px-4">
          <CategoriesMenu categories={categories} tf={tf} t={t} />
          <NavLink to="/produtos">{t("Todos os produtos")}</NavLink>
          <NavLink to="/ofertas" tone="text-brand-dark">{t("Ofertas")}</NavLink>
          <NavLink to="/atacado">{t("Atacado")}</NavLink>
          <NavLink to="/rastrear">{t("Rastrear pedido")}</NavLink>
        </div>
      </div>

      {/* mobile search */}
      <form onSubmit={search} className="flex items-center gap-2 border-t border-line bg-surface-2 px-3 py-2 md:hidden">
        <span className="text-muted">🔍</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Buscar brinquedos, bonecas…")} className="w-full bg-transparent text-sm outline-none placeholder:text-muted" />
      </form>

      {/* mobile drawer */}
      {menu && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMenu(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute left-0 top-0 flex h-full w-80 max-w-[85%] flex-col bg-surface shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-line p-4">
              <span className="font-display text-lg font-extrabold text-brand-dark">{t("Categorias")}</span>
              <button onClick={() => setMenu(false)} className="grid h-8 w-8 place-items-center rounded-full bg-surface-2 text-lg" aria-label={t("Fechar")}>✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <Link to="/produtos" onClick={() => setMenu(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 font-semibold hover:bg-surface-2">🛍️ {t("Todos os produtos")}</Link>
              {categories.map((c) => (
                <Link key={c.id} to={`/categoria/${c.slug}`} onClick={() => setMenu(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 font-semibold hover:bg-surface-2">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-lg" style={{ background: `color-mix(in srgb, var(--color-${c.accent}) 16%, white)` }}>{c.emoji}</span>
                  {tf(c, "name")}
                </Link>
              ))}
              <hr className="my-2 border-line" />
              <Link to="/ofertas" onClick={() => setMenu(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 font-bold text-brand-dark hover:bg-surface-2">🏷️ {t("Ofertas")}</Link>
              <Link to="/atacado" onClick={() => setMenu(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 font-bold hover:bg-surface-2">📦 {t("Atacado")}</Link>
              <Link to="/conta" onClick={() => setMenu(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 font-semibold hover:bg-surface-2">👤 {t("Minha conta")}</Link>
              <Link to="/rastrear" onClick={() => setMenu(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 font-semibold hover:bg-surface-2">🚚 {t("Rastrear pedido")}</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function NavLink({ to, children, tone = "text-ink" }: { to: string; children: React.ReactNode; tone?: string }) {
  return (
    <Link to={to} className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${tone} hover:text-brand-dark`}>
      {children}
    </Link>
  );
}

function CategoriesMenu({ categories, tf, t }: { categories: Category[]; tf: (o: Category, b: string) => string; t: (s: string) => string }) {
  return (
    <div className="group relative">
      <button className="flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-bold text-ink group-hover:text-brand-dark">
        🗂️ {t("Categorias")}
        <span className="text-[10px] transition-transform group-hover:rotate-180">▾</span>
      </button>
      <div className="invisible absolute left-0 top-full z-40 w-[560px] translate-y-1 rounded-2xl border border-line bg-surface p-3 opacity-0 shadow-[var(--shadow-pop)] transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
        <div className="grid grid-cols-2 gap-1">
          {categories.map((c) => (
            <Link key={c.id} to={`/categoria/${c.slug}`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-surface-2">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-xl" style={{ background: `color-mix(in srgb, var(--color-${c.accent}) 16%, white)` }}>{c.emoji}</span>
              <span className="text-sm font-semibold leading-tight text-ink">{tf(c, "name")}</span>
            </Link>
          ))}
        </div>
        <Link to="/produtos" className="mt-1 block rounded-xl px-3 py-2 text-center text-sm font-bold text-brand-dark hover:bg-surface-2">
          {t("Ver todos os produtos")} →
        </Link>
      </div>
    </div>
  );
}

function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <button
      onClick={() => setLang(lang === "pt" ? "en" : "pt")}
      className="flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs font-bold text-ink"
      aria-label={lang === "pt" ? "Switch to English" : "Mudar para português"}
      title={lang === "pt" ? "Switch to English" : "Mudar para português"}
    >
      {lang === "pt" ? "🇧🇷 PT" : "🇺🇸 EN"}
    </button>
  );
}

function Badge({ n, tone }: { n: number; tone: string }) {
  return (
    <span className={`absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full ${tone} px-1 text-[10px] font-extrabold text-white`}>
      {n}
    </span>
  );
}
