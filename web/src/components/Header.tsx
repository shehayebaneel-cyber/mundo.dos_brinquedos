import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../lib/cart";
import { useWishlist } from "../lib/wishlist";
import { useStore, waLink } from "../lib/store";
import { useI18n } from "../lib/i18n";

export function Header() {
  const cart = useCart();
  const wish = useWishlist();
  const { categories, settings } = useStore();
  const { t, tf } = useI18n();
  const nav = useNavigate();
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState("");

  // lock the page behind the drawer from scrolling while it's open
  useEffect(() => {
    if (!menu) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [menu]);

  function search(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    nav(`/busca?q=${encodeURIComponent(q)}`);
    setMenu(false);
  }

  return (
    <header className="sticky top-0 z-30 border-b-2 border-line bg-surface/95 backdrop-blur">
      {/* top row */}
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2 sm:gap-4 sm:px-4">
        <button className="grid h-10 w-10 place-items-center rounded-xl bg-surface-2 text-xl md:hidden" onClick={() => setMenu(true)} aria-label={t("Abrir menu")}>
          ☰
        </button>
        <Link to="/" className="shrink-0" aria-label="Mundo dos Brinquedos e Variedades">
          <img src="/logo.png" alt="Mundo dos Brinquedos e Variedades" className="h-9 w-auto sm:h-12" />
        </Link>

        <form onSubmit={search} className="ml-2 hidden flex-1 items-center gap-2 rounded-full border-2 border-line bg-surface-2 px-4 py-2 md:flex">
          <span className="text-muted">🔍</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Buscar brinquedos, bonecas, bicicletas…")} className="w-full bg-transparent text-sm outline-none placeholder:text-muted" />
        </form>

        <nav className="ml-auto flex items-center gap-1.5 text-sm sm:gap-2.5">
          <LangToggle />
          <a href={waLink(settings.whatsapp ?? "", "Olá! Tenho uma dúvida.")} target="_blank" rel="noreferrer" className="hidden text-lg lg:inline" aria-label="WhatsApp">💬</a>
          <Link to="/conta" className="grid h-9 w-9 place-items-center rounded-lg text-lg" aria-label={t("Minha conta")}>👤</Link>
          <Link to="/favoritos" className="relative grid h-9 w-9 place-items-center rounded-lg text-lg" aria-label={t("Favoritos")}>
            ♡{wish.count > 0 && <Badge n={wish.count} tone="bg-grape" />}
          </Link>
          <Link to="/carrinho" className="relative grid h-10 w-10 place-items-center rounded-xl bg-brand text-lg text-white" aria-label={t("Carrinho")}>
            🛒{cart.count > 0 && <Badge n={cart.count} tone="bg-blue" />}
          </Link>
        </nav>
      </div>

      {/* main options strip (desktop) — categories live in the dropdown + home section */}
      <div className="hidden border-t-2 border-line bg-surface md:block">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2">
          <CategoriesMenu categories={categories} tf={tf} t={t} />
          <CatPill to="/produtos" emoji="🛍️" label={t("Todos os produtos")} accent="ink" />
          <CatPill to="/ofertas" emoji="🏷️" label={t("Ofertas")} accent="brand" solid />
          <CatPill to="/atacado" emoji="📦" label={t("Atacado")} accent="grape" solid />
          <CatPill to="/rastrear" emoji="🚚" label={t("Rastrear pedido")} accent="sky" />
        </div>
      </div>

      {/* mobile search */}
      <form onSubmit={search} className="flex items-center gap-2 border-t-2 border-line bg-surface-2 px-3 py-2 md:hidden">
        <span className="text-muted">🔍</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Buscar brinquedos, bonecas…")} className="w-full bg-transparent text-sm outline-none placeholder:text-muted" />
      </form>

      {/* mobile main options strip — full category list is in the ☰ drawer + home section */}
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto border-t-2 border-line bg-surface px-3 py-2 md:hidden">
        <CatPill to="/produtos" emoji="🛍️" label={t("Todos")} accent="ink" />
        <CatPill to="/ofertas" emoji="🏷️" label={t("Ofertas")} accent="brand" solid />
        <CatPill to="/atacado" emoji="📦" label={t("Atacado")} accent="grape" solid />
        <CatPill to="/rastrear" emoji="🚚" label={t("Rastrear pedido")} accent="sky" />
      </div>

      {/* mobile drawer — portaled to <body> so it sits above the whole page */}
      {createPortal(
        menu ? (
          <div className="fixed inset-0 z-[100] md:hidden" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMenu(false)} aria-hidden />
            <div className="absolute left-0 top-0 flex h-[100dvh] w-80 max-w-[86%] flex-col bg-surface shadow-2xl">
              <div className="flex shrink-0 items-center justify-between border-b-2 border-line p-4">
                <img src="/logo.png" alt="Mundo dos Brinquedos e Variedades" className="h-9 w-auto" />
                <button onClick={() => setMenu(false)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-2 text-lg" aria-label={t("Fechar")}>✕</button>
              </div>
              <nav className="flex-1 overflow-y-auto overscroll-contain p-3 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
                <Link to="/produtos" onClick={() => setMenu(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 font-bold hover:bg-surface-2">🛍️ {t("Todos os produtos")}</Link>
                {categories.map((c) => (
                  <Link key={c.id} to={`/categoria/${c.slug}`} onClick={() => setMenu(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 font-semibold hover:bg-surface-2">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-lg" style={{ background: `color-mix(in srgb, var(--color-${c.accent}) 20%, white)` }}>{c.emoji}</span>
                    {tf(c, "name")}
                  </Link>
                ))}
                <hr className="my-2 border-line" />
                <Link to="/ofertas" onClick={() => setMenu(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 font-bold text-brand-dark hover:bg-surface-2">🏷️ {t("Ofertas")}</Link>
                <Link to="/atacado" onClick={() => setMenu(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 font-bold hover:bg-surface-2">📦 {t("Atacado")}</Link>
                <Link to="/conta" onClick={() => setMenu(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 font-semibold hover:bg-surface-2">👤 {t("Minha conta")}</Link>
                <Link to="/rastrear" onClick={() => setMenu(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 font-semibold hover:bg-surface-2">🚚 {t("Rastrear pedido")}</Link>
              </nav>
            </div>
          </div>
        ) : null,
        document.body,
      )}
    </header>
  );
}

function CategoriesMenu({ categories, tf, t }: { categories: { id: number; slug: string; emoji: string; accent: string; name: string }[]; tf: (o: never, b: string) => string; t: (s: string) => string }) {
  return (
    <div className="group relative">
      <button className="flex shrink-0 items-center gap-1.5 rounded-full border-2 border-line bg-surface-2 px-3.5 py-1.5 text-[13px] font-extrabold text-ink group-hover:border-brand/40">
        🗂️ {t("Categorias")}
        <span className="text-[10px] transition-transform group-hover:rotate-180">▾</span>
      </button>
      <div className="invisible absolute left-0 top-full z-40 w-[520px] translate-y-1 rounded-2xl border-2 border-line bg-surface p-3 opacity-0 shadow-[var(--shadow-pop)] transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
        <div className="grid grid-cols-2 gap-1">
          {categories.map((c) => (
            <Link key={c.id} to={`/categoria/${c.slug}`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-surface-2">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-xl text-white" style={{ background: `var(--color-${c.accent})` }}>{c.emoji}</span>
              <span className="text-sm font-bold leading-tight text-ink">{tf(c as never, "name")}</span>
            </Link>
          ))}
        </div>
        <Link to="/produtos" className="mt-1 block rounded-xl px-3 py-2 text-center text-sm font-bold text-brand-dark hover:bg-surface-2">{t("Ver todos os produtos")} →</Link>
      </div>
    </div>
  );
}

function CatPill({ to, emoji, label, accent, solid = false }: { to: string; emoji: string; label: string; accent: string; solid?: boolean }) {
  const style = solid
    ? { background: `var(--color-${accent})`, color: "#fff", borderColor: "transparent" }
    : { background: `color-mix(in srgb, var(--color-${accent}) 14%, white)`, borderColor: `color-mix(in srgb, var(--color-${accent}) 35%, white)` };
  return (
    <Link to={to} className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border-2 px-3 py-1.5 text-[13px] font-bold text-ink transition-transform hover:-translate-y-0.5" style={style}>
      <span>{emoji}</span>
      {label}
    </Link>
  );
}

function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <button
      onClick={() => setLang(lang === "pt" ? "en" : "pt")}
      className="flex items-center gap-1 rounded-full border-2 border-line px-2.5 py-1 text-xs font-bold text-ink"
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
