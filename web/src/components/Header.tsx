import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../lib/cart";
import { useWishlist } from "../lib/wishlist";
import { useStore, waLink } from "../lib/store";

export function Header() {
  const cart = useCart();
  const wish = useWishlist();
  const { categories, settings } = useStore();
  const nav = useNavigate();
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState("");

  function search(e: React.FormEvent) {
    e.preventDefault();
    nav(`/busca?q=${encodeURIComponent(q)}`);
    setMenu(false);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2.5 sm:gap-4 sm:px-4">
        <button className="grid h-9 w-9 place-items-center rounded-lg text-xl md:hidden" onClick={() => setMenu(true)} aria-label="Abrir menu">
          ☰
        </button>
        <Link to="/" className="font-display text-xl font-extrabold tracking-tight text-brand-dark sm:text-2xl">
          Mundo
          <span className="ml-1 hidden align-middle text-[10px] font-semibold text-muted sm:inline">dos Brinquedos</span>
        </Link>

        <form onSubmit={search} className="ml-2 hidden flex-1 items-center gap-2 rounded-full bg-surface-2 px-4 py-2 md:flex">
          <span className="text-muted">🔍</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar brinquedos, bonecas, bicicletas…" className="w-full bg-transparent text-sm outline-none placeholder:text-muted" />
        </form>

        <nav className="ml-auto flex items-center gap-3 text-sm">
          <Link to="/ofertas" className="hidden font-bold text-brand-dark lg:inline">Ofertas</Link>
          <Link to="/atacado" className="hidden font-bold text-ink lg:inline">Atacado</Link>
          <a href={waLink(settings.whatsapp ?? "", "Olá! Tenho uma dúvida.")} target="_blank" rel="noreferrer" className="hidden text-pix lg:inline" aria-label="WhatsApp">💬</a>
          <Link to="/conta" className="grid h-9 w-9 place-items-center rounded-lg text-lg" aria-label="Minha conta">👤</Link>
          <Link to="/favoritos" className="relative grid h-9 w-9 place-items-center rounded-lg text-lg" aria-label="Favoritos">
            ♡{wish.count > 0 && <Badge n={wish.count} tone="bg-grape" />}
          </Link>
          <Link to="/carrinho" className="relative grid h-9 w-9 place-items-center rounded-lg text-lg" aria-label="Carrinho">
            🛒{cart.count > 0 && <Badge n={cart.count} tone="bg-brand" />}
          </Link>
        </nav>
      </div>

      {/* category strip (desktop) */}
      <div className="mx-auto hidden max-w-6xl gap-4 overflow-x-auto px-4 pb-2 text-sm md:flex">
        {categories.map((c) => (
          <Link key={c.id} to={`/categoria/${c.slug}`} className="whitespace-nowrap font-semibold text-muted hover:text-brand-dark">
            {c.emoji} {c.name}
          </Link>
        ))}
      </div>

      {/* mobile search */}
      <form onSubmit={search} className="flex items-center gap-2 border-t border-line bg-surface-2 px-3 py-2 md:hidden">
        <span className="text-muted">🔍</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar brinquedos, bonecas…" className="w-full bg-transparent text-sm outline-none placeholder:text-muted" />
      </form>

      {/* mobile drawer */}
      {menu && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMenu(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute left-0 top-0 h-full w-72 overflow-y-auto bg-surface p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <span className="font-display text-lg font-extrabold text-brand-dark">Categorias</span>
              <button onClick={() => setMenu(false)} className="text-xl" aria-label="Fechar">✕</button>
            </div>
            <div className="mt-3 flex flex-col">
              <Link to="/produtos" onClick={() => setMenu(false)} className="rounded-lg px-2 py-2.5 font-semibold hover:bg-surface-2">🛍️ Todos os produtos</Link>
              {categories.map((c) => (
                <Link key={c.id} to={`/categoria/${c.slug}`} onClick={() => setMenu(false)} className="rounded-lg px-2 py-2.5 font-semibold hover:bg-surface-2">
                  {c.emoji} {c.name}
                </Link>
              ))}
              <hr className="my-2 border-line" />
              <Link to="/ofertas" onClick={() => setMenu(false)} className="rounded-lg px-2 py-2.5 font-bold text-brand-dark hover:bg-surface-2">🏷️ Ofertas</Link>
              <Link to="/atacado" onClick={() => setMenu(false)} className="rounded-lg px-2 py-2.5 font-bold hover:bg-surface-2">📦 Atacado</Link>
              <Link to="/conta" onClick={() => setMenu(false)} className="rounded-lg px-2 py-2.5 font-semibold hover:bg-surface-2">👤 Minha conta</Link>
              <Link to="/rastrear" onClick={() => setMenu(false)} className="rounded-lg px-2 py-2.5 font-semibold hover:bg-surface-2">🚚 Rastrear pedido</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function Badge({ n, tone }: { n: number; tone: string }) {
  return (
    <span className={`absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full ${tone} px-1 text-[10px] font-extrabold text-white`}>
      {n}
    </span>
  );
}
