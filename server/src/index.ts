import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";
import { cartTier, unitForTier, type Tier } from "./pricing.js";

const db = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

const PORT = Number(process.env.PORT ?? 4210);
const ADMIN_KEY = process.env.ADMIN_KEY ?? "mundo123";

// ---- helpers ----
const num = (v: unknown, d = 0) => (v === undefined || v === null || v === "" ? d : Number(v));
const bool = (v: unknown) => v === true || v === "true" || v === 1;
const str = (v: unknown, d = "") => (v === undefined || v === null ? d : String(v));
const asyncH =
  (fn: (req: express.Request, res: express.Response) => Promise<unknown>) =>
  (req: express.Request, res: express.Response) =>
    fn(req, res).catch((e) => {
      console.error(e);
      res.status(500).json({ error: "Erro interno do servidor." });
    });

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.header("x-admin-key") !== ADMIN_KEY) return res.status(401).json({ error: "Acesso negado." });
  next();
}

// productInclude for storefront
const withMedia = { images: { orderBy: { sortOrder: "asc" as const } }, variants: true, category: true };

// ============================================================ PUBLIC
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/settings", asyncH(async (_req, res) => {
  const rows = await db.setting.findMany();
  res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
}));

app.get("/api/banners", asyncH(async (_req, res) => {
  res.json(await db.banner.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }));
}));

app.get("/api/categories", asyncH(async (_req, res) => {
  const cats = await db.category.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });
  res.json(cats);
}));

// list products with filters + sort (JS sort — small catalog)
app.get("/api/products", asyncH(async (req, res) => {
  const { category, q, flag, available, sort, page, pageSize } = req.query;
  const where: Record<string, unknown> = { active: true };
  if (category) where.category = { slug: String(category) };
  if (flag === "novidades") where.isNew = true;
  if (flag === "mais-vendidos") where.bestSeller = true;
  if (flag === "destaque") where.featured = true;
  if (bool(available)) where.stock = { gt: 0 };
  if (q) {
    const term = String(q);
    where.OR = [
      { name: { contains: term } },
      { nameEn: { contains: term } },
      { brand: { contains: term } },
      { sku: { contains: term } },
      { description: { contains: term } },
    ];
  }
  const raw = await db.product.findMany({
    where,
    include: { ...withMedia, reviews: { where: { approved: true }, select: { rating: true } } },
  });
  // Attach avgRating + reviewCount, drop raw reviews from the list payload.
  let items = raw.map((p) => {
    const rs = p.reviews;
    const avgRating = rs.length ? rs.reduce((s, r) => s + r.rating, 0) / rs.length : 0;
    const { reviews: _reviews, ...rest } = p;
    return { ...rest, avgRating, reviewCount: rs.length };
  });
  if (flag === "ofertas") items = items.filter((p) => p.oldPriceCents && p.oldPriceCents > p.priceCents);

  const discount = (p: (typeof items)[number]) =>
    p.oldPriceCents && p.oldPriceCents > p.priceCents ? 1 - p.priceCents / p.oldPriceCents : 0;
  const s = String(sort ?? "relevancia");
  items.sort((a, b) => {
    if (s === "menor-preco") return a.priceCents - b.priceCents;
    if (s === "maior-preco") return b.priceCents - a.priceCents;
    if (s === "novidades") return +b.isNew - +a.isNew || b.createdAt.getTime() - a.createdAt.getTime();
    if (s === "mais-vendidos") return +b.bestSeller - +a.bestSeller || b.priceCents - a.priceCents;
    if (s === "maiores-descontos") return discount(b) - discount(a);
    if (s === "melhor-avaliados") return b.avgRating - a.avgRating || b.reviewCount - a.reviewCount;
    // relevancia
    return +b.featured - +a.featured || +b.bestSeller - +a.bestSeller || b.createdAt.getTime() - a.createdAt.getTime();
  });

  const total = items.length;
  const ps = num(pageSize, 24);
  const pg = num(page, 1);
  res.json({ total, items: items.slice((pg - 1) * ps, pg * ps) });
}));

