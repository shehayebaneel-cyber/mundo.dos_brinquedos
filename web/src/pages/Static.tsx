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
    "Atendimento próximo e direto pelo WhatsApp: você faz o pedido pelo site e a gente combina o resto com você. Cada pedido é embalado com carinho — porque sabemos que do outro lado há sempre um sorriso esperando.",
  ];
  const bodyEn = [
    "Mundo dos Brinquedos e Variedades was born in Goiânia with a simple purpose: to bring quality fun to children all over Brazil, at a fair price for families and retailers alike.",
    "We're a reference in retail and wholesale, with a carefully curated selection of toys, dolls, bikes, educational products and variety items. Our community already includes over 13,000 Instagram followers who keep up with our new arrivals every week.",
    "Close, direct support over WhatsApp: you place the order on the site and we sort out the rest with you. Every order is packed with care — because we know there's always a smile waiting on the other side.",
  ];
  const body = lang === "en" ? bodyEn : bodyPt;
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-3xl font-extrabold text-ink">{t("Sobre a Mundo dos Brinquedos")}</h1>
      <div className="mt-4 space-y-4 leading-relaxed text-ink/90">
        {body.map((p, i) => <p key={i}>{p}</p>)}
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[["🏷️", "Atacado e varejo"], ["💬", "Atendimento no WhatsApp"], ["🛍️", "Retirada em Goiânia"]].map(([i, key]) => (
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
  ["Como faço um pedido?", "É só escolher os produtos, adicionar ao carrinho e enviar o pedido com seu nome e WhatsApp. Depois, entramos em contato pelo WhatsApp para combinar o pagamento e a entrega ou retirada."],
  ["Preciso pagar pelo site?", "Não. O site só registra o seu pedido. O pagamento é combinado diretamente com a gente pelo WhatsApp."],
  ["Como funciona o preço de atacado?", "O preço de atacado é automático para todos — sem cadastro e sem aprovação. Conforme você vai adicionando itens ao carrinho, o desconto entra sozinho."],
  ["Preciso me cadastrar para comprar no atacado?", "Não. Não existe cadastro nem aprovação de atacado. Basta montar o carrinho e o melhor preço aparece automaticamente."],
  ["O que preciso para finalizar o pedido?", "Só o seu nome e um número de WhatsApp. Não pedimos e-mail, senha nem endereço no site."],
  ["Como acompanho meu pedido?", "Entre em 'Minha conta' com o mesmo nome e WhatsApp para ver seus pedidos. E qualquer dúvida é só falar com a gente no WhatsApp."],
  ["Posso trocar ou devolver um produto?", "Sim. Você tem até 7 dias corridos após o recebimento para solicitar troca ou devolução, conforme o Código de Defesa do Consumidor."],
  ["Posso retirar em Goiânia?", "Sim! Combinamos a retirada na nossa loja em Goiânia pelo WhatsApp."],
];
const FAQ_EN: [string, string][] = [
  ["How do I place an order?", "Just pick your products, add them to the cart and submit the order with your name and WhatsApp. We'll then get in touch on WhatsApp to arrange payment and pickup or delivery."],
  ["Do I have to pay on the website?", "No. The site only registers your order. Payment is arranged directly with us over WhatsApp."],
  ["How does wholesale pricing work?", "Wholesale pricing is automatic for everyone — no registration and no approval. As you add items to the cart, the discount kicks in on its own."],
  ["Do I need to register to buy wholesale?", "No. There's no wholesale registration or approval. Just build your cart and the best price shows up automatically."],
  ["What do I need to finish the order?", "Only your name and a WhatsApp number. We don't ask for email, password or address on the site."],
  ["How do I track my order?", "Sign in to 'My account' with the same name and WhatsApp to see your orders. For anything else, just message us on WhatsApp."],
  ["Can I exchange or return a product?", "Yes. You have up to 7 calendar days after delivery to request an exchange or return, under Brazil's Consumer Protection Code."],
  ["Can I collect my order in Goiânia?", "Yes! We arrange store pickup in Goiânia over WhatsApp."],
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
  trocas: {
    pt: { title: "Trocas e Devoluções", body: ["Você tem até 7 dias corridos após o recebimento para solicitar troca ou devolução (arrependimento), conforme o CDC.", "O produto deve estar sem uso, na embalagem original.", "Produtos com defeito são trocados sem custo.", "Para iniciar, fale com nosso atendimento com o número do pedido em mãos."] },
    en: { title: "Exchanges & Returns", body: ["You have up to 7 calendar days after delivery to request an exchange or return (right of withdrawal), under Brazil's Consumer Protection Code.", "The product must be unused and in its original packaging.", "Defective products are exchanged at no cost.", "To start, contact our support with your order number to hand."] },
  },
  reembolso: {
    pt: { title: "Política de Reembolso", body: ["Reembolsos são processados após o recebimento e conferência do produto devolvido.", "Pagamentos via Pix são estornados na mesma chave; cartão, na fatura.", "O prazo de reembolso varia conforme a forma de pagamento."] },
    en: { title: "Refund Policy", body: ["Refunds are processed after we receive and check the returned product.", "Pix payments are refunded to the same key; card payments on the statement.", "The refund time varies according to the payment method."] },
  },
  pagamento: {
    pt: { title: "Política de Pagamento", body: ["O pagamento não é feito pelo site. Você envia o pedido e combinamos o pagamento diretamente pelo WhatsApp.", "Trabalhamos com as formas de pagamento mais convenientes para você, acertadas no atendimento.", "Confirmamos cada pedido pelo WhatsApp antes de qualquer pagamento."] },
    en: { title: "Payment Policy", body: ["Payment is not made on the website. You submit your order and we arrange payment directly over WhatsApp.", "We work with the payment methods most convenient for you, agreed during support.", "We confirm every order over WhatsApp before any payment."] },
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

