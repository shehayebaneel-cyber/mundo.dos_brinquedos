import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { brl } from "../../lib/money";
import type { Order } from "../../lib/types";
import { ORDER_STATUSES, STATUS_LABEL } from "../../lib/orders";
import { useStore, waLink } from "../../lib/store";
import { useI18n } from "../../lib/i18n";

const tone = (s: string) =>
  s === "concluido" || s === "confirmado" ? "bg-pix/10 text-pix"
  : s === "cancelado" ? "bg-danger/10 text-danger"
  : s === "recebido" ? "bg-warn/10 text-warn"
  : "bg-sky/10 text-sky";

const levelLabel = (o: Order) =>
  o.kind === "atacado" ? "Atacado" : o.subtotalCents >= 30000 ? "Atacado" : "";

export function AdminOrders() {
  const { t } = useI18n();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("");
  const [open, setOpen] = useState<Order | null>(null);
  const { settings } = useStore();

  const load = () => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (filter) p.set("status", filter);
    return api.aGet<Order[]>(`/api/admin/orders?${p}`).then(setOrders);
  };
  useEffect(() => { load(); }, [q, filter]);

  async function update(o: Order, data: Partial<Order>) {
    const upd = await api.aPatch<Order>(`/api/admin/orders/${o.id}`, data);
    setOpen(upd);
    load();
  }

  if (!orders) return <p className="text-muted">{t("Carregando…")}</p>;

  return (
    <div>
      <h1 className="mb-4 font-display text-2xl font-extrabold text-ink">{t("Pedidos")}</h1>
      <div className="mb-3 flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Buscar por nº, nome, telefone…")} className="flex-1 rounded-full border border-line bg-surface px-4 py-2 text-sm" />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-full border border-line bg-surface px-4 py-2 text-sm">
          <option value="">{t("Todos os status")}</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{t(STATUS_LABEL[s])}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto rounded-[16px] border border-line bg-surface">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-line bg-surface-2 text-left text-xs uppercase text-muted">
            <tr><th className="p-3">{t("Pedido")}</th><th className="p-3">{t("Cliente")}</th><th className="p-3">WhatsApp</th><th className="p-3">{t("Total")}</th><th className="p-3">{t("Nível")}</th><th className="p-3">{t("Status")}</th></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} onClick={() => setOpen(o)} className="cursor-pointer border-b border-line last:border-0 hover:bg-surface-2">
                <td className="p-3"><div className="font-mono font-bold text-ink">{o.code}</div><div className="text-xs text-muted">{new Date(o.createdAt).toLocaleDateString(t("pt-BR"))}</div></td>
                <td className="p-3">{o.customerName}</td>
                <td className="p-3 tabular text-muted">{o.customerPhone}</td>
                <td className="p-3 font-bold tabular">{brl(o.totalCents)}</td>
                <td className="p-3">{levelLabel(o) && <span className="rounded-full bg-grape/10 px-2 py-0.5 text-[11px] font-bold text-grape">📦 {levelLabel(o)}</span>}</td>
                <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${tone(o.status)}`}>{t(STATUS_LABEL[o.status] ?? o.status)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={() => setOpen(null)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-surface p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-lg font-bold text-ink">{open.code}</span>
              <button onClick={() => setOpen(null)} className="text-xl">✕</button>
            </div>
            <p className="mt-1 text-sm text-muted">{new Date(open.createdAt).toLocaleString(t("pt-BR"))}</p>

            <div className="mt-3 rounded-xl bg-surface-2 p-3 text-sm">
              <b>{open.customerName}</b><br />
              📱 {open.customerPhone}
              {levelLabel(open) && <><br />📦 {t("Nível de preço")}: <b>{levelLabel(open)}</b></>}
            </div>

            <div className="mt-3 divide-y divide-line text-sm">
              {open.items.map((it) => (
                <div key={it.id} className="flex justify-between py-1.5"><span>{it.qty}x {it.name}{it.variant ? ` (${it.variant})` : ""}</span><span className="tabular">{brl(it.priceCents * it.qty)}</span></div>
              ))}
            </div>
            <div className="mt-2 flex justify-between border-t border-line pt-2 font-display font-extrabold text-ink"><span>{t("Total")}</span><span className="tabular">{brl(open.totalCents)}</span></div>

            <div className="mt-4">
              <label className="mb-1 block text-xs font-bold text-muted">{t("Status do pedido")}</label>
              <select value={open.status} onChange={(e) => update(open, { status: e.target.value })} className="w-full rounded-lg border border-line px-3 py-2 text-sm">
                {ORDER_STATUSES.map((s) => <option key={s} value={s}>{t(STATUS_LABEL[s])}</option>)}
              </select>
            </div>

            <a href={waLink(open.customerPhone || settings.whatsapp || "", `Olá ${open.customerName.split(" ")[0]}! Sobre seu pedido ${open.code}:`)} target="_blank" rel="noreferrer" className="btn mt-3 w-full bg-[#25d366] py-2.5 text-white">{t("💬 Falar com o cliente")}</a>
          </div>
        </div>
      )}
    </div>
  );
}
