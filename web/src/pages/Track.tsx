import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { brl } from "../lib/money";
import type { Order } from "../lib/types";

const FLOW = [
  ["recebido", "Pedido recebido", "📥"],
  ["aguardando_pagamento", "Aguardando pagamento", "⏳"],
  ["pago", "Pagamento confirmado", "✅"],
  ["em_separacao", "Em separação", "📦"],
  ["embalado", "Embalado", "🎁"],
  ["enviado", "Enviado", "🚚"],
  ["saiu_entrega", "Saiu para entrega", "🛵"],
  ["entregue", "Entregue", "🏠"],
] as const;

export const STATUS_LABEL: Record<string, string> = {
  ...Object.fromEntries(FLOW.map(([k, l]) => [k, l])),
  cancelado: "Cancelado",
  reembolsado: "Reembolsado",
};

export function Track() {
  const { t } = useI18n();
  const [sp] = useSearchParams();
  const [code, setCode] = useState(sp.get("code") ?? "");
  const [contact, setContact] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function lookup(e?: React.FormEvent) {
    e?.preventDefault();
    setErr("");
    setBusy(true);
    try {
      setOrder(await api.get<Order>(`/api/track?code=${encodeURIComponent(code)}&contact=${encodeURIComponent(contact)}`));
    } catch (e) {
      setOrder(null);
      setErr(e instanceof Error ? e.message : "Pedido não encontrado.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (sp.get("code")) lookup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeIdx = order ? FLOW.findIndex(([k]) => k === order.status) : -1;
  const cancelled = order && ["cancelado", "reembolsado"].includes(order.status);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="font-display text-2xl font-extrabold text-ink">{t("Rastrear pedido")}</h1>
      <form onSubmit={lookup} className="mt-3 rounded-[16px] border border-line bg-surface p-4">
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder={t("Nº do pedido (MDB-2026-0001)")} className="rounded-lg border border-line px-3 py-2.5 text-sm" />
          <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder={t("E-mail ou telefone")} className="rounded-lg border border-line px-3 py-2.5 text-sm" />
          <button disabled={busy} className="btn btn-primary px-5 py-2.5">{busy ? "…" : t("Buscar")}</button>
        </div>
        {err && <p className="mt-2 text-sm font-semibold text-danger">{err}</p>}
      </form>

      {order && (
        <div className="mt-4 rounded-[16px] border border-line bg-surface p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-ink">{order.code}</span>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${cancelled ? "bg-danger/10 text-danger" : "bg-pix/10 text-pix"}`}>{t(STATUS_LABEL[order.status])}</span>
          </div>

          {cancelled ? (
            <p className="mt-4 rounded-xl bg-danger/5 p-4 text-center text-sm font-semibold text-danger">{t("Este pedido foi {status}.", { status: t(STATUS_LABEL[order.status]).toLowerCase() })}</p>
          ) : (
            <ol className="mt-4 space-y-0">
              {FLOW.map(([k, label, icon], i) => {
                const done = i <= activeIdx;
                return (
                  <li key={k} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className={`grid h-8 w-8 place-items-center rounded-full text-sm ${done ? "bg-brand text-white" : "bg-surface-2 text-muted"}`}>{done ? icon : "○"}</span>
                      {i < FLOW.length - 1 && <span className={`h-6 w-0.5 ${i < activeIdx ? "bg-brand" : "bg-line"}`} />}
                    </div>
                    <span className={`pt-1 text-sm ${done ? "font-bold text-ink" : "text-muted"}`}>{t(label)}</span>
                  </li>
                );
              })}
            </ol>
          )}

          {order.trackingCode && <p className="mt-3 text-sm">{t("Código de rastreio:")} <b>{order.trackingCode}</b></p>}
          <div className="mt-3 border-t border-line pt-3 text-sm text-muted">
            {order.items.length} {order.items.length === 1 ? t("item") : t("itens")} · Total <b className="text-ink tabular">{brl(order.totalCents)}</b> · {t("Entrega em")} {order.city}-{order.state}
          </div>
        </div>
      )}
    </div>
  );
}
