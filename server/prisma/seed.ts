import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

// R$ helper → centavos
const r = (reais: number) => Math.round(reais * 100);
// placeholder image token: "emoji|background"
const img = (emoji: string, bg: string) => `${emoji}|${bg}`;

const BG: Record<string, string> = {
  bonecas: "#fff0f2",
  carrinhos: "#e6f2ff",
  bicicletas: "#e3f8f1",
  educativos: "#f0eaff",
  bebes: "#fff6df",
  games: "#ecebff",
  garrafas: "#e0f7f1",
  presentes: "#ffeede",
};

async function main() {
  console.log("🌱 Limpando dados…");
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.review.deleteMany();
  await db.productVariant.deleteMany();
  await db.productImage.deleteMany();
  await db.product.deleteMany();
  await db.category.deleteMany();
  await db.customer.deleteMany();
  await db.banner.deleteMany();
  await db.setting.deleteMany();

  // ---------- SETTINGS (editable store info) ----------
  const settings: Record<string, string> = {
    storeName: "Mundo dos Brinquedos e Variedades",
    tagline: "Varejo e atacado · entrega para todo o Brasil",
    whatsapp: "5562981652030",
    whatsappLabel: "+55 62 98165-2030",
    hours: "Seg a Sáb, 08:00–18:00",
    address: "Av. Honestino Guimarães, Goiânia - GO",
    mapsUrl: "https://maps.app.goo.gl/bfegeTnxHByn1mth6",
    instagram: "https://instagram.com/mundo.dos_brinquedos",
    instagramHandle: "@mundo.dos_brinquedos",
    email: "contato@mundodosbrinquedos.com.br",
    freeShippingMinCents: String(r(199)),
    wholesaleMinOrderCents: String(r(300)),
    pixDiscountPercent: "10",
    heroInstagramNote: "13,4 mil seguidores no Instagram",
  };
  await db.setting.createMany({
    data: Object.entries(settings).map(([key, value]) => ({ key, value })),
  });

  // ---------- CATEGORIES ----------
  const cats = [
    { slug: "bonecas", name: "Bonecas", emoji: "👶", accent: "brand", blurb: "Bonecas, bebês reborn e fashion." },
    { slug: "carrinhos", name: "Carrinhos", emoji: "🚗", accent: "sky", blurb: "Controle remoto, pistas e miniaturas." },
    { slug: "bicicletas", name: "Bicicletas & Patinetes", emoji: "🚲", accent: "mint", blurb: "Bikes, patinetes e triciclos." },
    { slug: "educativos", name: "Brinquedos Educativos", emoji: "🧩", accent: "grape", blurb: "Montar, aprender e criar." },
    { slug: "bebes", name: "Para Bebês", emoji: "🍼", accent: "sun", blurb: "Primeira infância com segurança." },
    { slug: "games", name: "Games", emoji: "🎮", accent: "grape", blurb: "Consoles e acessórios." },
    { slug: "garrafas", name: "Garrafas & Acessórios", emoji: "🧴", accent: "mint", blurb: "Garrafas, squeezes e térmicas." },
    { slug: "presentes", name: "Presentes & Novidades", emoji: "🎁", accent: "brand", blurb: "Ideias de presente para todas as idades." },
  ];
  const catId: Record<string, number> = {};
  for (let i = 0; i < cats.length; i++) {
    const c = await db.category.create({ data: { ...cats[i], sortOrder: i } });
    catId[c.slug] = c.id;
  }

  // ---------- PRODUCTS ----------
  type P = {
    slug: string; name: string; brand: string; cat: keyof typeof BG; sku: string;
    price: number; old?: number; cost: number; wholesale?: number; minW?: number; pack?: number;
    stock: number; low?: number; age: string; material: string; weight: number;
    featured?: boolean; isNew?: boolean; best?: boolean; wholesaleOnly?: boolean; pix?: number;
    emoji: string; desc: string;
    variants?: { kind: string; label: string; swatch?: string; stock: number; delta?: number }[];
    extraImgs?: string[];
  };

  const products: P[] = [
    {
      slug: "boneca-bebe-reborn-realista", name: "Boneca Bebê Reborn Realista 48cm", brand: "MundoKids", cat: "bonecas", sku: "BON-001",
      price: 129.9, old: 179.9, cost: 78, wholesale: 99.9, minW: 3, stock: 24, age: "3+", material: "Vinil e algodão", weight: 900,
      best: true, featured: true, emoji: "👶",
      desc: "Boneca bebê reborn super realista, com corpo macio e detalhes pintados à mão. Acompanha roupinha, chupeta e certidão de nascimento simbólica. Um presente encantador que estimula o cuidado e a imaginação.",
      variants: [
        { kind: "cor", label: "Pele clara", swatch: "#f6d3b8", stock: 14 },
        { kind: "cor", label: "Pele morena", swatch: "#c98a5e", stock: 10 },
      ],
    },
    {
      slug: "boneca-fashion-cabelo-magico", name: "Boneca Fashion Cabelo Mágico", brand: "ToyStar", cat: "bonecas", sku: "BON-002",
      price: 79.9, cost: 41, stock: 33, age: "4+", material: "Plástico ABS", weight: 350, isNew: true, emoji: "💇‍♀️",
      desc: "Boneca fashion com cabelo que muda de cor na água morna. Inclui acessórios de penteado e roupinhas para brincar de salão.",
      variants: [
        { kind: "cor", label: "Rosa", swatch: "#ff7ba8", stock: 18 },
        { kind: "cor", label: "Lilás", swatch: "#b98bff", stock: 15 },
      ],
    },
    {
      slug: "carrinho-controle-4x4-offroad", name: "Carrinho Controle Remoto 4x4 Off-Road", brand: "KidsPlay", cat: "carrinhos", sku: "CAR-010",
      price: 127.4, old: 149.9, cost: 74, stock: 12, age: "6+", material: "Plástico e borracha", weight: 700, best: true, emoji: "🚙",
      desc: "Carro de controle remoto 4x4 com tração nas quatro rodas, suspensão e pneus de borracha para qualquer terreno. Alcance de 30m, recarregável por USB.",
      variants: [
        { kind: "cor", label: "Vermelho", swatch: "#e11d3f", stock: 7 },
        { kind: "cor", label: "Azul", swatch: "#3da5ff", stock: 5 },
      ],
    },
    {
      slug: "pista-super-looping", name: "Pista Super Looping com 2 Carrinhos", brand: "KidsPlay", cat: "carrinhos", sku: "CAR-011",
      price: 199.9, cost: 118, stock: 3, low: 5, age: "5+", material: "Plástico", weight: 1200, featured: true, emoji: "🏁",
      desc: "Pista radical com looping 360°, lançador turbo e 2 carrinhos inclusos. Monta e desmonta fácil, expansível com outras pistas da linha.",
    },
    {
      slug: "caminhao-cacamba-grande", name: "Caminhão Caçamba Grande 60cm", brand: "BrinqBrasil", cat: "carrinhos", sku: "CAR-012",
      price: 89.9, cost: 52, stock: 0, age: "3+", material: "Plástico reforçado", weight: 1100, emoji: "🚛",
      desc: "Caminhão caçamba grandão que levanta e despeja de verdade. Resistente para brincadeiras no quintal e na areia.",
    },
    {
      slug: "bicicleta-infantil-aro-16", name: "Bicicleta Infantil Aro 16", brand: "BikeKids", cat: "bicicletas", sku: "BIC-020",
      price: 389.9, cost: 250, wholesale: 329.9, minW: 3, stock: 7, age: "5-8 anos", material: "Aço carbono", weight: 8500, featured: true, emoji: "🚲",
      desc: "Bicicleta infantil aro 16 com rodinhas de apoio removíveis, freios dianteiro e traseiro, e cestinha. Estrutura em aço resistente com pintura de alta durabilidade.",
      variants: [
        { kind: "tamanho", label: "Aro 12", stock: 3, delta: -60 },
        { kind: "tamanho", label: "Aro 16", stock: 4, delta: 0 },
        { kind: "cor", label: "Rosa", swatch: "#ff7ba8", stock: 4 },
        { kind: "cor", label: "Azul", swatch: "#3da5ff", stock: 3 },
      ],
    },
    {
      slug: "patinete-3-rodas-luz", name: "Patinete 3 Rodas com Luz", brand: "BikeKids", cat: "bicicletas", sku: "BIC-021",
      price: 149.9, old: 199.9, cost: 88, stock: 15, age: "3+", material: "Alumínio e PU", weight: 2200, isNew: true, best: true, emoji: "🛴",
      desc: "Patinete 3 rodas com rodinhas que acendem, guidão ajustável em 3 alturas e estrutura dobrável. Suporta até 50kg.",
      variants: [
        { kind: "cor", label: "Rosa", swatch: "#ff7ba8", stock: 8 },
        { kind: "cor", label: "Verde", swatch: "#21c197", stock: 7 },
      ],
    },
    {
      slug: "blocos-montar-200-pecas", name: "Blocos de Montar Educativo 200 Peças", brand: "EducaKids", cat: "educativos", sku: "EDU-030",
      price: 99.9, cost: 46, wholesale: 74.9, minW: 6, pack: 6, stock: 48, age: "3+", material: "Plástico atóxico", weight: 1300, best: true, emoji: "🧱",
      desc: "200 peças coloridas compatíveis com as principais marcas. Estimula coordenação, criatividade e raciocínio lógico. Acompanha maletinha organizadora.",
    },
    {
      slug: "quebra-cabeca-mundo-animal-500", name: "Quebra-Cabeça Mundo Animal 500 Peças", brand: "EducaKids", cat: "educativos", sku: "EDU-031",
      price: 39.9, cost: 18, stock: 40, age: "8+", material: "Papelão premium", weight: 600, emoji: "🧩",
      desc: "Quebra-cabeça de 500 peças com ilustração vibrante do reino animal. Peças que encaixam perfeitamente, ideal para toda a família.",
    },
    {
      slug: "mesa-atividades-educativa", name: "Mesa de Atividades Educativa Musical", brand: "EducaKids", cat: "educativos", sku: "EDU-032",
      price: 79.9, old: 119.9, cost: 44, stock: 9, low: 6, age: "1-3 anos", material: "Plástico atóxico", weight: 1500, emoji: "🎹",
      desc: "Mesa interativa com sons, luzes, formas e números. Pés removíveis para usar no chão ou em pé. Desenvolve os primeiros aprendizados brincando.",
    },
    {
      slug: "mobile-musical-berco", name: "Móbile Musical de Berço", brand: "BabyMundo", cat: "bebes", sku: "BEB-040",
      price: 69.9, cost: 33, stock: 22, age: "0+", material: "Tecido e plástico", weight: 500, isNew: true, emoji: "🎠",
      desc: "Móbile musical com bichinhos de pelúcia giratórios e melodias suaves que acalmam o bebê. Fixação universal para berços.",
    },
    {
      slug: "chocalho-kit-5-pecas", name: "Kit Chocalho e Mordedor 5 Peças", brand: "BabyMundo", cat: "bebes", sku: "BEB-041",
      price: 34.9, cost: 15, wholesale: 22.9, minW: 12, pack: 12, stock: 60, age: "0+", material: "Silicone atóxico", weight: 250, emoji: "🍼",
      desc: "Kit com 5 chocalhos e mordedores em silicone macio, livre de BPA. Cores contrastantes que estimulam a visão do bebê.",
    },
    {
      slug: "console-portatil-400-jogos", name: "Console Portátil Retrô 400 Jogos", brand: "GameZone", cat: "games", sku: "GAM-050",
      price: 159.9, old: 219.9, cost: 92, stock: 4, low: 5, age: "6+", material: "Plástico ABS", weight: 300, best: true, emoji: "🕹️",
      desc: "Videogame portátil com tela colorida de 3\", 400 jogos clássicos na memória e saída para TV. Bateria recarregável de longa duração.",
    },
    {
      slug: "controle-gamer-sem-fio", name: "Controle Gamer Sem Fio", brand: "GameZone", cat: "games", sku: "GAM-051",
      price: 119.9, cost: 62, stock: 0, age: "8+", material: "Plástico", weight: 220, emoji: "🎮",
      desc: "Controle sem fio compatível com PC e consoles, com vibração dupla e bateria recarregável. Conexão estável de até 8 metros.",
    },
    {
      slug: "kit-slime-faca-voce-mesmo", name: "Kit Slime Faça Você Mesmo", brand: "FunLab", cat: "presentes", sku: "PRE-060",
      price: 47.9, old: 79.9, cost: 24, stock: 8, low: 10, age: "6+", material: "Não tóxico", weight: 700, isNew: true, best: true, emoji: "🪀",
      desc: "Kit completo para fazer slime em casa: colas coloridas, glitter, ativador e potes. Diversão sensorial garantida e segura.",
    },
    {
      slug: "garrafa-termica-infantil-500", name: "Garrafa Térmica Infantil 500ml", brand: "AquaKids", cat: "garrafas", sku: "GAR-070",
      price: 49.9, cost: 21, wholesale: 32.9, minW: 12, pack: 12, stock: 120, age: "3+", material: "Aço inox", weight: 320, best: true, emoji: "🧴",
      desc: "Garrafa térmica infantil em aço inox, mantém a temperatura por até 12h. Tampa com canudo, alça e estampas divertidas. Livre de BPA.",
      variants: [
        { kind: "cor", label: "Rosa", swatch: "#ff7ba8", stock: 40 },
        { kind: "cor", label: "Azul", swatch: "#3da5ff", stock: 40 },
        { kind: "cor", label: "Verde", swatch: "#21c197", stock: 24 },
        { kind: "cor", label: "Amarelo", swatch: "#ffc53d", stock: 16 },
      ],
    },
    {
      slug: "squeeze-esportivo-750", name: "Squeeze Esportivo 750ml", brand: "AquaKids", cat: "garrafas", sku: "GAR-071",
      price: 39.9, cost: 16, stock: 50, age: "Todas", material: "Tritan", weight: 180, emoji: "🚰",
      desc: "Squeeze esportivo de 750ml em Tritan resistente, com bico retrátil e marcação de volume. Perfeito para escola e esportes.",
      variants: [
        { kind: "cor", label: "Preto", swatch: "#241f3b", stock: 20 },
        { kind: "cor", label: "Azul", swatch: "#3da5ff", stock: 18 },
        { kind: "cor", label: "Rosa", swatch: "#ff7ba8", stock: 12 },
      ],
    },
    {
      slug: "pelucia-urso-gigante-90", name: "Pelúcia Urso Gigante 90cm", brand: "SoftFriends", cat: "presentes", sku: "PRE-061",
      price: 189.9, cost: 105, stock: 5, low: 5, age: "0+", material: "Pelúcia antialérgica", weight: 1800, featured: true, emoji: "🧸",
      desc: "Urso de pelúcia gigante de 90cm, super macio e abraçável. Enchimento antialérgico e costura reforçada. O presente que todo mundo ama.",
    },
    {
      slug: "kit-presente-surpresa-menina", name: "Kit Presente Surpresa Menina", brand: "MundoKids", cat: "presentes", sku: "PRE-062",
      price: 99.9, cost: 55, stock: 18, age: "4+", material: "Variados", weight: 900, isNew: true, emoji: "🎁",
      desc: "Caixa surpresa com seleção de brinquedos, acessórios e mimos para meninas. Uma explosão de alegria — ótima ideia de presente.",
    },
    {
      slug: "triciclo-velotrol-empurrador", name: "Triciclo Velotrol com Haste Empurrador", brand: "BikeKids", cat: "bebes", sku: "BEB-042",
      price: 249.9, old: 299.9, cost: 158, wholesale: 219.9, minW: 2, stock: 6, low: 5, age: "1-4 anos", material: "Aço e plástico", weight: 4200, featured: true, emoji: "🛺",
      desc: "Triciclo 3 em 1 com haste empurradora para os pais, cinto de segurança, capota removível e cestinha. Cresce junto com a criança.",
      variants: [
        { kind: "cor", label: "Vermelho", swatch: "#e11d3f", stock: 3 },
        { kind: "cor", label: "Azul", swatch: "#3da5ff", stock: 3 },
      ],
    },
  ];

  const prodBySlug: Record<string, number> = {};
  for (const p of products) {
    const created = await db.product.create({
      data: {
        slug: p.slug, name: p.name, brand: p.brand, sku: p.sku, description: p.desc,
        categoryId: catId[p.cat],
        priceCents: r(p.price), oldPriceCents: p.old ? r(p.old) : null, costCents: r(p.cost),
        wholesaleCents: p.wholesale ? r(p.wholesale) : null, minWholesaleQty: p.minW ?? 0,
        packQty: p.pack ?? 1, pixPercent: p.pix ?? 10, stock: p.stock, lowStockAt: p.low ?? 5,
        ageGroup: p.age, material: p.material, weightGrams: p.weight, warranty: "3 meses contra defeitos de fabricação",
        featured: !!p.featured, isNew: !!p.isNew, bestSeller: !!p.best, wholesaleOnly: !!p.wholesaleOnly,
        images: {
          create: [
            { url: img(p.emoji, BG[p.cat]), alt: p.name, sortOrder: 0 },
            { url: img("✨", BG[p.cat]), alt: `${p.name} - detalhe`, sortOrder: 1 },
          ],
        },
        variants: p.variants
          ? { create: p.variants.map((v) => ({ kind: v.kind, label: v.label, swatch: v.swatch ?? "", stock: v.stock, priceDeltaCents: r(v.delta ?? 0) })) }
          : undefined,
      },
    });
    prodBySlug[p.slug] = created.id;
  }

  // ---------- CUSTOMERS ----------
  const customers = [
    { name: "Ana Paula Ribeiro", email: "ana.ribeiro@email.com", phone: "5562991110001", cpfCnpj: "123.456.789-00", kind: "varejo", city: "Goiânia", state: "GO" },
    { name: "Mariana Souza", email: "mariana.souza@email.com", phone: "5562991110002", cpfCnpj: "987.654.321-00", kind: "varejo", city: "Aparecida de Goiânia", state: "GO" },
    { name: "Loja Alegria Kids", businessName: "Alegria Kids Comércio LTDA", email: "compras@alegriakids.com.br", phone: "5562991110003", cpfCnpj: "12.345.678/0001-90", kind: "atacado", wholesaleStatus: "approved", city: "Anápolis", state: "GO" },
    { name: "Pedro Lojista", businessName: "Cantinho da Criança ME", email: "pedro@cantinhocrianca.com.br", phone: "5562991110004", cpfCnpj: "23.456.789/0001-01", kind: "atacado", wholesaleStatus: "approved", city: "Brasília", state: "DF" },
    { name: "Revenda Sorriso", businessName: "Sorriso Distribuidora", email: "contato@revendasorriso.com", phone: "5562991110005", cpfCnpj: "34.567.890/0001-12", kind: "atacado", wholesaleStatus: "pending", city: "Uberlândia", state: "MG", notes: "Aguardando análise de CNPJ." },
    { name: "Carlos Atacadista", businessName: "CA Variedades", email: "carlos@cavariedades.com", phone: "5562991110006", cpfCnpj: "45.678.901/0001-23", kind: "atacado", wholesaleStatus: "rejected", city: "Goiânia", state: "GO", notes: "Documentação incompleta." },
  ];
  const custId: Record<string, number> = {};
  for (const c of customers) {
    const created = await db.customer.create({ data: c });
    custId[c.email] = created.id;
  }

  // ---------- ORDERS (varied statuses & payments) ----------
  let seq = 1;
  const mkCode = () => `MDB-2026-${String(seq++).padStart(4, "0")}`;
  type OI = { slug: string; qty: number; variant?: string; price: number };
  const mkOrder = async (o: {
    email: string; kind?: string; status: string; pay: string; payStatus: string;
    items: OI[]; shipping: number; discount?: number; cep: string; address: string; city: string; state: string; tracking?: string;
  }) => {
    const sub = o.items.reduce((s, it) => s + r(it.price) * it.qty, 0);
    const total = sub - r(o.discount ?? 0) + r(o.shipping);
    const c = customers.find((x) => x.email === o.email)!;
    await db.order.create({
      data: {
        code: mkCode(), customerId: custId[o.email], customerName: c.name, customerPhone: c.phone, customerEmail: c.email,
        kind: o.kind ?? "varejo", status: o.status, paymentMethod: o.pay, paymentStatus: o.payStatus,
        subtotalCents: sub, discountCents: r(o.discount ?? 0), shippingCents: r(o.shipping), totalCents: total,
        cep: o.cep, address: o.address, city: o.city, state: o.state, trackingCode: o.tracking ?? "",
        items: { create: o.items.map((it) => ({ productId: prodBySlug[it.slug], name: products.find((p) => p.slug === it.slug)!.name, variant: it.variant ?? "", priceCents: r(it.price), qty: it.qty })) },
      },
    });
  };

  await mkOrder({ email: "ana.ribeiro@email.com", status: "entregue", pay: "pix", payStatus: "pago", items: [{ slug: "boneca-bebe-reborn-realista", qty: 1, variant: "Pele clara", price: 129.9 }, { slug: "kit-slime-faca-voce-mesmo", qty: 1, price: 47.9 }], shipping: 0, cep: "74000-000", address: "Rua T-30, 123", city: "Goiânia", state: "GO", tracking: "BR123456789BR" });
  await mkOrder({ email: "mariana.souza@email.com", status: "enviado", pay: "cartao", payStatus: "pago", items: [{ slug: "patinete-3-rodas-luz", qty: 1, variant: "Rosa", price: 149.9 }], shipping: 24.9, cep: "74900-000", address: "Av. Central, 45", city: "Aparecida de Goiânia", state: "GO", tracking: "BR987654321BR" });
  await mkOrder({ email: "compras@alegriakids.com.br", kind: "atacado", status: "em_separacao", pay: "boleto", payStatus: "pago", items: [{ slug: "garrafa-termica-infantil-500", qty: 12, variant: "Sortido", price: 32.9 }, { slug: "blocos-montar-200-pecas", qty: 6, price: 74.9 }], shipping: 0, cep: "75000-000", address: "Rua do Comércio, 500", city: "Anápolis", state: "GO" });
  await mkOrder({ email: "compras@alegriakids.com.br", kind: "atacado", status: "pago", pay: "pix", payStatus: "pago", items: [{ slug: "chocalho-kit-5-pecas", qty: 12, price: 22.9 }], shipping: 0, cep: "75000-000", address: "Rua do Comércio, 500", city: "Anápolis", state: "GO" });
  await mkOrder({ email: "pedro@cantinhocrianca.com.br", kind: "atacado", status: "aguardando_pagamento", pay: "boleto", payStatus: "pendente", items: [{ slug: "triciclo-velotrol-empurrador", qty: 2, variant: "Vermelho", price: 219.9 }, { slug: "bicicleta-infantil-aro-16", qty: 3, variant: "Rosa", price: 329.9 }], shipping: 0, cep: "70000-000", address: "SCS Quadra 2", city: "Brasília", state: "DF" });
  await mkOrder({ email: "ana.ribeiro@email.com", status: "aguardando_pagamento", pay: "pix", payStatus: "pendente", items: [{ slug: "pelucia-urso-gigante-90", qty: 1, price: 189.9 }], shipping: 19.9, cep: "74000-000", address: "Rua T-30, 123", city: "Goiânia", state: "GO" });
  await mkOrder({ email: "mariana.souza@email.com", status: "cancelado", pay: "cartao", payStatus: "reembolsado", items: [{ slug: "console-portatil-400-jogos", qty: 1, price: 159.9 }], shipping: 0, cep: "74900-000", address: "Av. Central, 45", city: "Aparecida de Goiânia", state: "GO" });
  await mkOrder({ email: "ana.ribeiro@email.com", status: "recebido", pay: "pix", payStatus: "pendente", items: [{ slug: "mesa-atividades-educativa", qty: 1, price: 79.9 }, { slug: "squeeze-esportivo-750", qty: 2, variant: "Azul", price: 39.9 }], shipping: 22.5, cep: "74000-000", address: "Rua T-30, 123", city: "Goiânia", state: "GO" });

  // ---------- REVIEWS ----------
  const reviews = [
    { slug: "boneca-bebe-reborn-realista", author: "Ana Paula R.", rating: 5, comment: "Chegou rápido e é linda demais! Minha filha amou, parece um bebê de verdade.", approved: true },
    { slug: "boneca-bebe-reborn-realista", author: "Juliana M.", rating: 4, comment: "Muito bonita, só achei a roupinha um pouco simples. Mas vale a pena.", approved: true },
    { slug: "carrinho-controle-4x4-offroad", author: "Roberto S.", rating: 5, comment: "Meu filho não larga! Bateria dura bastante e é bem resistente.", approved: true },
    { slug: "patinete-3-rodas-luz", author: "Camila F.", rating: 5, comment: "As luzes são um show, super estável. Recomendo!", approved: true },
    { slug: "blocos-montar-200-pecas", author: "Fernanda L.", rating: 5, comment: "Ótima qualidade e encaixam nas peças que já tínhamos. Vieram bem embaladas.", approved: true },
    { slug: "garrafa-termica-infantil-500", author: "Pedro H.", rating: 4, comment: "Gela bem e o canudo é firme. Comprei duas cores.", approved: true },
    { slug: "console-portatil-400-jogos", author: "Marcos A.", rating: 5, comment: "Nostalgia pura! Funciona na TV também. Meninada adorou.", approved: true },
    { slug: "kit-slime-faca-voce-mesmo", author: "Bianca T.", rating: 5, comment: "Rendeu bastante slime, super divertido pra fazer com as crianças.", approved: true },
    { slug: "pelucia-urso-gigante-90", author: "Sandra M.", rating: 5, comment: "Gigante e macio mesmo! Presente perfeito, minha sobrinha amou.", approved: true },
    { slug: "bicicleta-infantil-aro-16", author: "Diego P.", rating: 4, comment: "Bike firme e bonita. A montagem deu um pouco de trabalho mas valeu.", approved: true },
    { slug: "boneca-fashion-cabelo-magico", author: "Aline R.", rating: 5, comment: "O cabelo muda de cor mesmo, ela ficou encantada!", approved: false },
    { slug: "triciclo-velotrol-empurrador", author: "Cliente", rating: 3, comment: "Bom, mas queria mais opções de cor.", approved: false },
  ];
  for (const rv of reviews) {
    await db.review.create({ data: { productId: prodBySlug[rv.slug], author: rv.author, rating: rv.rating, comment: rv.comment, approved: rv.approved, verified: true } });
  }

  // ---------- BANNERS ----------
  await db.banner.createMany({
    data: [
      { title: "Diversão que chega em todo o Brasil", subtitle: "Varejo e atacado · entrega nacional", badge: "💠 Pix com desconto", ctaLabel: "Comprar agora", ctaHref: "/produtos", cta2Label: "Ver ofertas", cta2Href: "/ofertas", bg: "brand", emoji: "🧸", sortOrder: 0, active: true },
      { title: "Novidades toda semana", subtitle: "As últimas tendências em brinquedos", badge: "✨ Recém-chegados", ctaLabel: "Ver novidades", ctaHref: "/produtos?flag=novidades", bg: "grape", emoji: "🎈", sortOrder: 1, active: true },
      { title: "É lojista? Compre no atacado", subtitle: "Preços especiais a partir de R$ 300", badge: "📦 Atacado", ctaLabel: "Criar conta atacado", ctaHref: "/atacado", cta2Label: "Falar no WhatsApp", cta2Href: "whatsapp", bg: "mint", emoji: "🛒", sortOrder: 2, active: true },
    ],
  });

  const counts = {
    categorias: await db.category.count(),
    produtos: await db.product.count(),
    variacoes: await db.productVariant.count(),
    clientes: await db.customer.count(),
    pedidos: await db.order.count(),
    avaliacoes: await db.review.count(),
    banners: await db.banner.count(),
  };
  console.log("✅ Seed concluído:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