app.get("/api/products/:slug", asyncH(async (req, res) => {
  const product = await db.product.findUnique({
    where: { slug: req.params.slug },
    include: { ...withMedia, reviews: { where: { approved: true }, orderBy: { createdAt: "desc" } } },
  });
  if (!product) return res.status(404).json({ error: "Produto não encontrado." });
  const related = await db.product.findMany({
    where: { active: true, categoryId: product.categoryId, id: { not: product.id } },
    include: withMedia,
    take: 8,
  });
  res.json({ product, related });
}));

app.post("/api/reviews", asyncH(async (req, res) => {
  const b = req.body ?? {};
  const productId = num(b.productId);
  const rating = Math.max(1, Math.min(5, num(b.rating, 5)));
  if (!productId || !str(b.author).trim()) return res.status(400).json({ error: "Informe seu nome e a nota." });
  const rv = await db.review.create({
    data: { productId, author: str(b.author).slice(0, 60), rating, comment: str(b.comment).slice(0, 800), approved: false, verified: false },
  });
  res.status(201).json({ ok: true, id: rv.id, message: "Avaliação enviada! Será publicada após aprovação." });
}));

// checkout — validate stock, compute totals, decrement, create order
app.post("/api/orders", asyncH(async (req, res) => {
  const b = req.body ?? {};
  const items: { productId: number; qty: number; variant?: string }[] = Array.isArray(b.items) ? b.items : [];
  if (!items.length) return res.status(400).json({ error: "Seu carrinho está vazio." });
  if (!str(b.name).trim() || !str(b.phone).trim()) return res.status(400).json({ error: "Informe nome e telefone." });

  const ids = items.map((i) => num(i.productId));
  const prods = await db.product.findMany({ where: { id: { in: ids } } });
  const kind = str(b.kind, "varejo");

  // Resolve every line against the DB, then apply the cart-wide price tier.
  // Prices are ALWAYS recomputed here — the client never sets prices.
  const valid: { p: (typeof prods)[number]; qty: number; variant: string }[] = [];
  for (const it of items) {
    const p = prods.find((x) => x.id === num(it.productId));
    if (!p) return res.status(400).json({ error: "Produto indisponível no carrinho." });
    valid.push({ p, qty: Math.max(1, num(it.qty, 1)), variant: str(it.variant) });
  }
  const thresholdRow = await db.setting.findUnique({ where: { key: "wholesaleThresholdCents" } });
  const thresholdCents = Number(thresholdRow?.value ?? 30000) || 0;
  const totalItems = valid.reduce((s, l) => s + l.qty, 0);
  const grossCents = valid.reduce((s, l) => s + l.p.priceCents * l.qty, 0);
  // approved wholesale orders always get the best (tier 3) price; everyone else follows the cart tier
  const tier: Tier = kind === "atacado" ? 3 : cartTier(totalItems, grossCents, thresholdCents);

  let subtotal = 0;
  const orderItems: { productId: number; name: string; variant: string; priceCents: number; qty: number }[] = [];
  for (const { p, qty, variant } of valid) {
    if (p.stock < qty) return res.status(409).json({ error: `Estoque insuficiente para ${p.name}. Restam ${p.stock}.` });
    const unit = unitForTier({ regularCents: p.priceCents, price10Cents: p.price10Cents, wholesaleCents: p.wholesaleCents }, tier);
    subtotal += unit * qty;
    orderItems.push({ productId: p.id, name: p.name, variant, priceCents: unit, qty });
  }

  const shippingCents = Math.max(0, num(b.shippingCents, 0));
  const discountCents = Math.min(Math.max(0, num(b.discountCents, 0)), subtotal); // never exceed the subtotal
  const total = subtotal - discountCents + shippingCents;

  const count = await db.order.count();
  const code = `MDB-2026-${String(count + 1).padStart(4, "0")}`;

  const order = await db.$transaction(async (tx) => {
    for (const it of orderItems) await tx.product.update({ where: { id: it.productId }, data: { stock: { decrement: it.qty } } });
    return tx.order.create({
      data: {
        code, customerName: str(b.name), customerPhone: str(b.phone), customerEmail: str(b.email), kind,
        status: "recebido", paymentMethod: str(b.paymentMethod, "pix"), paymentStatus: "pendente",
        subtotalCents: subtotal, discountCents, shippingCents, totalCents: total,
        cep: str(b.cep), address: str(b.address), city: str(b.city), state: str(b.state), note: str(b.note),
        items: { create: orderItems },
      },
      include: { items: true },
    });
  });
  res.status(201).json(order);
}));

