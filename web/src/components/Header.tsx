import { useState } from "react";
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

      {/* colourful category strip (desktop) */}
      <div className="hidden border-t-2 border-line bg-surface md:block">
        <div className="no-scrollbar mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto px-4 py-2">
          <CatPill to="/produtos" emoji="🛍️" label={t("Todos os produtos")} accent="ink" />
          {categories.map((c) => (
            <CatPill key={c.id} to={`/categoria/${c.slug}`} emoji={c.emoji} label={tf(c, "name")} accent={c.accent} />
          ))}
          <span className="mx-1 h-6 w-px shrink-0 bg-line" />
          <CatPill to="/ofertas" emoji="🏷️" label={t("Ofertas")} accent="brand" solid />
          <CatPill to="/atacado" emoji="📦" label={t("Atacado")} accent="grape" solid />
        </div>
      </div>

      {/* mobile search */}
      <form onSubmit={search} className="flex items-center gap-2 border-t-2 border-line bg-surface-2 px-3 py-2 md:hidden">
        <span className="text-muted">🔍</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Buscar brinquedos, bonecas…")} className="w-full bg-transparent text-sm outline-none placeholder:text-muted" />
      </form>

      {/* mobile category strip */}
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto border-t-2 border-line bg-surface px-3 py-2 md:hidden">
        {categories.map((c) => (
          <CatPill key={c.id} to={`/categoria/${c.slug}`} emoji={c.emoji} label={tf(c, "name")} accent={c.accent} />
        ))}
        <CatPill to="/ofertas" emoji="🏷️" label={t("Ofertas")} accent="brand" solid />
      </div>

      {/* mobile drawer */}
      {menu && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMenu(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute left-0 top-0 flex h-full w-80 max-w-[85%] flex-col bg-surface shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b-2 border-line p-4">
              <img src="/logo.png" alt="" className="h-9 w-auto" />
              <button onClick={() => setMenu(false)} className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-lg" aria-label={t("Fechar")}>✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
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
            </div>
          </div>
        </div>
      )}
    </header>
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
