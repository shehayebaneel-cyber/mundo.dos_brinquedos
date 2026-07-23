import { Link } from "react-router-dom";
import { useCart } from "../lib/cart";
import { useI18n } from "../lib/i18n";
import { brl } from "../lib/money";
import { Thumb } from "../components/Thumb";
import { TIER2_MIN_ITEMS } from "../lib/pricing";

export function Cart() {
  const cart = useCart();
  const { t } = useI18n();

  if (cart.lines.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-6xl">🛒</p>
        <h1 className="mt-3 font-display text-2xl font-extrabold text-ink">{t("Seu carrinho está vazio")}</h1>
        <p className="mt-1 text-muted">{t("Que tal dar uma olhada nas nossas ofertas?")}</p>
        <Link to="/produtos" className="btn btn-primary mt-5 px-6 py-3">{t("Ver produtos")}</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-5">
      <h1 className="mb-4 font-display text-2xl font-extrabold text-ink">{t("Meu carrinho")} ({cart.count})</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <TierBanner />
          {cart.lines.map((l) => {
            const discounted = l.unitCents < l.regularCents;
            const step = l.boxOnly && l.boxUnits > 0 ? l.boxUnits : 1;
            return (
              <div key={`${l.productId}-${l.variant}`} className="flex gap-3 rounded-[16px] border border-line bg-surface p-3">
                <Link to={`/produto/${l.slug}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-line">
                  <Thumb url={l.image} alt={l.name} emojiSize="text-3xl" />
                </Link>
                <div className="flex flex-1 flex-col">
                  <Link to={`/produto/${l.slug}`} className="text-sm font-semibold leading-tight text-ink">{l.name}</Link>
                  {l.variant && <span className="text-xs text-muted">{l.variant}</span>}
                  {l.boxes > 0 ? (
                    <div className="mt-1 space-y-0.5 text-xs">
                      <div className="flex justify-between gap-2 font-semibold text-grape">
                        <span>📦 {t("{b} caixa(s) com {u} unidades", { b: l.boxes, u: l.boxUnits })}</span>
                        <span className="tabular">{brl(l.boxes * l.boxPriceCents)}</span>
                      </div>
                      {l.remainderUnits > 0 && (
                        <div className="flex justify-between gap-2 text-muted">
                          <span>{t("{n} unidades adicionais", { n: l.remainderUnits })} · {brl(l.unitCents)} {t("cada")}</span>
                          <span className="tabular">{brl(l.remainderUnits * l.unitCents)}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="mt-0.5 text-xs text-muted tabular">
                      {brl(l.unitCents)} {t("cada")}
                      {discounted && <span className="ml-1 text-muted line-through">{brl(l.regularCents)}</span>}
                    </span>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-1.5">
                    <div className="flex items-center rounded-full border border-line">
                      <button onClick={() => cart.setQty(l.productId, l.variant, l.qty - step)} className="px-2.5 py-1 text-lg">−</button>
                      <span className="min-w-7 text-center text-sm font-bold tabular">{l.qty}</span>
                      <button onClick={() => cart.setQty(l.productId, l.variant, l.qty + step)} className="px-2.5 py-1 text-lg">+</button>
                    </div>
                    <span className="font-display font-extrabold text-brand tabular">{brl(l.lineTotalCents)}</span>
                  </div>
                </div>
                <button onClick={() => cart.remove(l.productId, l.variant)} className="self-start text-muted hover:text-danger" aria-label={t("Remover")}>✕</button>
              </div>
            );
          })}
        </div>

        <aside className="h-fit rounded-[16px] border border-line bg-surface p-4 lg:sticky lg:top-40">
          <h2 className="font-display font-bold text-ink">{t("Resumo")}</h2>
          <div className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted">{t("Subtotal")}</span><span className="tabular">{brl(cart.subtotalCents)}</span></div>
            {cart.savingsCents > 0 && (
              <div className="flex justify-between font-bold text-pix"><span>{t("Você economiza")}</span><span className="tabular">− {brl(cart.savingsCents)}</span></div>
            )}
          </div>
          <div className="mt-3 flex justify-between border-t border-line pt-3 font-display text-lg font-extrabold text-ink">
            <span>{t("Total")}</span><span className="tabular">{brl(cart.subtotalCents)}</span>
          </div>
          <Link to="/checkout" className="btn btn-primary mt-4 w-full py-3">{t("Finalizar compra")}</Link>
          <Link to="/produtos" className="btn btn-ghost mt-2 w-full py-2.5 text-sm">{t("Continuar comprando")}</Link>
        </aside>
      </div>
    </div>
  );
}

function TierBanner() {
  const cart = useCart();
  const { t } = useI18n();
  const hasThreshold = cart.thresholdCents > 0;

  // active level label + colour
  const level =
    cart.tier === 3 ? { emoji: "🏆", label: t("Preço de atacado"), accent: "grape" }
    : cart.tier === 2 ? { emoji: "📦", label: t("Preço de 10+ itens"), accent: "teal" }
    : { emoji: "🛍️", label: t("Preço normal"), accent: "sky" };

  // progress toward the next level
  let pct = 100;
  let hint: React.ReactNode = null;
  if (cart.tier === 1) {
    pct = Math.min(100, Math.round((cart.count / TIER2_MIN_ITEMS) * 100));
    hint = (
      <>
        {t("Faltam {n} para o preço de 10+ itens.", { n: cart.itemsToTier2 })}
        {hasThreshold && cart.centsToTier3 > 0 && <> {t("Ou some {v} em produtos para o preço de atacado.", { v: brl(cart.centsToTier3) })}</>}
      </>
    );
  } else if (cart.tier === 2) {
    pct = hasThreshold ? Math.min(100, Math.round((cart.grossCents / cart.thresholdCents) * 100)) : 100;
    hint = hasThreshold && cart.centsToTier3 > 0
      ? t("Faltam {v} para o preço de atacado — o melhor preço!", { v: brl(cart.centsToTier3) })
      : t("Você desbloqueou o preço de 10+ itens! 🎉");
  } else {
    hint = t("Você está no melhor preço. Aproveite! 🎉");
  }

  return (
    <div className="rounded-[16px] border-2 p-4" style={{ borderColor: `color-mix(in srgb, var(--color-${level.accent}) 40%, white)`, background: `color-mix(in srgb, var(--color-${level.accent}) 8%, white)` }}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-lg text-white" style={{ background: `var(--color-${level.accent})` }}>{level.emoji}</span>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wide text-muted">{t("Nível de preço ativo")}</div>
          <div className="font-display text-base font-extrabold text-ink">{level.label}</div>
        </div>
        {cart.savingsCents > 0 && (
          <span className="ml-auto rounded-full bg-pix/10 px-3 py-1 text-sm font-extrabold text-pix">{t("Economia de {v}", { v: brl(cart.savingsCents) })}</span>
        )}
      </div>
      {hint && <p className="mt-2 text-sm font-semibold text-ink">{hint}</p>}
      {cart.tier < 3 && (
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: `var(--color-${level.accent})` }} />
        </div>
      )}
    </div>
  );
}
