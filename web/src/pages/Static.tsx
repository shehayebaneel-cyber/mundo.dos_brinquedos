import { useState } from "react";
import { Link } from "react-router-dom";
import { useStore, waLink } from "../lib/store";
import { useI18n } from "../lib/i18n";

export function Sobre() {
  const { settings } = useStore();
  const { t, lang } = useI18n();
  const bodyPt = [
    "A Mundo dos Brinquedos e Variedades nasceu em Goiânia com um propósito simples: levar diversão de qualidade para as crianças de todo o Brasil, com preço justo tanto para as famílias quanto para os lojistas.",
    "Somos referência em varejo e atacado, com uma seleção cuidadosa de brinquedos, bonecas, bicicletas, produtos educativos e variedades. Nossa comunidade já reúne mais de 13 mil seguidores no Instagram que acompanham nossas novidades toda semana.",
    "Trabalhamos com entrega para todo o território nacional, atendimento próximo pelo WhatsApp e pagamento seguro. Cada pedido é embalado com carinho — porque sabemos que do outro lado há sempre um sorriso esperando.",
  ];
  const bodyEn = [
    "Mundo dos Brinquedos e Variedades was born in Goiânia with a simple purpose: to bring quality fun to children all over Brazil, at a fair price for families and retailers alike.",
    "We're a reference in retail and wholesale, with a carefully curated selection of toys, dolls, bikes, educational products and variety items. Our community already includes over 13,000 Instagram followers who keep up with our new arrivals every week.",
    "We deliver across the whole country, offer close support over WhatsApp and secure payment. Every order is packed with care — because we know there's always a smile waiting on the other side.",
  ];
  const body = lang === "en" ? bodyEn : bodyPt;
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-3xl font-extrabold text-ink">{t("Sobre a Mundo dos Brinquedos")}</h1>
      <div className="mt-4 space-y-4 leading-relaxed text-ink/90">
        {body.map((p, i) => <p key={i}>{p}</p>)}
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[["🚚", "Entrega para todo o Brasil"], ["🏷️", "Atacado e varejo"], ["💬", "Atendimento no WhatsApp"]].map(([i, key]) => (
          <div key={key} className="rounded-[16px] border border-line bg-surface p-4 text-center"><div className="text-3xl">{i}</div><p className="mt-1 font-bold text-ink">{t(key)}</p></div>
        ))}
      </div>
      <div className="mt-6 rounded-[16px] border border-line bg-surface p-5 text-sm">
        <p>📍 {settings.address}</p>
        <p>🕗 {t(settings.hours ?? "")}</p>
        <p>💬 {settings.whatsappLabel}</p>
      </div>
    </div>
  );
}

