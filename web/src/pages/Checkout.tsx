import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../lib/cart";
import { api } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { brl } from "../lib/money";
import { getAccount, setAccount, digits } from "../lib/account";
import type { Order } from "../lib/types";

export function Checkout() {
  const cart = useCart();
  const nav = useNavigate();
  const { t } = useI18n();
  const acc = getAccount();
  const [name, setName] = useState(acc?.name ?? "");
  const [phone, setPhone] = useState(acc?.phone ?? "");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const level = cart.tier === 3 ? t("Preço de atacado") : cart.tier === 2 ? t("Preço de 10+ itens") : t("Preço normal");
  const canSubmit = name.trim().length > 1 && digits(phone).length >= 10 && cart.lines.length > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!canSubmit) { setErr(t("Informe seu nome e WhatsApp.")); return; }
    setBusy(true);
    try {
      setAccount({ name: name.trim(), phone: phone.trim() });
      const order = await api.post<Order>("/api/orders", {
        name: name.trim(), phone: phone.trim(),
        items: cart.lines.map((l) => ({ productId: l.productId, qty: l.qty, variant: l.variant })),
      });
      cart.clear();
      nav(`/pedido/${order.code}`, { state: { order } });
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("Não foi possível enviar o pedido."));
    } finally {
      setBusy(false);
    }
  }

  if (cart.lines.length === 0) {
    return <div className="mx-auto max-w-md px-4 py-16 text-center"><p className="text-5xl">🛒</p><p className="mt-2 font-display text-xl font-bold text-ink">{t("Carrinho vazio")}</p><Link to="/produtos" className="btn btn-primary mt-4 px-6 py-3">{t("Ver produtos")}</Link></div>;
  }

  const input = "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand";
  const lbl = "mb-1 block text-xs font-bold text-muted";

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl px-4 py-5">
      <h1 className="mb-4 font-display text-2xl font-extrabold text-ink">{t("Finalizar pedido")}</h1>
      <div className="space-y-5">
        <section className="rounded-[16px] border border-line bg-surface p-4">
          <h2 className="font-display font-bold text-ink">{t("Seus dados")}</h2>
          <div className="mt-3 grid gap-3">
            <div><label className={lbl}>{t("Nome completo *")}</label><input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder={t("Seu nome")} /></div>
            <div><label className={lbl}>{t("WhatsApp *")}</label><input className={input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(62) 9 9999-9999" inputMode="tel" /></div>
          </div>
          <p className="mt-2 text-xs text-muted">{t("Usamos seu nome e WhatsApp só para confirmar o pedido. Não pedimos e-mail nem senha.")}</p>
        </section>

        <section className="rounded-[16px] border border-line bg-surface p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-ink">{t("Resumo do pedido")}</h2>
            <span className="rounded-full bg-grape/10 px-3 py-1 text-xs font-extrabold text-grape">{level}</span>
          </div>
          <div className="mt-3 max-h-60 space-y-2 overflow-y-auto text-sm">
            {cart.lines.map((l) => (
              <div key={`${l.productId}-${l.variant}`} className="flex justify-between gap-2">
                <span className="text-muted">{l.qty}x {l.name}{l.variant ? ` (${l.variant})` : ""}{l.boxes > 0 ? ` · ${l.boxes}📦` : ""}</span>
                <span className="tabular">{brl(l.lineTotalCents)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
            {cart.savingsCents > 0 && <div className="flex justify-between font-bold text-pix"><span>{t("Você economiza")}</span><span className="tabular">− {brl(cart.savingsCents)}</span></div>}
            <div className="flex justify-between border-t border-line pt-2 font-display text-xl font-extrabold text-ink"><span>{t("Total")}</span><span className="tabular">{brl(cart.subtotalCents)}</span></div>
          </div>
        </section>

        {err && <p className="text-sm font-semibold text-danger">{err}</p>}
        <button disabled={busy || !canSubmit} className="btn btn-primary w-full py-3.5 text-base disabled:opacity-50">{busy ? t("Enviando…") : t("Enviar pedido")}</button>
        <p className="text-center text-xs text-muted">{t("Sem pagamento online — combinamos o pagamento e a retirada/entrega pelo WhatsApp. 💬")}</p>
      </div>
    </form>
  );
}