app.get("/api/track", asyncH(async (req, res) => {
  const code = str(req.query.code).trim().toUpperCase();
  const contact = str(req.query.contact).trim().toLowerCase();
  if (!code) return res.status(400).json({ error: "Informe o número do pedido." });
  const order = await db.order.findUnique({ where: { code }, include: { items: true } });
  if (!order) return res.status(404).json({ error: "Pedido não encontrado." });
  const ok =
    !contact ||
    order.customerEmail.toLowerCase() === contact ||
    order.customerPhone.replace(/\D/g, "").includes(contact.replace(/\D/g, "")) ;
  if (!ok) return res.status(403).json({ error: "Dados não conferem com o pedido." });
  res.json(order);
}));

// ============================================================ ADMIN
app.use("/api/admin", requireAdmin);

app.get("/api/admin/overview", asyncH(async (_req, res) => {
  const orders = await db.order.findMany({ include: { items: true } });
  const paid = orders.filter((o) => o.paymentStatus === "pago");
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const products = await db.product.findMany();
  res.json({
    ordersTotal: orders.length,
    pending: orders.filter((o) => o.paymentStatus === "pendente").length,
    awaitingShipment: orders.filter((o) => ["pago", "em_separacao", "embalado"].includes(o.status)).length,
    revenueCents: paid.reduce((s, o) => s + o.totalCents, 0),
    revenueMonthCents: paid.filter((o) => o.createdAt >= monthStart).reduce((s, o) => s + o.totalCents, 0),
    avgTicketCents: paid.length ? Math.round(paid.reduce((s, o) => s + o.totalCents, 0) / paid.length) : 0,
    retailCents: paid.filter((o) => o.kind === "varejo").reduce((s, o) => s + o.totalCents, 0),
    wholesaleCents: paid.filter((o) => o.kind === "atacado").reduce((s, o) => s + o.totalCents, 0),
    productsTotal: products.length,
    lowStock: products.filter((p) => p.stock > 0 && p.stock <= p.lowStockAt).length,
    outStock: products.filter((p) => p.stock === 0).length,
    customers: await db.customer.count(),
    wholesalePending: await db.customer.count({ where: { wholesaleStatus: "pending" } }),
    reviewsPending: await db.review.count({ where: { approved: false } }),
  });
}));

// ---------- admin: products ----------
function productData(b: Record<string, unknown>) {
  return {
    slug: str(b.slug), name: str(b.name), brand: str(b.brand), sku: str(b.sku), description: str(b.description),
    categoryId: b.categoryId ? num(b.categoryId) : null,
    priceCents: num(b.priceCents), oldPriceCents: b.oldPriceCents ? num(b.oldPriceCents) : null,
    costCents: num(b.costCents),
    price10Cents: b.price10Cents ? num(b.price10Cents) : null,
    wholesaleCents: b.wholesaleCents ? num(b.wholesaleCents) : null,
    pixPercent: num(b.pixPercent, 10), stock: num(b.stock), lowStockAt: num(b.lowStockAt, 5),
    minWholesaleQty: num(b.minWholesaleQty), packQty: num(b.packQty, 1), installmentsMax: num(b.installmentsMax, 12),
    subcat: str(b.subcat), ageGroup: str(b.ageGroup), material: str(b.material), weightGrams: num(b.weightGrams), warranty: str(b.warranty),
    featured: bool(b.featured), isNew: bool(b.isNew), bestSeller: bool(b.bestSeller),
    wholesaleOnly: bool(b.wholesaleOnly), active: b.active === undefined ? true : bool(b.active),
  };
}

