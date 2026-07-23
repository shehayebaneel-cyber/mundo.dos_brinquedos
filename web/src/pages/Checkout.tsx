import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../lib/cart";
import { api } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { brl, pixCents } from "../lib/money";
import type { Order } from "../lib/types";

const SHIP = [
  { id: "pac", label: "PAC (Correios)", cents: 2490, days: "5 a 9 dias úteis" },
  { id: "sedex", label: "SEDEX (Correios)", cents: 3990, days: "2 a 4 dias úteis" },
  { id: "retirada", label: "Retirar na loja (Goiânia)", cents: 0, days: "Pronto em 2h" },
];

export function Checkout() {
  const cart = useCart();
  const nav = useNavigate();
  const { t } = useI18n();
  const [f, setF] = useState({
    name: "", email: "", cpfCnpj: "", phone: "",
    cep: "", address: "", number: "", complement: "", neighbourhood: "", city: "", state: "",
  });
  const [shipId, setShipId] = useState("pac");
  const [pay, setPay] = useState("pix");
  const [agree, setAgree] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => setF((cur) => ({ ...cur, [k]: v }));

  const ship = SHIP.find((s) => s.id === shipId)!;
  const freeMin = 19900;
  const shippingCents = cart.subtotalCents >= freeMin && shipId !== "sedex" ? 0 : ship.cents;
  const pixDiscount = pay === "pix" ? cart.subtotalCents - pixCents(cart.subtotalCents, 10) : 0;
  const total = cart.subtotalCents - pixDiscount + shippingCents;

  function onCep(v: string) {
    set("cep", v);
    if (v.replace(/\D/g, "").length === 8) {
      set("city", "Goiânia");
      set("state", "GO");
      set("neighbourhood", f.neighbourhood || "Setor Central");
    }
  }

  const canSubmit = useMemo(
    () => f.name && f.phone && f.cep && f.address && f.city && f.state && agree && cart.lines.length > 0,
    [f, agree, cart.lines.length],
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!canSubmit) {
      setErr(t("Preencha os campos obrigatórios e aceite os termos."));
      return;
    }
    setBusy(true);
    try {
      const order = await api.post<Order>("/api/orders", {
        name: f.name, email: f.email, phone: f.phone, cpfCnpj: f.cpfCnpj,
        cep: f.cep, address: `${f.address}, ${f.number} ${f.complement} - ${f.neighbourhood}`.trim(),
        city: f.city, state: f.state, paymentMethod: pay,
        shippingCents, discountCents: pixDiscount,
        items: cart.lines.map((l) => ({ productId: l.productId, qty: l.qty, variant: l.variant })),
      });
      cart.clear();
      nav(`/pedido/${order.code}`, { state: { order } });
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("Não foi possível finalizar o pedido."));
    } finally {
      setBusy(false);
    }
  }

  if (cart.lines.length === 0) {
    return <div className="mx-auto max-w-md px-4 py-16 text-center"><p className="text-5xl">🛒</p><p className="mt-2 font-display text-xl font-bold text-ink">{t("Carrinho vazio")}</p></div>;
  }

  const input = "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand";
  const lbl = "mb-1 block text-xs font-bold text-muted";

  return (
    <form onSubmit={submit} className="mx-auto max-w-6xl px-4 py-5">
      <h1 className="mb-4 font-display text-2xl font-extrabold text-ink">{t("Finalizar compra")}</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <section className="rounded-[16px] border border-line bg-surface p-4">
            <h2 className="font-display font-bold text-ink">{t("1 · Seus dados")}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2"><label className={lbl}>{t("Nome completo *")}</label><input className={input} value={f.name} onChange={(e) => set("name", e.target.value)} /></div>
              <div><label className={lbl}>{t("E-mail")}</label><input type="email" className={input} value={f.email} onChange={(e) => set("email", e.target.value)} /></div>
              <div><label className={lbl}>{t("CPF / CNPJ")}</label><input className={input} value={f.cpfCnpj} onChange={(e) => set("cpfCnpj", e.target.value)} /></div>
              <div className="sm:col-span-2"><label className={lbl}>{t("WhatsApp / telefone *")}</label><input className={input} value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(62) 9 9999-9999" /></div>
            </div>
          </section>

          <section className="rounded-[16px] border border-line bg-surface p-4">
            <h2 className="font-display font-bold text-ink">{t("2 · Endereço de entrega")}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-6">
              <div className="sm:col-span-2"><label className={lbl}>{t("CEP *")}</label><input className={input} value={f.cep} onChange={(e) => onCep(e.target.value)} placeholder="00000-000" /></div>
              <div className="sm:col-span-4"><label className={lbl}>{t("Rua *")}</label><input className={input} value={f.address} onChange={(e) => set("address", e.target.value)} /></div>
              <div className="sm:col-span-2"><label className={lbl}>{t("Número")}</label><input className={input} value={f.number} onChange={(e) => set("number", e.target.value)} /></div>
              <div className="sm:col-span-4"><label className={lbl}>{t("Complemento")}</label><input className={input} value={f.complement} onChange={(e) => set("complement", e.target.value)} /></div>
              <div className="sm:col-span-2"><label className={lbl}>{t("Bairro")}</label><input className={input} value={f.neighbourhood} onChange={(e) => set("neighbourhood", e.target.value)} /></div>
              <div className="sm:col-span-3"><label className={lbl}>{t("Cidade *")}</label><input className={input} value={f.city} onChange={(e) => set("city", e.target.value)} /></div>
              <div className="sm:col-span-1"><label className={lbl}>{t("UF *")}</label><input className={input} value={f.state} onChange={(e) => set("state", e.target.value)} maxLength={2} /></div>
            </div>
          </section>

          <section className="rounded-[16px] border border-line bg-surface p-4">
            <h2 className="font-display font-bold text-ink">{t("3 · Entrega")}</h2>
            <div className="mt-3 space-y-2">
              {SHIP.map((s) => {
                const cents = cart.subtotalCents >= freeMin && s.id !== "sedex" ? 0 : s.cents;
                return (
                  <label key={s.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${shipId === s.id ? "border-brand bg-brand-soft/40" : "border-line"}`}>
                    <input type="radio" name="ship" checked={shipId === s.id} onChange={() => setShipId(s.id)} className="accent-brand" />
                    <span className="flex-1 text-sm"><b>{t(s.label)}</b><span className="block text-xs text-muted">{t(s.days)}</span></span>
                    <span className="font-bold tabular">{cents === 0 ? t("Grátis") : brl(cents)}</span>
                  </label>
                );
              })}
            </div>
          </section>

          <section className="rounded-[16px] border border-line bg-surface p-4">
            <h2 className="font-display font-bold text-ink">{t("4 · Pagamento")}</h2>
            <div className="mt-3 space-y-2">
              {[["pix", "💠 Pix", "10% de desconto · aprovação na hora"], ["cartao", "💳 Cartão de crédito", "em até 12x sem juros"], ["boleto", "🧾 Boleto bancário", "vence em 3 dias úteis"]].map(([id, label, note]) => (
                <label key={id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${pay === id ? "border-brand bg-brand-soft/40" : "border-line"}`}>
                  <input type="radio" name="pay" checked={pay === id} onChange={() => setPay(id)} className="accent-brand" />
                  <span className="text-sm"><b>{t(label)}</b><span className="block text-xs text-muted">{t(note)}</span></span>
                </label>
              ))}
            </div>
          </section>
        </div>

        {/* SUMMARY */}
        <aside className="h-fit rounded-[16px] border border-line bg-surface p-4 lg:sticky lg:top-40">
          <h2 className="font-display font-bold text-ink">{t("Resumo do pedido")}</h2>
          <div className="mt-3 max-h-48 space-y-2 overflow-y-auto text-sm">
            {cart.lines.map((l) => (
              <div key={`${l.productId}-${l.variant}`} className="flex justify-between gap-2">
                <span className="text-muted">{l.qty}x {l.name}{l.variant ? ` (${l.variant})` : ""}{l.boxes > 0 ? ` · ${l.boxes}📦` : ""}</span>
                <span className="tabular">{brl(l.lineTotalCents)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
            <div className="flex justify-between"><span className="text-muted">{t("Subtotal")}</span><span className="tabular">{brl(cart.subtotalCents)}</span></div>
            {pixDiscount > 0 && <div className="flex justify-between text-pix"><span>{t("Desconto Pix (10%)")}</span><span className="tabular">- {brl(pixDiscount)}</span></div>}
            <div className="flex justify-between"><span className="text-muted">{t("Frete")}</span><span className="tabular">{shippingCents === 0 ? t("Grátis") : brl(shippingCents)}</span></div>
          </div>
          <div className="mt-3 flex justify-between border-t border-line pt-3 font-display text-xl font-extrabold text-ink"><span>{t("Total")}</span><span className="tabular">{brl(total)}</span></div>

          <label className="mt-4 flex items-start gap-2 text-xs text-muted">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 accent-brand" />
            <span>{t("Li e aceito os")} <a href="/termos" className="text-brand-dark underline">{t("Termos")}</a> {t("e a")} <a href="/privacidade" className="text-brand-dark underline">{t("Política de Privacidade")}</a>.</span>
          </label>
          {err && <p className="mt-2 text-sm font-semibold text-danger">{err}</p>}
          <button disabled={busy || !canSubmit} className="btn btn-primary mt-3 w-full py-3 disabled:opacity-50">{busy ? t("Processando…") : t("Pagar {total}", { total: brl(total) })}</button>
          <p className="mt-2 text-center text-[11px] text-muted">{t("🔒 Ambiente seguro · seus dados protegidos")}</p>
        </aside>
      </div>
    </form>
  );
}
