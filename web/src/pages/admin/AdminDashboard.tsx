import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { brl } from "../../lib/money";
import { useI18n } from "../../lib/i18n";

type Overview = {
  ordersTotal: number; pending: number; awaitingShipment: number;
  revenueCents: number; revenueMonthCents: number; avgTicketCents: number;
  retailCents: number; wholesaleCents: number;
  productsTotal: number; lowStock: number; outStock: number;
  customers: number; wholesalePending: number; reviewsPending: number;
};

export function AdminDashboard() {
  const { t } = useI18n();
  const [o, setO] = useState<Overview | null>(null);
  useEffect(() => {
    api.aGet<Overview>("/api/admin/overview").then(setO).catch(() => {});
  }, []);
  if (!o) return <p className="text-muted">{t("Carregando…")}</p>;

  const Card = ({ label, value, tone = "text-ink", sub }: { label: string; value: string; tone?: string; sub?: string }) => (
    <div className="rounded-[16px] border border-line bg-surface p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-1 font-display text-2xl font-extrabold tabular ${tone}`}>{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );

  return (
    <div>
      <h1 className="mb-4 font-display text-2xl font-extrabold text-ink">{t("Painel")}</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card label={t("Faturamento (pago)")} value={brl(o.revenueCents)} tone="text-pix" sub={t("Mês: {v}", { v: brl(o.revenueMonthCents) })} />
        <Card label={t("Pedidos")} value={String(o.ordersTotal)} sub={t("{n} aguardando pagamento", { n: o.pending })} />
        <Card label={t("Ticket médio")} value={brl(o.avgTicketCents)} />
        <Card label={t("A enviar")} value={String(o.awaitingShipment)} tone="text-warn" />
        <Card label={t("Varejo")} value={brl(o.retailCents)} />
        <Card label={t("Atacado")} value={brl(o.wholesaleCents)} tone="text-grape" />
        <Card label={t("Produtos")} value={String(o.productsTotal)} />
        <Card label={t("Clientes")} value={String(o.customers)} />
      </div>

      <h2 className="mb-2 mt-6 font-display text-lg font-extrabold text-ink">{t("Precisa de atenção")}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Alert to="/admin/produtos" label={t("Sem estoque")} n={o.outStock} tone="bg-danger/10 text-danger" />
        <Alert to="/admin/produtos" label={t("Estoque baixo")} n={o.lowStock} tone="bg-warn/10 text-warn" />
        <Alert to="/admin/atacado" label={t("Atacado pendente")} n={o.wholesalePending} tone="bg-grape/10 text-grape" />
        <Alert to="/admin/avaliacoes" label={t("Avaliações a aprovar")} n={o.reviewsPending} tone="bg-sky/10 text-sky" />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link to="/admin/produtos/novo" className="btn btn-primary px-5 py-2.5">{t("+ Novo produto")}</Link>
        <Link to="/admin/pedidos" className="btn btn-ghost px-5 py-2.5">{t("Ver pedidos")}</Link>
        <Link to="/admin/conteudo" className="btn btn-ghost px-5 py-2.5">{t("Editar loja")}</Link>
      </div>
    </div>
  );
}

function Alert({ to, label, n, tone }: { to: string; label: string; n: number; tone: string }) {
  return (
    <Link to={to} className="flex items-center justify-between rounded-[16px] border border-line bg-surface p-4">
      <span className="font-semibold text-ink">{label}</span>
      <span className={`grid h-9 min-w-9 place-items-center rounded-full px-2 font-extrabold ${tone}`}>{n}</span>
    </Link>
  );
}