app.get("/api/admin/products", asyncH(async (req, res) => {
  const q = req.query as Record<string, string>;
  const page = Math.max(1, num(q.page, 1));
  const pageSize = Math.min(200, Math.max(1, num(q.pageSize, 24)));
  const term = str(q.q).trim();
  const mode = "insensitive" as const;
  const where: Record<string, unknown> = {};
  const AND: Record<string, unknown>[] = [];
  if (term) AND.push({ OR: [
    { name: { contains: term, mode } }, { sku: { contains: term, mode } }, { subcat: { contains: term, mode } },
    { brand: { contains: term, mode } }, { description: { contains: term, mode } }, { category: { name: { contains: term, mode } } },
  ] });
  if (q.category) AND.push({ category: { slug: q.category } });
  if (q.subcat) AND.push({ subcat: q.subcat });
  if (q.brand) AND.push({ brand: q.brand });
  if (q.status === "active") AND.push({ active: true });
  if (q.status === "hidden") AND.push({ active: false });
  if (q.stock === "in") AND.push({ stock: { gt: 0 } });
  if (q.stock === "out") AND.push({ stock: { lte: 0 } });
  if (q.stock === "low") AND.push({ AND: [{ stock: { gt: 0 } }, { stock: { lte: 5 } }] });
  if (q.flag === "new") AND.push({ isNew: true });
  if (q.flag === "featured") AND.push({ featured: true });
  if (q.flag === "best") AND.push({ bestSeller: true });
  if (q.flag === "promo") AND.push({ oldPriceCents: { not: null } });
  if (q.tier === "has10") AND.push({ price10Cents: { not: null } });
  if (q.tier === "hasWholesale") AND.push({ wholesaleCents: { not: null } });
  if (q.missing === "image") AND.push({ images: { none: {} } });
  if (q.missing === "price") AND.push({ priceCents: { lte: 0 } });
  if (q.missing === "category") AND.push({ categoryId: null });
  if (q.missing === "sku") AND.push({ sku: "" });
  if (q.priceMin) AND.push({ priceCents: { gte: num(q.priceMin) } });
  if (q.priceMax) AND.push({ priceCents: { lte: num(q.priceMax) } });
  if (AND.length) where.AND = AND;
  if (q.idsOnly) { const rows = await db.product.findMany({ where, select: { id: true } }); return res.json({ ids: rows.map((r) => r.id) }); }
  const s = str(q.sort, "recent");
  const orderBy =
    s === "name" ? { name: "asc" as const } :
    s === "price_asc" ? { priceCents: "asc" as const } : s === "price_desc" ? { priceCents: "desc" as const } :
    s === "stock_asc" ? { stock: "asc" as const } : s === "stock_desc" ? { stock: "desc" as const } :
    s === "oldest" ? { createdAt: "asc" as const } : s === "updated" ? { updatedAt: "desc" as const } :
    s === "best" ? { bestSeller: "desc" as const } : { createdAt: "desc" as const };
  const [items, total] = await Promise.all([
    db.product.findMany({ where, include: withMedia, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
    db.product.count({ where }),
  ]);
  res.json({ items, total, page, pageSize });
}));
// Duplicate-prevention: warn when a product name / barcode / image already exists
app.get("/api/admin/products/check", asyncH(async (req, res) => {
  const q = req.query as Record<string, string>;
  const name = str(q.name).trim(), sku = str(q.sku).trim(), image = str(q.image).trim();
  const or: Record<string, unknown>[] = [];
  if (name) or.push({ name: { equals: name, mode: "insensitive" } });
  if (sku) or.push({ sku });
  if (image) or.push({ images: { some: { url: image } } });
  if (!or.length) return res.json({ matches: [] });
  const matches = await db.product.findMany({ where: { OR: or, ...(q.excludeId ? { id: { not: num(q.excludeId) } } : {}) }, select: { id: true, name: true, sku: true }, take: 5 });
  res.json({ matches });
}));
app.get("/api/admin/products/:id", asyncH(async (req, res) => {
  const p = await db.product.findUnique({ where: { id: num(req.params.id) }, include: withMedia });
  if (!p) return res.status(404).json({ error: "Produto não encontrado." });
  res.json(p);
}));
app.post("/api/admin/products", asyncH(async (req, res) => {
  const b = req.body ?? {};
  const images: { url: string; alt?: string }[] = Array.isArray(b.images) ? b.images : [];
  const variants: Record<string, unknown>[] = Array.isArray(b.variants) ? b.variants : [];
  const p = await db.product.create({
    data: {
      ...productData(b),
      images: { create: images.map((im, i) => ({ url: str(im.url), alt: str(im.alt), sortOrder: i })) },
      variants: { create: variants.map((v) => ({ kind: str(v.kind), label: str(v.label), swatch: str(v.swatch), stock: num(v.stock), priceDeltaCents: num(v.priceDeltaCents) })) },
    },
    include: withMedia,
  });
  res.status(201).json(p);
}));
// Partial "quick edit" from the list — only updates the fields provided (never wipes others)
app.patch("/api/admin/products/:id/quick", asyncH(async (req, res) => {
  const b = req.body ?? {};
  const data: Record<string, unknown> = {};
  const nn = (v: unknown) => (v === null || v === "" ? null : num(v));
  if (b.stock !== undefined) data.stock = num(b.stock);
  if (b.lowStockAt !== undefined) data.lowStockAt = num(b.lowStockAt);
  if (b.priceCents !== undefined) data.priceCents = num(b.priceCents);
  if (b.price10Cents !== undefined) data.price10Cents = nn(b.price10Cents);
  if (b.wholesaleCents !== undefined) data.wholesaleCents = nn(b.wholesaleCents);
  if (b.oldPriceCents !== undefined) data.oldPriceCents = nn(b.oldPriceCents);
  if (b.active !== undefined) data.active = bool(b.active);
  if (b.featured !== undefined) data.featured = bool(b.featured);
  if (b.isNew !== undefined) data.isNew = bool(b.isNew);
  if (b.bestSeller !== undefined) data.bestSeller = bool(b.bestSeller);
  if (b.categoryId !== undefined) data.categoryId = b.categoryId ? num(b.categoryId) : null;
  if (b.subcat !== undefined) data.subcat = str(b.subcat);
  if (!Object.keys(data).length) return res.json({ ok: true });
  const p = await db.product.update({ where: { id: num(req.params.id) }, data, include: withMedia });
  res.json(p);
}));
app.patch("/api/admin/products/:id", asyncH(async (req, res) => {
  const id = num(req.params.id);
  const b = req.body ?? {};
  await db.product.update({ where: { id }, data: productData(b) });
  if (Array.isArray(b.images)) {
    await db.productImage.deleteMany({ where: { productId: id } });
    await db.productImage.createMany({ data: b.images.map((im: Record<string, unknown>, i: number) => ({ productId: id, url: str(im.url), alt: str(im.alt), sortOrder: i })) });
  }
  if (Array.isArray(b.variants)) {
    await db.productVariant.deleteMany({ where: { productId: id } });
    await db.productVariant.createMany({ data: b.variants.map((v: Record<string, unknown>) => ({ productId: id, kind: str(v.kind), label: str(v.label), swatch: str(v.swatch), stock: num(v.stock), priceDeltaCents: num(v.priceDeltaCents) })) });
  }
  res.json(await db.product.findUnique({ where: { id }, include: withMedia }));
}));
app.delete("/api/admin/products/:id", asyncH(async (req, res) => {
  await db.product.delete({ where: { id: num(req.params.id) } });
  res.json({ ok: true });
}));
// Bulk actions on selected products (ids resolved on the client, incl. "select all filtered")
app.post("/api/admin/products/bulk", asyncH(async (req, res) => {
  const b = req.body ?? {};
  const action = str(b.action);
  const ids: number[] = Array.isArray(b.ids) ? (b.ids as unknown[]).map((x) => num(x)).filter(Boolean) : [];
  if (!ids.length) return res.json({ affected: 0 });
  const where = { id: { in: ids } };
  const up = (c: number) => res.json({ affected: c });
  if (action === "setCategory") return up((await db.product.updateMany({ where, data: { categoryId: b.categoryId ? num(b.categoryId) : null } })).count);
  if (action === "setSubcat") return up((await db.product.updateMany({ where, data: { subcat: str(b.subcat) } })).count);
  if (action === "setStock") return up((await db.product.updateMany({ where, data: { stock: num(b.stock) } })).count);
  if (action === "clearPromo") return up((await db.product.updateMany({ where, data: { oldPriceCents: null } })).count);
  if (action === "delete") return up((await db.product.deleteMany({ where })).count);
  if (action === "setFlags") {
    const data: Record<string, boolean> = {};
    for (const k of ["isNew", "featured", "bestSeller", "active", "wholesaleOnly"]) if (b[k] !== undefined) data[k] = bool(b[k]);
    return up((await db.product.updateMany({ where, data })).count);
  }
  // price-dependent actions — group by priceCents so we do few updateMany calls
  if (["adjustPrice", "setTier2", "setTier3", "setPromo"].includes(action)) {
    const rows = await db.product.findMany({ where, select: { id: true, priceCents: true } });
    const groups: Record<number, number[]> = {};
    for (const r of rows) (groups[r.priceCents] ??= []).push(r.id);
    const p = num(b.percent);
    let affected = 0;
    for (const [priceStr, gids] of Object.entries(groups)) {
      const price = Number(priceStr);
      let data: Record<string, number | null> = {};
      if (action === "adjustPrice") data = { priceCents: Math.max(0, Math.round(price * (1 + p / 100))) };
      if (action === "setTier2") data = { price10Cents: Math.max(0, Math.round(price * (1 - Math.abs(p) / 100))) };
      if (action === "setTier3") data = { wholesaleCents: Math.max(0, Math.round(price * (1 - Math.abs(p) / 100))) };
      if (action === "setPromo") data = { oldPriceCents: Math.round(price / (1 - Math.min(90, Math.abs(p)) / 100)) };
      for (let i = 0; i < gids.length; i += 300) affected += (await db.product.updateMany({ where: { id: { in: gids.slice(i, i + 300) } }, data })).count;
    }
    return up(affected);
  }
  if (action === "duplicate") {
    const full = await db.product.findMany({ where, include: withMedia });
    let created = 0;
    for (const p of full) {
      await db.product.create({ data: { ...productData({ ...p, slug: `${p.slug}-copia-${Date.now().toString().slice(-5)}-${p.id}`, name: `${p.name} (cópia)` }), images: { create: p.images.map((im, i) => ({ url: im.url, alt: im.alt, sortOrder: i })) } } });
      created++;
    }
    return up(created);
  }
  res.status(400).json({ error: "Ação inválida." });
}));
// CSV/Excel import — send parsed rows; dry=true returns a review (create/update/skip/duplicate), else applies.
app.post("/api/admin/products/import", asyncH(async (req, res) => {
  const b = req.body ?? {};
  const rows: Record<string, unknown>[] = Array.isArray(b.rows) ? b.rows : [];
  const dry = bool(b.dry);
  const skipDup = b.skipDuplicates === undefined ? true : bool(b.skipDuplicates);
  const cats = await db.category.findMany({ select: { id: true, slug: true, name: true } });
  const catBy = (v: string) => { const s = v.trim().toLowerCase(); return cats.find((c) => c.slug.toLowerCase() === s || c.name.toLowerCase() === s)?.id ?? null; };
  const truthy = (v: unknown) => ["true", "1", "sim", "yes", "verdadeiro", "x", "y"].includes(String(v ?? "").toLowerCase().trim());
  const money = (v: unknown) => { const n = parseFloat(String(v ?? "").replace(/[^0-9.,-]/g, "").replace(",", ".")); return isNaN(n) ? null : Math.round(n * 100); };
  const slugify = (s: string, extra: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 50) + "-" + extra;
  const results: { row: number; action: string; name: string; id?: number; msg?: string }[] = [];
  const summary = { create: 0, update: 0, duplicate: 0, error: 0 };
  let i = 0;
  for (const r of rows) {
    i++;
    const name = str(r.nome ?? r.name).trim();
    if (!name) { results.push({ row: i, action: "error", name: "", msg: "Sem nome" }); summary.error++; continue; }
    const priceCents = money(r.preco ?? r.price);
    if (priceCents == null) { results.push({ row: i, action: "error", name, msg: "Preço inválido" }); summary.error++; continue; }
    const sku = str(r.codigo ?? r.sku).trim();
    const idVal = r.id ? num(r.id) : 0;
    const data = {
      name, sku, subcat: str(r.subcategoria ?? r.subcat), categoryId: catBy(str(r.categoria ?? r.category)),
      priceCents, price10Cents: money(r.preco10), wholesaleCents: money(r.atacado ?? r.wholesale),
      stock: num(r.estoque ?? r.stock, 0), pixPercent: 10,
      active: r.ativo === undefined ? true : truthy(r.ativo), isNew: truthy(r.novo), featured: truthy(r.destaque), bestSeller: truthy(r.top ?? r.bestSeller),
    };
    // find existing: id → sku → (name = duplicate)
    let existing = idVal ? await db.product.findUnique({ where: { id: idVal } }) : null;
    if (!existing && sku) existing = await db.product.findFirst({ where: { sku } });
    if (existing) {
      if (!dry) await db.product.update({ where: { id: existing.id }, data });
      results.push({ row: i, action: "update", name, id: existing.id }); summary.update++; continue;
    }
    const byName = await db.product.findFirst({ where: { name: { equals: name, mode: "insensitive" } }, select: { id: true } });
    if (byName) {
      summary.duplicate++;
      if (skipDup) { results.push({ row: i, action: "duplicate", name, id: byName.id, msg: "Nome já existe — ignorado" }); continue; }
      // treat as new anyway
    }
    if (!dry) {
      const img = str(r.imagem ?? r.image).trim();
      await db.product.create({ data: { ...data, slug: slugify(name, String(Date.now()).slice(-6) + "-" + i), ...(img ? { images: { create: [{ url: img, alt: name, sortOrder: 0 }] } } : {}) } });
    }
    results.push({ row: i, action: "create", name }); summary.create++;
  }
  res.json({ summary, results: results.slice(0, 500), total: rows.length });
}));

// ---------- admin: categories ----------
app.get("/api/admin/categories", asyncH(async (_req, res) => {
  res.json(await db.category.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: true } } } }));
}));
app.post("/api/admin/categories", asyncH(async (req, res) => {
  const b = req.body ?? {};
  res.status(201).json(await db.category.create({ data: { slug: str(b.slug), name: str(b.name), emoji: str(b.emoji, "🧸"), accent: str(b.accent, "brand"), blurb: str(b.blurb), parentId: b.parentId ? num(b.parentId) : null, sortOrder: num(b.sortOrder), active: b.active === undefined ? true : bool(b.active) } }));
}));
app.patch("/api/admin/categories/:id", asyncH(async (req, res) => {
  const b = req.body ?? {};
  const data: Record<string, unknown> = {};
  for (const k of ["slug", "name", "emoji", "accent", "blurb"]) if (b[k] !== undefined) data[k] = str(b[k]);
  if (b.sortOrder !== undefined) data.sortOrder = num(b.sortOrder);
  if (b.active !== undefined) data.active = bool(b.active);
  res.json(await db.category.update({ where: { id: num(req.params.id) }, data }));
}));
app.delete("/api/admin/categories/:id", asyncH(async (req, res) => {
  await db.category.delete({ where: { id: num(req.params.id) } });
  res.json({ ok: true });
}));

