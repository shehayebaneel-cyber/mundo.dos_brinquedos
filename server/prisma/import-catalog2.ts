// Import the real shop catalog: 5 categories + all products extracted from the
// owner's five catalogst.com catalogues (name, price, photo, code, stock).
// SAFE: clears the demo catalog and recreates it; order items keep their
// snapshots (productId → null). Bulk inserts for speed. Idempotent.
//   npx tsx prisma/import-catalog2.ts --dry   → plan only
//   npx tsx prisma/import-catalog2.ts         → apply
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const db = new PrismaClient();
const DRY = process.argv.includes("--dry");
const here = path.dirname(fileURLToPath(import.meta.url));
const cats = JSON.parse(readFileSync(path.join(here, "data/catalog-cats.json"), "utf8")) as
  { slug: string; name: string; emoji: string; accent: string; blurb: string }[];
const prods = JSON.parse(readFileSync(path.join(here, "data/catalog-full.json"), "utf8")) as
  { name: string; slug: string; category: string; priceCents: number; sku: string; stock: number; image: string; featured: boolean; isNew: boolean; bestSeller: boolean }[];

async function main() {
  const byCat: Record<string, number> = {};
  for (const p of prods) byCat[p.category] = (byCat[p.category] || 0) + 1;
  console.log(`\n=== Catalog import ${DRY ? "(DRY)" : ""} — ${prods.length} products, ${cats.length} categories ===`);
  console.log(byCat);
  console.log("Current:", await db.product.count(), "products,", await db.category.count(), "categories");
  if (DRY) return;

  // clear old catalog
  await db.review.deleteMany({});
  await db.productImage.deleteMany({});
  await db.productVariant.deleteMany({});
  await db.product.deleteMany({});
  await db.category.updateMany({ data: { parentId: null } });
  await db.category.deleteMany({});

  // categories
  const catId: Record<string, number> = {};
  for (let i = 0; i < cats.length; i++) {
    const c = cats[i];
    const created = await db.category.create({ data: { slug: c.slug, name: c.name, emoji: c.emoji, accent: c.accent, blurb: c.blurb, sortOrder: i, active: true } });
    catId[c.slug] = created.id;
  }

  // products (bulk)
  const rows = prods.map((p) => ({
    slug: p.slug, name: p.name, categoryId: catId[p.category] ?? null, sku: p.sku,
    priceCents: p.priceCents, stock: p.stock, lowStockAt: 5, pixPercent: 10,
    featured: p.featured, isNew: p.isNew, bestSeller: p.bestSeller, active: true,
  }));
  for (let i = 0; i < rows.length; i += 200) await db.product.createMany({ data: rows.slice(i, i + 200), skipDuplicates: true });

  // images (need product ids → map by slug)
  const created = await db.product.findMany({ select: { id: true, slug: true } });
  const idBySlug = Object.fromEntries(created.map((c) => [c.slug, c.id]));
  const imgRows = prods.filter((p) => p.image && idBySlug[p.slug]).map((p) => ({ productId: idBySlug[p.slug], url: p.image, alt: p.name, sortOrder: 0 }));
  for (let i = 0; i < imgRows.length; i += 300) await db.productImage.createMany({ data: imgRows.slice(i, i + 300) });

  console.log(`Done. ${await db.product.count()} products, ${await db.productImage.count()} images, ${await db.category.count()} categories.`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
