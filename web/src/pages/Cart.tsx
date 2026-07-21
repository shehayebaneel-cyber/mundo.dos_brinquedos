import { Link } from "react-router-dom";
import { useCart } from "../lib/cart";
import { useI18n } from "../lib/i18n";
import { brl } from "../lib/money";
import { Thumb } from "../components/Thumb";

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
          {cart.lines.map((l) => (
            <div key={`${l.productId}-${l.variant}`} className="flex gap-3 rounded-[16px] border border-line bg-surface p-3">
              <Link to={`/produto/${l.slug}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-line">
                <Thumb url={l.image} alt={l.name} emojiSize="text-3xl" />
              </Link>
              <div className="flex flex-1 flex-col">
                <Link to={`/produto/${l.slug}`} className="text-sm font-semibold leading-tight text-ink">{l.name}</Link>
                {l.variant && <span className="text-xs text-muted">{l.variant}</span>}
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center rounded-full border border-line">
                    <button onClick={() => cart.setQty(l.productId, l.variant, l.qty - 1)} className="px-2.5 py-1 text-lg">−</button>
                    <span className="min-w-7 text-center text-sm font-bold tabular">{l.qty}</span>
                    <button onClick={() => cart.setQty(l.productId, l.variant, l.qty + 1)} className="px-2.5 py-1 text-lg">+</button>
                  </div>
                  <span className="font-display font-extrabold text-ink tabular">{brl(l.priceCents * l.qty)}</span>
                </div>
              </div>
              <button onClick={() => cart.remove(l.productId, l.variant)} className="self-start text-muted hover:text-danger" aria-label={t("Remover")}>✕</button>
            </div>
          ))}
        </div>

        <aside className="h-fit rounded-[16px] border border-line bg-surface p-4 lg:sticky lg:top-40">
          <h2 className="font-display font-bold text-ink">{t("Resumo")}</h2>
          <div className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted">{t("Subtotal")}</span><span className="tabular">{brl(cart.subtotalCents)}</span></div>
            <div className="flex justify-between"><span className="text-muted">{t("Frete")}</span><span className="text-muted">{t("calculado no checkout")}</span></div>
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
