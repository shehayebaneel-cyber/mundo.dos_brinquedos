import { useState } from "react";
import { Link } from "react-router-dom";
import { useStore, waLink } from "../lib/store";

export function Sobre() {
  const { settings } = useStore();
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-3xl font-extrabold text-ink">Sobre a Mundo dos Brinquedos</h1>
      <div className="mt-4 space-y-4 leading-relaxed text-ink/90">
        <p>A <b>Mundo dos Brinquedos e Variedades</b> nasceu em Goiânia com um propósito simples: levar diversão de qualidade para as crianças de todo o Brasil, com preço justo tanto para as famílias quanto para os lojistas.</p>
        <p>Somos referência em <b>varejo e atacado</b>, com uma seleção cuidadosa de brinquedos, bonecas, bicicletas, produtos educativos e variedades. Nossa comunidade já reúne mais de 13 mil seguidores no Instagram que acompanham nossas novidades toda semana.</p>
        <p>Trabalhamos com entrega para todo o território nacional, atendimento próximo pelo WhatsApp e pagamento seguro. Cada pedido é embalado com carinho — porque sabemos que do outro lado há sempre um sorriso esperando.</p>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[["🚚", "Entrega nacional"], ["🏷️", "Varejo e atacado"], ["💬", "Atendimento humano"]].map(([i, t]) => (
          <div key={t} className="rounded-[16px] border border-line bg-surface p-4 text-center"><div className="text-3xl">{i}</div><p className="mt-1 font-bold text-ink">{t}</p></div>
        ))}
      </div>
      <div className="mt-6 rounded-[16px] border border-line bg-surface p-5 text-sm">
        <p>📍 {settings.address}</p>
        <p>🕗 {settings.hours}</p>
        <p>💬 {settings.whatsappLabel}</p>
      </div>
    </div>
  );
}

