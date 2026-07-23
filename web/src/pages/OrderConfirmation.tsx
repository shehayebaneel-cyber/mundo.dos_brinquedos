import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { useStore, waLink } from "../lib/store";
import { useI18n } from "../lib/i18n";
import { brl } from "../lib/money";
import type { Order } from "../lib/types";
import { Spinner } from "../components/ui";

export function OrderConfirmation() {
  const { code } = useParams();
  const location = useLocation();
  const { settings } = useStore();
  const { t } = useI18n();
  const passed = (location.state as { order?: Order } | null)?.order;
  const [order, setOrder] = useState<Order | null>(passed ?? null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (order) return;
    api.get<Order>(`/api/track?code=${code}`).then(setOrder).catch(() => setNotFound(true));
  }, [code]);

  if (notFound) return <div className="mx-auto max-w-md px-4 py-16 text-center"><p className="text-5xl">🤔</p><p className="mt-2 font-display text-xl font-bold text-ink">{t("Pedido não encontrado")}</p><Link to="/" className="btn btn-primary mt-4 px-6 py-3">{t("Voltar à loja")}</Link></div>;
  if (!order) return <Spinner label={t("Carregando pedido…")} />;

  const wa = waLink(settings.whatsapp ?? "", `Olá! Acabei de enviar o pedido ${order.code}. Meu nome é ${order.customerName}.`);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="rounded-[20px] bg-gradient-to-br from-pix to-mint p-6 text-center text-white">
        <p className="text-5xl">🎉</p>
        <h1 className="mt-2 font-display text-2xl font-extrabold">{t("Pedido recebido com sucesso!")}</h1>
        <p className="mt-2 text-white/95">{t("Entraremos em contato pelo WhatsApp para confirmar os detalhes do seu pedido.")}</p>
        <p className="mt-3 inline-block rounded-full bg-white/20 px-4 py-1.5 font-mono font-bold">{order.code}</p>
      </div>

      <a href={wa} target="_blank" rel="noreferrer" className="btn mt-4 w-full bg-[#25d366] py-3.5 text-base text-white">💬 {t("Falar com a loja no WhatsApp")}</a>

      <div className="mt-4 rounded-[16px] border border-line bg-surface p-4">
        <h2 className="font-display font-bold text-ink">{t("Itens")}</h2>
        <div className="mt-2 divide-y divide-line text-sm">
          {order.items.map((it) => (
            <div key={it.id} className="flex justify-between py-2"><span>{it.qty}x {it.name}{it.variant ? ` (${it.variant})` : ""}</span><span className="tabular">{brl(it.priceCents * it.qty)}</span></div>
          ))}
        </div>
        <div className="mt-3 flex justify-between border-t border-line pt-3 font-display text-lg font-extrabold text-ink"><span>{t("Total")}</span><span className="tabular">{brl(order.totalCents)}</span></div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Link to="/conta" className="btn btn-ghost flex-1 py-3">{t("Meus pedidos")}</Link>
        <Link to="/produtos" className="btn btn-primary flex-1 py-3">{t("Continuar comprando")}</Link>
      </div>
    </div>
  );
}
