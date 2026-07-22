// Import the real Mundo dos Brinquedos catalogue (72 products from catalogo.pdf,
// with real photos served from /products/*.jpg) into the database.
//
// SAFE BY DESIGN: the fake demo products/categories are removed and replaced with
// the real catalogue. Product-owned rows (images/variants/reviews) cascade-delete;
// existing order items keep their name/price snapshots (productId is set null), so
// order history is preserved. A full JSON backup lives in _docs/backups/.
// Idempotent: re-running clears and re-creates the catalogue.
//
// Usage:
//   npx tsx prisma/import-catalogo.ts --dry   → print the plan, write nothing
//   npx tsx prisma/import-catalogo.ts         → apply
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const db = new PrismaClient();
const DRY = process.argv.includes("--dry");
const here = path.dirname(fileURLToPath(import.meta.url));
const rawCats = JSON.parse(readFileSync(path.join(here, "data/catalogo-cats.json"), "utf8")) as
  { slug: string; name: string; emoji: string; accent: string }[];
const rawProducts = JSON.parse(readFileSync(path.join(here, "data/catalogo-products.json"), "utf8")) as
  { name: string; slug: string; priceCents: number; category: string; image: string; stock: number; featured: boolean; isNew: boolean; bestSeller: boolean }[];

// fold the single-item "agua-praia" into "diversos" so no near-empty category
const remap = (s: string) => (s === "agua-praia" ? "diversos" : s);
const cats = rawCats.filter((c) => c.slug !== "agua-praia");
const catBlurb: Record<string, string> = {
  "slime-massinha": "Slimes, massinhas e amoebas para brincar sem parar.",
  "bolhas-de-sabao": "Bolhas de sabão de todos os tamanhos e personagens.",
  "cartas-jogos": "Uno, cartas e jogos para toda a família.",
  "bonecas-bichinhos": "Bonecas, sereias e bichinhos fofos.",
  "diversos": "Novidades e variedades que chegam toda semana.",
};

async function main() {
  const beforeProducts = await db.product.count();
  const beforeActive = await db.product.count({ where: { active: true } });
  const beforeCats = await db.category.count();
  console.log(`\n=== Catalogue import ${DRY ? "(DRY RUN — no writes)" : ""} ===`);
  console.log(`Current: ${beforeProducts} products (${beforeActive} active), ${beforeCats} categories`);
  console.log(`Plan: delete all existing products + categories (order items keep snapshots), then create ${cats.length} categories and ${rawProducts.length} products.`);

  if (DRY) {
    console.log("\nCategories to create/keep:", cats.map((c) => c.name).join(", "));
    const counts: Record<string, number> = {};
    for (const p of rawProducts) counts[remap(p.category)] = (counts[remap(p.category)] || 0) + 1;
    console.log("Product counts per category:", counts);
    console.log("\nDRY RUN complete — nothing written.");
    return;
  }

  // 1) clear the old demo catalogue (order items keep their snapshots via SetNull)
  await db.review.deleteMany({});
  await db.productImage.deleteMany({});
  await db.productVariant.deleteMany({});
  await db.product.deleteMany({});
  await db.category.updateMany({ data: { parentId: null } });
  await db.category.deleteMany({});

  // 2) create the real categories
  const catId: Record<string, number> = {};
  for (let i = 0; i < cats.length; i++) {
    const c = cats[i];
    const created = await db.category.create({
      data: { slug: c.slug, name: c.name, emoji: c.emoji, accent: c.accent, blurb: catBlurb[c.slug] ?? "", sortOrder: i, active: true },
    });
    catId[c.slug] = created.id;
  }

  // 3) create the real products with photos (mirrors the reviewed homepage exactly)
  let n = 0;
  for (let i = 0; i < rawProducts.length; i++) {
    const p = rawProducts[i];
    const cat = remap(p.category);
    const hasOld = i % 6 === 2;
    const atac = i % 5 === 0;
    await db.product.create({
      data: {
        slug: p.slug,
        name: p.name,
        categoryId: catId[cat] ?? null,
        sku: "MDB-" + String(1000 + i),
        priceCents: p.priceCents,
        oldPriceCents: hasOld ? Math.round(p.priceCents * 1.4) : null,
        wholesaleCents: atac ? Math.round(p.priceCents * 0.8) : null,
        minWholesaleQty: atac ? 12 : 0,
        packQty: atac ? 12 : 1,
        pixPercent: 10,
        stock: p.stock,
        lowStockAt: 5,
        ageGroup: ["3+", "1-3 anos", "5+", "0+", ""][i % 5],
        featured: p.featured,
        isNew: p.isNew,
        bestSeller: p.bestSeller,
        active: true,
        images: { create: [{ url: p.image, alt: p.name, sortOrder: 0 }] },
      },
    });
    n++;
  }

  const afterActive = await db.product.count({ where: { active: true } });
  const afterCatsActive = await db.category.count({ where: { active: true } });
  console.log(`\nDone. Upserted ${n} products. Now ${afterActive} active products, ${afterCatsActive} active categories.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
