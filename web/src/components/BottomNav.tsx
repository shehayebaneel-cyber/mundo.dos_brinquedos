import { Link, useLocation } from "react-router-dom";
import { useCart } from "../lib/cart";

const items = [
  { to: "/", icon: "🏠", label: "Início", match: (p: string) => p === "/" },
  { to: "/produtos", icon: "🗂️", label: "Categorias", match: (p: string) => p.startsWith("/produtos") || p.startsWith("/categoria") },
  { to: "/busca", icon: "🔍", label: "Buscar", match: (p: string) => p.startsWith("/busca") },
  { to: "/ofertas", icon: "🏷️", label: "Ofertas", match: (p: string) => p.startsWith("/ofertas") },
  { to: "/carrinho", icon: "🛒", label: "Carrinho", match: (p: string) => p.startsWith("/carrinho") },
];

export function BottomNav() {
  const { pathname } = useLocation();
  const cart = useCart();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      {items.map((it) => {
        const active = it.match(pathname);
        return (
          <Link key={it.to} to={it.to} className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-bold ${active ? "text-brand-dark" : "text-muted"}`}>
            <span className="text-lg leading-none">{it.icon}</span>
            {it.label}
            {it.to === "/carrinho" && cart.count > 0 && (
              <span className="absolute right-5 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[9px] font-extrabold text-white">{cart.count}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