// ---------- admin: banners ----------
app.get("/api/admin/banners", asyncH(async (_req, res) => res.json(await db.banner.findMany({ orderBy: { sortOrder: "asc" } }))));
app.post("/api/admin/banners", asyncH(async (req, res) => {
  const b = req.body ?? {};
  res.status(201).json(await db.banner.create({ data: bannerData(b) }));
}));
app.patch("/api/admin/banners/:id", asyncH(async (req, res) => {
  res.json(await db.banner.update({ where: { id: num(req.params.id) }, data: bannerData(req.body ?? {}) }));
}));
app.delete("/api/admin/banners/:id", asyncH(async (req, res) => {
  await db.banner.delete({ where: { id: num(req.params.id) } });
  res.json({ ok: true });
}));
function bannerData(b: Record<string, unknown>) {
  return {
    title: str(b.title), subtitle: str(b.subtitle), badge: str(b.badge),
    ctaLabel: str(b.ctaLabel), ctaHref: str(b.ctaHref), cta2Label: str(b.cta2Label), cta2Href: str(b.cta2Href),
    bg: str(b.bg, "brand"), emoji: str(b.emoji, "🧸"), sortOrder: num(b.sortOrder), active: b.active === undefined ? true : bool(b.active),
  };
}

// ---------- admin: orders ----------
app.get("/api/admin/orders", asyncH(async (req, res) => {
  const where: Record<string, unknown> = {};
  if (req.query.status) where.status = String(req.query.status);
  if (req.query.q) {
    const term = String(req.query.q);
    where.OR = [{ code: { contains: term } }, { customerName: { contains: term } }, { customerPhone: { contains: term } }, { customerEmail: { contains: term } }];
  }
  res.json(await db.order.findMany({ where, include: { items: true }, orderBy: { createdAt: "desc" } }));
}));
app.get("/api/admin/orders/:id", asyncH(async (req, res) => {
  const o = await db.order.findUnique({ where: { id: num(req.params.id) }, include: { items: true, customer: true } });
  if (!o) return res.status(404).json({ error: "Pedido não encontrado." });
  res.json(o);
}));
app.patch("/api/admin/orders/:id", asyncH(async (req, res) => {
  const b = req.body ?? {};
  const data: Record<string, unknown> = {};
  for (const k of ["status", "paymentStatus", "trackingCode", "note"]) if (b[k] !== undefined) data[k] = str(b[k]);
  res.json(await db.order.update({ where: { id: num(req.params.id) }, data, include: { items: true } }));
}));

