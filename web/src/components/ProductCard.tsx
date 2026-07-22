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
  const showInst = p.priceCents >= 3000; // no 12× noise on pocket-money toys
  const out = p.stock <= 0;
  const low = !out && p.stock <= p.lowStockAt;
  const hasVariants = p.variants.length > 0;
  const rating = p.avgRating ?? 0;
  const accent = p.category?.accent ?? "brand";

  function addToCart(e: React.MouseEvent) {
    e.preventDefault();
    if (out) return;
    if (hasVariants) return void nav(`/produto/${p.slug}`);
    cart.add({ productId: p.id, slug: p.slug, name: tf(p, "name"), priceCents: p.priceCents, image: p.images[0]?.url ?? "", variant: "", stock: p.stock });
  }

  return (
    <Link
      to={`/produto/${p.slug}`}
      className="group flex h-full w-full flex-col overflow-hidden rounded-[22px] border-2 border-line bg-surface transition-all duration-200 hover:-translate-y-1 hover:border-brand/40 hover:shadow-[var(--shadow-card)]"
    >
      {/* image — always clean white so photos read clearly */}
      <div className="relative aspect-square overflow-hidden bg-white">
        {/* thin colour accent by category */}
        <span className="absolute inset-x-0 top-0 z-10 h-1.5" style={{ background: `var(--color-${accent})` }} />
        <div className="h-full w-full p-2.5">
          <Thumb url={p.images[0]?.url} alt={tf(p, "name")} emojiSize="text-6xl" fit="contain" className="rounded-2xl transition-transform duration-200 group-hover:scale-105" />
        </div>
        <div className="absolute left-2 top-3 z-10 flex flex-col items-start gap-1">
          {off > 0 && <span className="rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-extrabold text-white shadow-sm">-{off}%</span>}
          {p.isNew && <span className="rounded-full bg-blue px-2.5 py-0.5 text-[11px] font-extrabold text-white shadow-sm">{t("Novo")}</span>}
          {p.bestSeller && !p.isNew && <span className="rounded-full bg-yellow px-2.5 py-0.5 text-[11px] font-extrabold text-ink shadow-sm">★ Top</span>}
        </div>
        <button
          onClick={(e) => { e.preventDefault(); wish.toggle(p.id); }}
          aria-label={wish.has(p.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          className="absolute right-2 top-2 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-lg shadow-sm transition-transform active:scale-90"
        >
          <span className={wish.has(p.id) ? "text-brand" : "text-muted"}>{wish.has(p.id) ? "♥" : "♡"}</span>
        </button>
      </div>

      {/* body */}
      <div className="flex flex-1 flex-col p-3">
        <div className="flex items-center gap-1.5">
          {p.ageGroup && <span className="rounded-full bg-teal/15 px-2 py-0.5 text-[10px] font-extrabold text-teal-dark">{p.ageGroup}</span>}
          {rating > 0 && (
            <span className="ml-auto flex shrink-0 items-center gap-0.5 text-[11px] font-bold text-ink">
              <span className="text-sun">★</span>{rating.toFixed(1)}
            </span>
          )}
        </div>
        <h3 className="mt-1 line-clamp-2 min-h-[2.5em] font-display text-[15px] font-bold leading-tight text-ink">{tf(p, "name")}</h3>

        <div className="mt-auto pt-2">
          {p.oldPriceCents && <div className="text-xs text-muted line-through tabular">{brl(p.oldPriceCents)}</div>}
          <div className="font-display text-2xl font-extrabold leading-none text-brand tabular">{brl(p.priceCents)}</div>
          {showInst && <div className="mt-0.5 text-[11px] text-muted tabular">{inst.n}x {brl(inst.eachCents)}</div>}
          <div className="mt-0.5 text-[11px] font-bold text-pix tabular">{brl(pixCents(p.priceCents, p.pixPercent))} {t("no Pix")}</div>
        </div>

        <span className={`mt-2 text-[11px] font-bold ${out ? "text-danger" : low ? "text-warn" : "text-pix"}`}>
          {out ? `● ${t("Esgotado")}` : low ? `● ${t("Últimas {n}", { n: p.stock })}` : `● ${t("Em estoque")}`}
        </span>

        <button onClick={addToCart} disabled={out} className="btn btn-primary mt-2.5 w-full py-2.5 text-sm disabled:bg-line disabled:text-muted">
          {out ? t("Indisponível") : hasVariants ? t("Escolher opções") : t("+ Adicionar")}
        </button>
      </div>
    </Link>
  );
}