export function Contato() {
  const { settings } = useStore();
  const { t } = useI18n();
  const [sent, setSent] = useState(false);
  const input = "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand";
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-3xl font-extrabold text-ink">{t("Fale conosco")}</h1>
      <div className="mt-4 grid gap-6 md:grid-cols-2">
        <div className="space-y-3 text-sm">
          <a href={waLink(settings.whatsapp ?? "", "Olá! Vim pelo site.")} target="_blank" rel="noreferrer" className="btn bg-[#25d366] w-full py-3 text-white">{t("💬 Chamar no WhatsApp")}</a>
          <div className="rounded-[16px] border border-line bg-surface p-4">
            <p>📞 {settings.whatsappLabel}</p>
            <p>✉️ {settings.email}</p>
            <p>📍 {settings.address}</p>
            <p>🕗 {t(settings.hours ?? "")}</p>
            <a href={settings.mapsUrl} target="_blank" rel="noreferrer" className="text-brand-dark underline">{t("Ver no Google Maps →")}</a>
          </div>
          <a href={settings.instagram} target="_blank" rel="noreferrer" className="btn w-full bg-gradient-to-r from-[#feda75] via-[#d62976] to-[#4f5bd5] py-2.5 text-white">📸 {settings.instagramHandle}</a>
        </div>
        <div className="rounded-[16px] border border-line bg-surface p-4">
          {sent ? (
            <p className="py-8 text-center font-semibold text-pix">{t("Mensagem enviada! Responderemos em breve. 💛")}</p>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="space-y-2">
              <input required placeholder={t("Nome")} className={input} />
              <input required type="email" placeholder={t("E-mail")} className={input} />
              <input placeholder="WhatsApp" className={input} />
              <input placeholder={t("Assunto")} className={input} />
              <input placeholder={t("Nº do pedido (se houver)")} className={input} />
              <textarea required rows={4} placeholder={t("Sua mensagem")} className={input} />
              <button className="btn btn-primary w-full py-3">{t("Enviar mensagem")}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

const FAQ_PT: [string, string][] = [
  ["Vocês entregam para todo o Brasil?", "Sim! Enviamos para todo o território nacional pelos Correios e transportadoras parceiras."],
  ["Como o frete é calculado?", "O frete é calculado pelo seu CEP, considerando peso e dimensões do produto. É só informar o CEP na página do produto ou no checkout."],
  ["Quais as formas de pagamento?", "Aceitamos Pix, cartão de crédito (com parcelamento), cartão de débito e boleto bancário."],
  ["Posso pagar com Pix?", "Sim, e com desconto! O Pix tem aprovação na hora e liberamos seu pedido rapidinho."],
  ["Posso parcelar?", "Sim, no cartão de crédito você parcela em até 12x sem juros, conforme o valor do pedido."],
  ["Como funciona a compra no atacado?", "Basta criar uma conta atacado e aguardar a aprovação. Depois, você vê preços especiais e quantidades mínimas por produto."],
  ["Qual o pedido mínimo no atacado?", "O pedido mínimo é de R$ 300, e alguns produtos têm quantidade mínima por caixa."],
  ["Como acompanho meu pedido?", "Na página 'Rastrear pedido', informe o número do pedido e seu e-mail ou telefone."],
  ["Posso trocar ou devolver um produto?", "Sim. Você tem até 7 dias corridos após o recebimento para solicitar troca ou devolução, conforme o Código de Defesa do Consumidor."],
  ["Posso retirar em Goiânia?", "Sim! Oferecemos retirada gratuita na nossa loja em Goiânia."],
];
const FAQ_EN: [string, string][] = [
  ["Do you deliver throughout Brazil?", "Yes! We ship nationwide via the Correios and partner carriers."],
  ["How is shipping calculated?", "Shipping is calculated from your postcode (CEP), based on the product's weight and dimensions. Just enter your CEP on the product page or at checkout."],
  ["What are the payment methods?", "We accept Pix, credit card (with instalments), debit card and bank slip (boleto)."],
  ["Can I pay with Pix?", "Yes — and with a discount! Pix is approved instantly and we release your order right away."],
  ["Can I pay in instalments?", "Yes, on credit card you can split into up to 12 interest-free instalments, depending on the order value."],
  ["How does wholesale buying work?", "Just create a wholesale account and wait for approval. Then you'll see special prices and minimum quantities per product."],
  ["What is the minimum wholesale order?", "The minimum order is R$ 300, and some products have a minimum quantity per case."],
  ["How do I track my order?", "On the 'Track order' page, enter your order number and your email or phone."],
  ["Can I exchange or return a product?", "Yes. You have up to 7 calendar days after delivery to request an exchange or return, under Brazil's Consumer Protection Code."],
  ["Can I collect my order in Goiânia?", "Yes! We offer free store pickup in Goiânia."],
];

export function FAQ() {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState<number | null>(0);
  const items = lang === "en" ? FAQ_EN : FAQ_PT;
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-3xl font-extrabold text-ink">{t("Perguntas frequentes")}</h1>
      <div className="mt-4 space-y-2">
        {items.map(([q, a], i) => (
          <div key={i} className="overflow-hidden rounded-[16px] border border-line bg-surface">
            <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-3 p-4 text-left font-bold text-ink">
              {q}<span className="text-brand-dark">{open === i ? "−" : "+"}</span>
            </button>
            {open === i && <p className="px-4 pb-4 text-sm text-ink/85">{a}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

type Pol = { title: string; body: string[] };
const POLICIES: Record<string, { pt: Pol; en: Pol }> = {
  privacidade: {
    pt: { title: "Política de Privacidade (LGPD)", body: ["Levamos a sério a proteção dos seus dados, em conformidade com a Lei Geral de Proteção de Dados (LGPD).", "Coletamos apenas os dados necessários para processar seus pedidos, realizar entregas e melhorar sua experiência.", "Seus dados nunca são vendidos. Você pode solicitar acesso, correção ou exclusão a qualquer momento pelo nosso WhatsApp ou e-mail.", "Utilizamos cookies para lembrar seu carrinho e personalizar ofertas — você controla isso pelo aviso de cookies."] },
    en: { title: "Privacy Policy (LGPD)", body: ["We take the protection of your data seriously, in line with Brazil's General Data Protection Law (LGPD).", "We collect only the data needed to process your orders, make deliveries and improve your experience.", "Your data is never sold. You can request access, correction or deletion at any time via our WhatsApp or email.", "We use cookies to remember your cart and personalise offers — you control this through the cookie notice."] },
  },
  termos: {
    pt: { title: "Termos e Condições", body: ["Ao usar este site, você concorda com nossos termos de uso.", "Os preços e a disponibilidade dos produtos podem mudar sem aviso prévio.", "Pedidos só são confirmados após a aprovação do pagamento.", "Em caso de divergência, entre em contato com nosso atendimento."] },
    en: { title: "Terms & Conditions", body: ["By using this website, you agree to our terms of use.", "Product prices and availability may change without prior notice.", "Orders are only confirmed after payment approval.", "In case of any discrepancy, please contact our support."] },
  },
  entrega: {
    pt: { title: "Política de Entrega e Frete", body: ["Entregamos para todo o Brasil via Correios e transportadoras.", "O prazo de entrega é calculado a partir da confirmação do pagamento.", "O valor do frete depende do CEP, peso e dimensões dos produtos.", "Oferecemos retirada gratuita na loja em Goiânia."] },
    en: { title: "Shipping & Delivery Policy", body: ["We deliver across Brazil via the Correios and carriers.", "Delivery time is counted from payment confirmation.", "The shipping cost depends on the postcode (CEP), weight and dimensions of the products.", "We offer free store pickup in Goiânia."] },
  },
  trocas: {
    pt: { title: "Trocas e Devoluções", body: ["Você tem até 7 dias corridos após o recebimento para solicitar troca ou devolução (arrependimento), conforme o CDC.", "O produto deve estar sem uso, na embalagem original.", "Produtos com defeito são trocados sem custo.", "Para iniciar, fale com nosso atendimento com o número do pedido em mãos."] },
    en: { title: "Exchanges & Returns", body: ["You have up to 7 calendar days after delivery to request an exchange or return (right of withdrawal), under Brazil's Consumer Protection Code.", "The product must be unused and in its original packaging.", "Defective products are exchanged at no cost.", "To start, contact our support with your order number to hand."] },
  },
  reembolso: {
    pt: { title: "Política de Reembolso", body: ["Reembolsos são processados após o recebimento e conferência do produto devolvido.", "Pagamentos via Pix são estornados na mesma chave; cartão, na fatura.", "O prazo de reembolso varia conforme a forma de pagamento."] },
    en: { title: "Refund Policy", body: ["Refunds are processed after we receive and check the returned product.", "Pix payments are refunded to the same key; card payments on the statement.", "The refund time varies according to the payment method."] },
  },
  pagamento: {
    pt: { title: "Política de Pagamento", body: ["Aceitamos Pix, cartão de crédito, débito e boleto bancário.", "O Pix tem desconto e aprovação imediata.", "Parcelamos em até 12x sem juros no cartão.", "Todos os pagamentos são processados em ambiente seguro."] },
    en: { title: "Payment Policy", body: ["We accept Pix, credit card, debit card and bank slip (boleto).", "Pix comes with a discount and instant approval.", "We offer up to 12 interest-free instalments on credit card.", "All payments are processed in a secure environment."] },
  },
  cookies: {
    pt: { title: "Política de Cookies", body: ["Usamos cookies para manter seu carrinho, lembrar preferências e medir o desempenho do site.", "Você pode aceitar ou recusar cookies não essenciais pelo aviso exibido na primeira visita.", "Cookies essenciais são necessários para o funcionamento da loja."] },
    en: { title: "Cookie Policy", body: ["We use cookies to keep your cart, remember preferences and measure the site's performance.", "You can accept or decline non-essential cookies through the notice shown on your first visit.", "Essential cookies are required for the store to work."] },
  },
};

export function Policy({ which }: { which: keyof typeof POLICIES }) {
  const { t, lang } = useI18n();
  const p = POLICIES[which][lang === "en" ? "en" : "pt"];
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/" className="text-sm text-muted hover:text-brand-dark">← {t("Voltar à loja")}</Link>
      <h1 className="mt-2 font-display text-3xl font-extrabold text-ink">{p.title}</h1>
      <div className="mt-4 space-y-3 leading-relaxed text-ink/90">
        {p.body.map((para, i) => <p key={i}>{para}</p>)}
      </div>
    </div>
  );
}

export function Account() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-md px-4 py-12 text-center">
      <p className="text-5xl">👤</p>
      <h1 className="mt-3 font-display text-2xl font-extrabold text-ink">{t("Minha conta")}</h1>
      <p className="mt-1 text-muted">{t("Entre para ver seus pedidos, favoritos e endereços — ou continue como visitante.")}</p>
      <div className="mt-5 space-y-2">
        <input placeholder={t("E-mail")} className="w-full rounded-lg border border-line px-3 py-2.5 text-sm" />
        <input type="password" placeholder={t("Senha")} className="w-full rounded-lg border border-line px-3 py-2.5 text-sm" />
        <button className="btn btn-primary w-full py-3">{t("Entrar")}</button>
        <Link to="/rastrear" className="btn btn-ghost w-full py-2.5 text-sm">{t("Rastrear um pedido sem login")}</Link>
      </div>
      <p className="mt-4 text-xs text-muted">{t("O login de clientes será ativado na Fase 2. No protótipo, os pedidos ficam visíveis no painel do admin.")}</p>
    </div>
  );
}
