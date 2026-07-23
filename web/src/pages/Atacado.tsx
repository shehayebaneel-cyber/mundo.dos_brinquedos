import { Link } from "react-router-dom";
import { useStore, waLink } from "../lib/store";
import { useI18n } from "../lib/i18n";
import { brl } from "../lib/money";

export function Atacado() {
  const { settings } = useStore();
  const { t } = useI18n();
  const threshold = Number(settings.wholesaleThresholdCents ?? 30000);

  const levels = [
    ["🛒", t("Preço normal"), t("Para compras menores, de poucas unidades."), t("Menos de 10 itens no carrinho")],
    ["🔟", t("Preço de 10+ itens"), t("Comprou 10 unidades ou mais (misturando produtos)? O desconto entra sozinho."), t("10 ou mais itens no carrinho")],
    ["📦", t("Preço de atacado"), t("O melhor preço, ativado automaticamente quando o carrinho atinge o valor de atacado."), t("A partir de {min} no carrinho", { min: brl(threshold) })],
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* hero */}
      <section className="overflow-hidden rounded-[16px] bg-gradient-to-br from-ink to-grape p-6 text-white sm:p-8">
        <span className="inline-block rounded-full bg-sun px-3 py-1 text-xs font-extrabold text-ink">{t("📦 Atacado")}</span>
        <h1 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">{t("Preço de atacado para todos")}</h1>
        <p className="mt-2 max-w-xl text-white/85">{t("Sem cadastro e sem aprovação. Quanto mais você compra, melhor fica o preço — o desconto aparece sozinho no carrinho.")}</p>
      </section>

      {/* the three automatic levels */}
      <section className="mt-6 space-y-3">
        <h2 className="font-display text-lg font-extrabold text-ink">{t("Como funcionam os níveis de preço")}</h2>
        {levels.map(([icon, title, desc, when], i) => (
          <div key={i} className="flex gap-3 rounded-[16px] border border-line bg-surface p-4">
            <span className="text-3xl">{icon}</span>
            <div>
              <h3 className="font-display font-bold text-ink">{title}</h3>
              <p className="text-sm text-muted">{desc}</p>
              <span className="mt-1 inline-block rounded-full bg-grape/10 px-2.5 py-0.5 text-xs font-bold text-grape">{when}</span>
            </div>
          </div>
        ))}
      </section>

      {/* full boxes */}
      <section className="mt-4 rounded-[16px] border border-line bg-surface p-5">
        <h2 className="font-display font-bold text-ink">📦 {t("Caixas fechadas")}</h2>
        <p className="mt-1 text-sm text-muted">{t("Alguns produtos têm preço especial por caixa fechada. Ao adicionar uma caixa inteira, o preço da caixa é aplicado automaticamente — e o que passar da caixa entra no preço unitário do seu nível.")}</p>
      </section>

      {/* how to buy */}
      <section className="mt-4 rounded-[16px] border border-line bg-surface p-5">
        <h2 className="font-display font-bold text-ink">{t("É simples de comprar")}</h2>
        <ol className="mt-3 grid gap-3 sm:grid-cols-3">
          {[["1", t("Escolha os produtos"), t("Adicione tudo ao carrinho.")], ["2", t("O preço se ajusta"), t("O nível de atacado entra sozinho conforme o carrinho.")], ["3", t("Envie o pedido"), t("Entramos em contato pelo WhatsApp para combinar tudo.")]].map(([n, title, desc]) => (
            <li key={n} className="rounded-xl bg-surface-2 p-3">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-brand text-sm font-extrabold text-white">{n}</span>
              <h4 className="mt-2 font-bold text-ink">{title}</h4>
              <p className="text-sm text-muted">{desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA */}
      <section className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Link to="/produtos" className="btn btn-primary flex-1 py-3.5 text-base">{t("Ver produtos")}</Link>
        <a href={waLink(settings.whatsapp ?? "", "Olá! Quero comprar no atacado.")} target="_blank" rel="noreferrer" className="btn flex-1 bg-[#25d366] py-3.5 text-base text-white">💬 {t("Falar no WhatsApp")}</a>
      </section>
    </div>
  );
}
