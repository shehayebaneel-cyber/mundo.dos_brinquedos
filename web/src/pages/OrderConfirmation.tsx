import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { useStore, waLink } from "../lib/store";
import { brl } from "../lib/money";
import type { Order } from "../lib/types";
import { Spinner } from "../components/ui";

export function OrderConfirmation() {
  const { code } = useParams();
  const location = useLocation();
  const { settings } = useStore();
  const passed = (location.state as { order?: Order } | null)?.order;
  const [order, setOrder] = useState<Order | null>(passed ?? null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (order) return;
    api.get<Order>(`/api/track?code=${code}`).then(setOrder).catch(() => setNotFound(true));
  }, [code]);

  if (notFound) return <div className="mx-auto max-w-md px-4 py-16 text-center"><p className="text-5xl">🤔</p><p className="mt-2 font-display text-xl font-bold text-ink">Pedido não encontrado</p><Link to="/" className="btn btn-primary mt-4 px-6 py-3">Voltar à loja</Link></div>;
  if (!order) return <Spinner label="Carregando pedido…" />;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="rounded-[16px] bg-gradient-to-br from-mint to-sky p-6 text-center text-white">
        <p className="text-5xl">🎉</p>
        <h1 className="mt-2 font-display text-2xl font-extrabold">Pedido confirmado!</h1>
        <p className="mt-1 text-white/90">Obrigado, {order.customerName.split(" ")[0]}! Recebemos seu pedido.</p>
        <p className="mt-3 inline-block rounded-full bg-white/20 px-4 py-1.5 font-mono font-bold">{order.code}</p>
      </div>

      {order.paymentMethod === "pix" && order.paymentStatus === "pendente" && (
        <div className="mt-4 rounded-[16px] border border-pix/40 bg-pix/5 p-4 text-center">
          <p className="font-bold text-pix">💠 Pague com Pix para liberar seu pedido</p>
          <div className="mx-auto mt-3 grid h-40 w-40 place-items-center rounded-xl bg-white text-6xl shadow-inner">▪️</div>
          <p className="mt-2 text-xs text-muted">Escaneie o QR Code no app do seu banco. (No site real, o Pix é gerado pelo Mercado Pago.)</p>
        </div>
      )}
      {order.paymentMethod === "boleto" && (
        <div className="mt-4 rounded-[16px] border border-line bg-surface p-4 text-center text-sm">
          🧾 Seu boleto foi gerado e enviado por e-mail. Vence em 3 dias úteis.
        </div>
      )}

      <div className="mt-4 rounded-[16px] border border-line bg-surface p-4">
        <h2 className="font-display font-bold text-ink">Itens</h2>
        <div className="mt-2 divide-y divide-line text-sm">
          {order.items.map((it) => (
            <div key={it.id} className="flex justify-between py-2"><span>{it.qty}x {it.name}{it.variant ? ` (${it.variant})` : ""}</span><span className="tabular">{brl(it.priceCents * it.qty)}</span></div>
          ))}
        </div>
        <div className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
          <div className="flex justify-between"><span className="text-muted">Subtotal</span><span className="tabular">{brl(order.subtotalCents)}</span></div>
          {order.discountCents > 0 && <div className="flex justify-between text-pix"><span>Desconto</span><span className="tabular">- {brl(order.discountCents)}</span></div>}
          <div className="flex justify-between"><span className="text-muted">Frete</span><span className="tabular">{order.shippingCents === 0 ? "Grátis" : brl(order.shippingCents)}</span></div>
          <div className="flex justify-between font-display text-lg font-extrabold text-ink"><span>Total</span><span className="tabular">{brl(order.totalCents)}</span></div>
        </div>
      </div>

      <div className="mt-4 rounded-[16px] border border-line bg-surface p-4 text-sm">
        <h2 className="font-display font-bold text-ink">Entrega</h2>
        <p className="mt-1 text-muted">{order.address}</p>
        <p className="text-muted">{order.city} - {order.state} · CEP {order.cep}</p>
        <p className="mt-1 text-ink">Previsão: 5 a 9 dias úteis após a confirmação do pagamento.</p>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Link to={`/rastrear?code=${order.code}`} className="btn btn-primary flex-1 py-3">Acompanhar pedido</Link>
        <a href={waLink(settings.whatsapp ?? "", `Olá! Fiz o pedido ${order.code} e gostaria de mais informações.`)} target="_blank" rel="noreferrer" className="btn flex-1 border border-[#25d366] py-3 text-[#128c4a]">💬 Falar no WhatsApp</a>
      </div>
      <Link to="/produtos" className="btn btn-ghost mt-2 w-full py-2.5 text-sm">Continuar comprando</Link>
    </div>
  );
}
