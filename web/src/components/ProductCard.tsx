import { Link, useNavigate } from "react-router-dom";
import type { Product } from "../lib/types";
import { brl, discountPct, installment, pixCents } from "../lib/money";
import { useCart } from "../lib/cart";
import { useWishlist } from "../lib/wishlist";
import { Thumb } from "./Thumb";

export function ProductCard({ p }: { p: Product }) {
  const cart = useCart();
  const wish = useWishlist();
  const nav = useNavigate();
  const off = discountPct(p.oldPriceCents, p.priceCents);
  const inst = installment(p.priceCents, p.installmentsMax);
  const out = p.stock <= 0;
  const low = !out && p.stock <= p.lowStockAt;
  const hasVariants = p.variants.length > 0;

  function addToCart(e: React.MouseEvent) {
    e.preventDefault();
    if (out) return;
    if (hasVariants) {
      nav(`/produto/${p.slug}`);
      return;
    }
    cart.add({ productId: p.id, slug: p.slug, name: p.name, priceCents: p.priceCents, image: p.images[0]?.url ?? "", variant: "", stock: p.stock });
  }

  return (
    <Link
      to={`/produto/${p.slug}`}
      className="group flex w-full flex-col overflow-hidden rounded-[16px] border border-line bg-surface transition-shadow hover:shadow-[var(--shadow-card)]"
    >
      <div className="relative aspect-square overflow-hidden">
        <Thumb url={p.images[0]?.url} alt={p.name} emojiSize="text-6xl" />
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {off > 0 && <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-extrabold text-white">-{off}%</span>}
          {p.isNew && <span className="rounded-full bg-grape px-2 py-0.5 text-[11px] font-extrabold text-white">Novo</span>}
          {p.bestSeller && !p.isNew && <span className="rounded-full bg-sun px-2 py-0.5 text-[11px] font-extrabold text-ink">Top</span>}
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            wish.toggle(p.id);
          }}
          aria-label={wish.has(p.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-base shadow-sm transition-transform active:scale-90"
        >
          <span className={wish.has(p.id) ? "text-brand" : "text-muted"}>{wish.has(p.id) ? "♥" : "♡"}</span>
        </button>
      </div>

      <div className="flex flex-1 flex-col p-3">
        {p.brand && <span className="text-[11px] font-bold uppercase tracking-wide text-muted">{p.brand}</span>}
        <h3 className="line-clamp-2 min-h-[2.4em] text-sm font-semibold leading-tight text-ink">{p.name}</h3>

        <div className="mt-1.5">
          {p.oldPriceCents && <span className="mr-1 text-xs text-muted line-through tabular">{brl(p.oldPriceCents)}</span>}
          <div className="font-display text-lg font-extrabold text-ink tabular">{brl(p.priceCents)}</div>
          <div className="text-[11px] text-muted tabular">
            {inst.n}x de {brl(inst.eachCents)}
          </div>
          <div className="text-[11px] font-bold text-pix tabular">{brl(pixCents(p.priceCents, p.pixPercent))} no Pix</div>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className={`text-[11px] font-bold ${out ? "text-danger" : low ? "text-warn" : "text-pix"}`}>
            {out ? "● Esgotado" : low ? `● Últimas ${p.stock}` : "● Em estoque"}
          </span>
        </div>

        <button
          onClick={addToCart}
          disabled={out}
          className="btn btn-primary mt-2.5 w-full py-2 text-sm disabled:bg-line disabled:text-muted"
        >
          {out ? "Indisponível" : hasVariants ? "Escolher opções" : "+ Adicionar"}
        </button>
      </div>
    </Link>
  );
}
