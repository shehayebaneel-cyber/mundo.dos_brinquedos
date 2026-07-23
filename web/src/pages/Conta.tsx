import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { brl } from "../lib/money";
import { getAccount, setAccount, clearAccount, digits, type Account } from "../lib/account";
import { STATUS_LABEL } from "../lib/orders";
import type { Order } from "../lib/types";
import { Spinner } from "../components/ui";

export function Conta() {
  const { t } = useI18n();
  const [acc, setAcc] = useState<Account | null>(getAccount());
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    if (!acc) { setOrders(null); return; }
    setOrders(null);
    api.get<{ orders: Order[] }>(`/api/orders/by-phone?phone=${encodeURIComponent(acc.phone)}`)
      .then((r) => setOrders(r.orders))
      .catch(() => setOrders([]));
  }, [acc?.phone]);

  function login(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (name.trim().length < 2 || digits(phone).length < 10) { setErr(t("Informe seu nome e WhatsApp.")); return; }
    const a = { name: name.trim(), phone: phone.trim() };
    setAccount(a); setAcc(a);
  }

  function logout() { clearAccount(); setAcc(null); setName(""); setPhone(""); }

  const input = "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand";
  const lbl = "mb-1 block text-xs font-bold text-muted";

  if (!acc) {
    return (
      <form onSubmit={login} className="mx-auto max-w-md px-4 py-8">
        <p className="text-center text-5xl">👋</p>
        <h1 className="mt-2 text-center font-display text-2xl font-extrabold text-ink">{t("Minha conta")}</h1>
        <p className="mt-1 text-center text-sm text-muted">{t("Entre com seu nome e WhatsApp para ver seus pedidos.")}</p>
        <div className="mt-5 grid gap-3 rounded-[16px] border border-line bg-surface p-4">
          <div><label className={lbl}>{t("Nome completo *")}</label><input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder={t("Seu nome")} /></div>
          <div><label className={lbl}>{t("WhatsApp *")}</label><input className={input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(62) 9 9999-9999" inputMode="tel" /></div>
          {err && <p className="text-sm font-semibold text-danger">{err}</p>}
          <button className="btn btn-primary w-full py-3">{t("Entrar")}</button>
          <p className="text-center text-xs text-muted">{t("Sem e-mail e sem senha — só nome e WhatsApp.")}</p>
        </div>
      </form>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="flex items-start justify-between gap-3 rounded-[16px] border border-line bg-surface p-4">
        <div>
          <p className="font-display text-xl font-extrabold text-ink">{acc.name}</p>
          <p className="text-sm text-muted">{acc.phone}</p>
        </div>
        <button onClick={logout} className="btn btn-ghost px-3 py-1.5 text-sm">{t("Sair")}</button>
      </div>

      <h2 className="mt-6 font-display text-lg font-bold text-ink">{t("Meus pedidos")}</h2>
      {orders === null ? (
        <Spinner label={t("Carregando pedidos…")} />
      ) : orders.length === 0 ? (
        <div className="mt-3 rounded-[16px] border border-dashed border-line bg-surface p-6 text-center">
          <p className="text-4xl">🧸</p>
          <p className="mt-2 text-sm text-muted">{t("Você ainda não fez pedidos.")}</p>
          <Link to="/produtos" className="btn btn-primary mt-3 px-6 py-2.5">{t("Ver produtos")}</Link>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="rounded-[16px] border border-line bg-surface p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm font-bold text-ink">{o.code}</span>
                <span className="rounded-full bg-grape/10 px-3 py-1 text-xs font-extrabold text-grape">{STATUS_LABEL[o.status] ?? o.status}</span>
              </div>
              <p className="mt-1 text-xs text-muted">{new Date(o.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
              <div className="mt-2 text-sm text-muted">{o.items.map((it) => `${it.qty}x ${it.name}`).join(" · ")}</div>
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                <span className="font-display text-lg font-extrabold text-ink">{brl(o.totalCents)}</span>
                <Link to={`/pedido/${o.code}`} className="btn btn-ghost px-3 py-1.5 text-sm">{t("Ver pedido")}</Link>
              </div>
            </div>
          ))}
          <Link to="/produtos" className="btn btn-primary mt-2 w-full py-3">{t("Pedir novamente")}</Link>
        </div>
      )}
    </div>
  );
}
