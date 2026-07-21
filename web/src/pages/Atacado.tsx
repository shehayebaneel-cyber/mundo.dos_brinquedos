import { useState } from "react";
import { useStore, waLink } from "../lib/store";
import { useI18n } from "../lib/i18n";
import { brl } from "../lib/money";

export function Atacado() {
  const { settings } = useStore();
  const { t } = useI18n();
  const min = Number(settings.wholesaleMinOrderCents ?? 30000);
  const [sent, setSent] = useState(false);
  const [f, setF] = useState({
    name: "", businessName: "", email: "", phone: "", cpfCnpj: "", stateReg: "",
    address: "", city: "", state: "", instagram: "", type: "", volume: "",
  });
  const set = (k: string, v: string) => setF((c) => ({ ...c, [k]: v }));
  const input = "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand";
  const lbl = "mb-1 block text-xs font-bold text-muted";

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* hero */}
      <section className="overflow-hidden rounded-[16px] bg-gradient-to-br from-ink to-grape p-6 text-white sm:p-8">
        <span className="inline-block rounded-full bg-sun px-3 py-1 text-xs font-extrabold text-ink">{t("📦 Atacado")}</span>
        <h1 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">{t("Compre no atacado e revenda com lucro")}</h1>
        <p className="mt-2 max-w-xl text-white/85">{t("Preços especiais para lojistas e revendedores. Pedido mínimo de {min}.", { min: brl(min) })}</p>
      </section>

      {/* benefits */}
      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["🏷️", "Preços de atacado", "Margens que cabem na sua revenda."],
          ["📦", "Caixas fechadas", "Compre por embalagem com preço reduzido."],
          ["🚚", "Entrega nacional", "Enviamos para todo o Brasil."],
          ["💳", "Pix e boleto", "Condições facilitadas para lojistas."],
        ].map(([i, title, desc]) => (
          <div key={title} className="rounded-[16px] border border-line bg-surface p-4">
            <span className="text-2xl">{i}</span>
            <h3 className="mt-1 font-display font-bold text-ink">{t(title)}</h3>
            <p className="text-sm text-muted">{t(desc)}</p>
          </div>
        ))}
      </section>

      {/* how it works */}
      <section className="mt-6 rounded-[16px] border border-line bg-surface p-5">
        <h2 className="font-display text-lg font-extrabold text-ink">{t("Como funciona")}</h2>
        <ol className="mt-3 grid gap-3 sm:grid-cols-3">
          {[["1", "Cadastre-se", "Preencha o formulário com os dados da sua empresa."], ["2", "Aprovação", "Analisamos e liberamos seu acesso atacado."], ["3", "Compre com preço de atacado", "Preços e mínimos especiais aparecem para você."]].map(([n, title, desc]) => (
            <li key={n} className="rounded-xl bg-surface-2 p-3">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-brand text-sm font-extrabold text-white">{n}</span>
              <h4 className="mt-2 font-bold text-ink">{t(title)}</h4>
              <p className="text-sm text-muted">{t(desc)}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* form */}
      <section className="mt-6 rounded-[16px] border border-line bg-surface p-5">
        <h2 className="font-display text-lg font-extrabold text-ink">{t("Criar conta atacado")}</h2>
        {sent ? (
          <div className="mt-3 rounded-xl bg-pix/5 p-6 text-center">
            <p className="text-4xl">🎉</p>
            <p className="mt-2 font-display text-lg font-bold text-ink">{t("Cadastro enviado!")}</p>
            <p className="mt-1 text-sm text-muted">{t("Sua conta ficará pendente até a aprovação da nossa equipe. Você receberá um retorno em breve.")}</p>
            <a href={waLink(settings.whatsapp ?? "", "Olá! Acabei de me cadastrar como atacado.")} target="_blank" rel="noreferrer" className="btn mt-4 border border-[#25d366] px-5 py-2.5 text-[#128c4a]">{t("💬 Falar com o atacado")}</a>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="mt-3 grid gap-3 sm:grid-cols-2">
            <div><label className={lbl}>{t("Nome completo *")}</label><input required className={input} value={f.name} onChange={(e) => set("name", e.target.value)} /></div>
            <div><label className={lbl}>{t("Nome da empresa *")}</label><input required className={input} value={f.businessName} onChange={(e) => set("businessName", e.target.value)} /></div>
            <div><label className={lbl}>{t("E-mail")} *</label><input required type="email" className={input} value={f.email} onChange={(e) => set("email", e.target.value)} /></div>
            <div><label className={lbl}>{t("WhatsApp *")}</label><input required className={input} value={f.phone} onChange={(e) => set("phone", e.target.value)} /></div>
            <div><label className={lbl}>{t("CPF / CNPJ *")}</label><input required className={input} value={f.cpfCnpj} onChange={(e) => set("cpfCnpj", e.target.value)} /></div>
            <div><label className={lbl}>{t("Inscrição estadual")}</label><input className={input} value={f.stateReg} onChange={(e) => set("stateReg", e.target.value)} /></div>
            <div className="sm:col-span-2"><label className={lbl}>{t("Endereço da empresa")}</label><input className={input} value={f.address} onChange={(e) => set("address", e.target.value)} /></div>
            <div><label className={lbl}>{t("Cidade *")}</label><input required className={input} value={f.city} onChange={(e) => set("city", e.target.value)} /></div>
            <div><label className={lbl}>{t("Estado *")}</label><input required className={input} value={f.state} onChange={(e) => set("state", e.target.value)} maxLength={2} /></div>
            <div><label className={lbl}>{t("Instagram / site")}</label><input className={input} value={f.instagram} onChange={(e) => set("instagram", e.target.value)} /></div>
            <div>
              <label className={lbl}>{t("Tipo de negócio")}</label>
              <select className={input} value={f.type} onChange={(e) => set("type", e.target.value)}>
                <option value="">{t("Selecione…")}</option>
                <option>{t("Loja física")}</option><option>{t("Loja online")}</option><option>{t("Revenda / sacoleira")}</option><option>{t("Distribuidora")}</option><option>{t("Outro")}</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={lbl}>{t("Volume de compra esperado")}</label>
              <select className={input} value={f.volume} onChange={(e) => set("volume", e.target.value)}>
                <option value="">{t("Selecione…")}</option>
                <option>Até R$ 1.000/mês</option><option>R$ 1.000 a R$ 5.000/mês</option><option>R$ 5.000 a R$ 20.000/mês</option><option>Acima de R$ 20.000/mês</option>
              </select>
            </div>
            <button className="btn btn-primary sm:col-span-2 py-3">{t("Enviar cadastro")}</button>
          </form>
        )}
      </section>
    </div>
  );
}