// ---------- admin: customers ----------
app.get("/api/admin/customers", asyncH(async (_req, res) => {
  const list = await db.customer.findMany({ orderBy: { createdAt: "desc" }, include: { orders: true } });
  res.json(list.map((c) => ({ ...c, ordersCount: c.orders.length, spentCents: c.orders.filter((o) => o.paymentStatus === "pago").reduce((s, o) => s + o.totalCents, 0), orders: undefined })));
}));
app.patch("/api/admin/customers/:id", asyncH(async (req, res) => {
  const b = req.body ?? {};
  const data: Record<string, unknown> = {};
  for (const k of ["wholesaleStatus", "kind", "notes", "name", "phone", "businessName"]) if (b[k] !== undefined) data[k] = str(b[k]);
  res.json(await db.customer.update({ where: { id: num(req.params.id) }, data }));
}));

// ---------- admin: reviews ----------
app.get("/api/admin/reviews", asyncH(async (_req, res) => {
  res.json(await db.review.findMany({ orderBy: { createdAt: "desc" }, include: { product: { select: { name: true, slug: true } } } }));
}));
app.patch("/api/admin/reviews/:id", asyncH(async (req, res) => {
  res.json(await db.review.update({ where: { id: num(req.params.id) }, data: { approved: bool((req.body ?? {}).approved) } }));
}));
app.delete("/api/admin/reviews/:id", asyncH(async (req, res) => {
  await db.review.delete({ where: { id: num(req.params.id) } });
  res.json({ ok: true });
}));

// ---------- admin: settings ----------
app.get("/api/admin/settings", asyncH(async (_req, res) => {
  const rows = await db.setting.findMany();
  res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
}));
app.put("/api/admin/settings", asyncH(async (req, res) => {
  const b = req.body ?? {};
  for (const [key, value] of Object.entries(b)) await db.setting.upsert({ where: { key }, create: { key, value: String(value) }, update: { value: String(value) } });
  res.json({ ok: true });
}));

// In production, serve the built web app from this same service (API + site).
// Locally we use the Vite dev server (5310), so this only kicks in if the build exists.
const webDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../web/dist");
if (fs.existsSync(webDist)) {
  app.use(express.static(webDist));
  // SPA fallback for any non-API route
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(webDist, "index.html")));
}

app.listen(PORT, () => console.log(`🧸 Mundo API on http://localhost:${PORT}`));
