import { Link, useNavigate } from "react-router-dom";
import type { Product } from "../lib/types";
import { brl, discountPct, installment, pixCents } from "../lib/money";
import { useCart } from "../lib/cart";
import { useWishlist } from "../lib/wishlist";
import { useI18n } from "../lib/i18n";
import { Thumb } from "./Thumb";

export function ProductCard({ p }: { p: Product }) {
  const cart = useCart();
  const wish = useWishlist();
  const { t, tf } = useI18n();
  const nav = useNavigate();
  const off = discountPct(p.oldPriceCents, p.priceCents);
  const inst = installment(p.priceCents, p.installmentsMax);
  const out = p.stock <= 0;
  const low = !out && p.stock <= p.lowStockAt;
  const hasVariants = p.variants.length > 0;
  const rating = p.avgRating ?? 0;

  function addToCart(e: React.MouseEvent) {
    e.preventDefault();
    if (out) return;
    if (hasVariants) {
      nav(`/produto/${p.slug}`);
      return;
    }
    cart.add({ productId: p.id, slug: p.slug, name: tf(p, "name"), priceCents: p.priceCents, image: p.images[0]?.url ?? "", variant: "", stock: p.stock });
  }

  return (
    <Link
      to={`/produto/${p.slug}`}
      className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-[var(--shadow-card)]"
    >
      {/* image */}
      <div className="relative aspect-square overflow-hidden bg-white">
        <div className="h-full w-full p-3">
          <Thumb url={p.images[0]?.url} alt={tf(p, "name")} emojiSize="text-6xl" fit="contain" className="transition-transform duration-200 group-hover:scale-105" />
        </div>
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {off > 0 && <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-extrabold text-white">-{off}%</span>}
          {p.isNew && <span className="rounded-full bg-grape px-2 py-0.5 text-[11px] font-extrabold text-white">{t("Novo")}</span>}
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

      {/* body */}
      <div className="flex flex-1 flex-col p-3">
        <div className="flex items-center justify-between gap-1">
          {p.brand ? <span className="truncate text-[11px] font-bold uppercase tracking-wide text-muted">{p.brand}</span> : <span />}
          {rating > 0 && (
            <span className="flex shrink-0 items-center gap-0.5 text-[11px] font-bold text-ink">
              <span className="text-sun">★</span>{rating.toFixed(1)}
            </span>
          )}
        </div>
        <h3 className="mt-0.5 line-clamp-2 min-h-[2.5em] text-sm font-semibold leading-tight text-ink">{tf(p, "name")}</h3>

        {/* price block — reserve the old-price line so cards align */}
        <div className="mt-1.5">
          <div className="h-4 text-xs text-muted line-through tabular">{p.oldPriceCents ? brl(p.oldPriceCents) : ""}</div>
          <div className="font-display text-lg font-extrabold text-ink tabular">{brl(p.priceCents)}</div>
          <div className="text-[11px] text-muted tabular">{inst.n}x {brl(inst.eachCents)}</div>
          <div className="text-[11px] font-bold text-pix tabular">{brl(pixCents(p.priceCents, p.pixPercent))} {t("no Pix")}</div>
        </div>

        <span className={`mt-2 text-[11px] font-bold ${out ? "text-danger" : low ? "text-warn" : "text-pix"}`}>
          {out ? `● ${t("Esgotado")}` : low ? `● ${t("Últimas {n}", { n: p.stock })}` : `● ${t("Em estoque")}`}
        </span>

        <button
          onClick={addToCart}
          disabled={out}
          className="btn btn-primary mt-3 w-full py-2 text-sm disabled:bg-line disabled:text-muted"
        >
          {out ? t("Indisponível") : hasVariants ? t("Escolher opções") : t("+ Adicionar")}
        </button>
      </div>
    </Link>
  );
}