export function Contato() {
  const { settings } = useStore();
  const [sent, setSent] = useState(false);
  const input = "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand";
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-3xl font-extrabold text-ink">Fale conosco</h1>
      <div className="mt-4 grid gap-6 md:grid-cols-2">
        <div className="space-y-3 text-sm">
          <a href={waLink(settings.whatsapp ?? "", "Olá! Vim pelo site.")} target="_blank" rel="noreferrer" className="btn bg-[#25d366] w-full py-3 text-white">💬 Chamar no WhatsApp</a>
          <div className="rounded-[16px] border border-line bg-surface p-4">
            <p>📞 {settings.whatsappLabel}</p>
            <p>✉️ {settings.email}</p>
            <p>📍 {settings.address}</p>
            <p>🕗 {settings.hours}</p>
            <a href={settings.mapsUrl} target="_blank" rel="noreferrer" className="text-brand-dark underline">Ver no Google Maps →</a>
          </div>
          <a href={settings.instagram} target="_blank" rel="noreferrer" className="btn w-full bg-gradient-to-r from-[#feda75] via-[#d62976] to-[#4f5bd5] py-2.5 text-white">📸 {settings.instagramHandle}</a>
        </div>
        <div className="rounded-[16px] border border-line bg-surface p-4">
          {sent ? (
            <p className="py-8 text-center font-semibold text-pix">Mensagem enviada! Responderemos em breve. 💛</p>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="space-y-2">
              <input required placeholder="Nome" className={input} />
              <input required type="email" placeholder="E-mail" className={input} />
              <input placeholder="WhatsApp" className={input} />
              <input placeholder="Assunto" className={input} />
              <input placeholder="Nº do pedido (se houver)" className={input} />
              <textarea required rows={4} placeholder="Sua mensagem" className={input} />
              <button className="btn btn-primary w-full py-3">Enviar mensagem</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

const FAQS: [string, string][] = [
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

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-3xl font-extrabold text-ink">Perguntas frequentes</h1>
      <div className="mt-4 space-y-2">
        {FAQS.map(([q, a], i) => (
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

const POLICIES: Record<string, { title: string; body: string[] }> = {
  privacidade: { title: "Política de Privacidade (LGPD)", body: ["Levamos a sério a proteção dos seus dados, em conformidade com a Lei Geral de Proteção de Dados (LGPD).", "Coletamos apenas os dados necessários para processar seus pedidos, realizar entregas e melhorar sua experiência.", "Seus dados nunca são vendidos. Você pode solicitar acesso, correção ou exclusão a qualquer momento pelo nosso WhatsApp ou e-mail.", "Utilizamos cookies para lembrar seu carrinho e personalizar ofertas — você controla isso pelo aviso de cookies."] },
  termos: { title: "Termos e Condições", body: ["Ao usar este site, você concorda com nossos termos de uso.", "Os preços e a disponibilidade dos produtos podem mudar sem aviso prévio.", "Pedidos só são confirmados após a aprovação do pagamento.", "Em caso de divergência, entre em contato com nosso atendimento."] },
  entrega: { title: "Política de Entrega e Frete", body: ["Entregamos para todo o Brasil via Correios e transportadoras.", "O prazo de entrega é calculado a partir da confirmação do pagamento.", "O valor do frete depende do CEP, peso e dimensões dos produtos.", "Oferecemos retirada gratuita na loja em Goiânia."] },
  trocas: { title: "Trocas e Devoluções", body: ["Você tem até 7 dias corridos após o recebimento para solicitar troca ou devolução (arrependimento), conforme o CDC.", "O produto deve estar sem uso, na embalagem original.", "Produtos com defeito são trocados sem custo.", "Para iniciar, fale com nosso atendimento com o número do pedido em mãos."] },
  reembolso: { title: "Política de Reembolso", body: ["Reembolsos são processados após o recebimento e conferência do produto devolvido.", "Pagamentos via Pix são estornados na mesma chave; cartão, na fatura.", "O prazo de reembolso varia conforme a forma de pagamento."] },
  pagamento: { title: "Política de Pagamento", body: ["Aceitamos Pix, cartão de crédito, débito e boleto bancário.", "O Pix tem desconto e aprovação imediata.", "Parcelamos em até 12x sem juros no cartão.", "Todos os pagamentos são processados em ambiente seguro."] },
  cookies: { title: "Política de Cookies", body: ["Usamos cookies para manter seu carrinho, lembrar preferências e medir o desempenho do site.", "Você pode aceitar ou recusar cookies não essenciais pelo aviso exibido na primeira visita.", "Cookies essenciais são necessários para o funcionamento da loja."] },
};

export function Policy({ which }: { which: keyof typeof POLICIES }) {
  const p = POLICIES[which];
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/" className="text-sm text-muted hover:text-brand-dark">← Voltar</Link>
      <h1 className="mt-2 font-display text-3xl font-extrabold text-ink">{p.title}</h1>
      <div className="mt-4 space-y-3 leading-relaxed text-ink/90">
        {p.body.map((para, i) => <p key={i}>{para}</p>)}
      </div>
      <p className="mt-6 text-xs text-muted">Última atualização: {new Date().toLocaleDateString("pt-BR")}. Este é um texto de exemplo do protótipo — revise com um jurista antes de publicar.</p>
    </div>
  );
}

export function Account() {
  return (
    <div className="mx-auto max-w-md px-4 py-12 text-center">
      <p className="text-5xl">👤</p>
      <h1 className="mt-3 font-display text-2xl font-extrabold text-ink">Minha conta</h1>
      <p className="mt-1 text-muted">Entre para ver seus pedidos, favoritos e endereços — ou continue como visitante.</p>
      <div className="mt-5 space-y-2">
        <input placeholder="E-mail" className="w-full rounded-lg border border-line px-3 py-2.5 text-sm" />
        <input type="password" placeholder="Senha" className="w-full rounded-lg border border-line px-3 py-2.5 text-sm" />
        <button className="btn btn-primary w-full py-3">Entrar</button>
        <Link to="/rastrear" className="btn btn-ghost w-full py-2.5 text-sm">Rastrear um pedido sem login</Link>
      </div>
      <p className="mt-4 text-xs text-muted">O login de clientes será ativado na Fase 2. No protótipo, os pedidos ficam visíveis no painel do admin.</p>
    </div>
  );
}
