/**
 * Bulk-import products from the WhatsApp catalogue screenshots.
 * Reads every catalog-batches/batch-*.json ({ rows: Row[] }), merges + dedupes
 * by slug, creates the client's real categories, upserts products, and hides
 * leftover sample products + empty categories. No-price products = draft (hidden).
 *
 * Run: cd server && npx tsx import-catalog.ts
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
const db = new PrismaClient();

const r = (reais: number) => Math.round(reais * 100);
const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 70);
const stripEmoji = (s: string) =>
  s.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{FE0F}\u{200D}]/gu, "").replace(/\s+/g, " ").trim();
// distinct products share a base name but differ by note (e.g. "8 Peças") -> key by name+note
const keyOf = (name: string, note?: string) => slugify(`${name} ${stripEmoji(note ?? "")}`);
// short notes become part of the display name so cards read distinctly
const displayName = (name: string, note?: string) => {
  const c = stripEmoji(note ?? "");
  return c && c.length <= 22 ? `${name} — ${c}` : name;
};

type Row = { name: string; price?: number; old?: number; brand?: string; note?: string; cat?: string };

// category emoji by keyword
const catEmoji = (name: string) => {
  const n = name.toLowerCase();
  if (/garrafa|copo|caneca|squeeze/.test(n)) return "🧴";
  if (/eletr|carregad|fone|cabo|som|luz|led/.test(n)) return "🔌";
  if (/bonec|reborn/.test(n)) return "👶";
  if (/carr|carro/.test(n)) return "🚗";
  if (/bicicl|patin|triciclo/.test(n)) return "🚲";
  if (/game|console/.test(n)) return "🎮";
  if (/beb[eê]/.test(n)) return "🍼";
  if (/belez|maquiag|unha/.test(n)) return "💄";
  if (/casa|cozinha|utilidad/.test(n)) return "🏠";
  if (/brinq/.test(n)) return "🧸";
  if (/papel|escolar|escrit/.test(n)) return "✏️";
  return "🎁";
};
const ACCENTS = ["brand", "sun", "sky", "mint", "grape"];

// fallback category guess (real category names take priority)
const GUESS: [RegExp, string][] = [
  [/bonec|reborn|barbie|moana|princesa/i, "Bonecas"],
  [/carr|caminh|tanque|trator|pista|barco|carro/i, "Carrinhos"],
  [/bicicl|patin|triciclo|velotrol|skate/i, "Bicicletas"],
  [/garrafa|squeeze|copo|caneca|t[eé]rmica/i, "Garrafas"],
  [/carregad|fone|cabo|caixa de som|eletr|rel[oó]gio|bluetooth/i, "Eletrónicos"],
  [/mi[çc]anga|slime|massinha|pintur|desenh|bloc|quebra|jogo|educ/i, "Papelaria e Criativos"],
];
const guessCat = (name: string) => GUESS.find(([re]) => re.test(name))?.[1] ?? "Brinquedos";

const BGPOOL = ["#fff0f2", "#e6f2ff", "#e3f8f1", "#f0eaff", "#fff6df", "#ecebff", "#e0f7f1", "#ffeede"];

function loadRows(): Row[] {
  const dir = join(process.cwd(), "catalog-batches");
  const files = readdirSync(dir).filter((f) => f.startsWith("batch-") && f.endsWith(".json"));
  const seen = new Map<string, Row>();
  for (const file of files.sort()) {
    const { rows } = JSON.parse(readFileSync(join(dir, file), "utf8")) as { rows: Row[] };
    for (const row of rows) {
      const name = (row.name || "").trim();
      if (!name) continue;
      const key = keyOf(name, row.note);
      const prev = seen.get(key);
      seen.set(key, {
        name,
        price: row.price ?? prev?.price,
        old: row.old ?? prev?.old,
        brand: row.brand ?? prev?.brand,
        note: row.note ?? prev?.note,
        cat: row.cat ?? prev?.cat,
      });
    }
  }
  return [...seen.values()];
}

async function main() {
  const rows = loadRows();

  // resolve each product's category NAME (real header, else guess)
  const rowCat = rows.map((row) => (row.cat && row.cat.trim() ? row.cat.trim() : guessCat(row.name)));
  const catNames = [...new Set(rowCat)];

  // upsert categories from the real names
  const catIdBySlug: Record<string, number> = {};
  let ci = 0;
  for (const nm of catNames) {
    const slug = slugify(nm);
    const c = await db.category.upsert({
      where: { slug },
      update: { name: nm, active: true },
      create: { slug, name: nm, emoji: catEmoji(nm), accent: ACCENTS[ci % ACCENTS.length], sortOrder: ci, active: true },
    });
    catIdBySlug[slug] = c.id;
    ci++;
  }

  const realSlugs: string[] = [];
  let live = 0, drafts = 0;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const catSlug = slugify(rowCat[i]);
    const bg = BGPOOL[Object.keys(catIdBySlug).indexOf(catSlug) % BGPOOL.length];
    const hasPrice = typeof row.price === "number" && row.price > 0;
    const slug = keyOf(row.name, row.note);
    realSlugs.push(slug);
    const data = {
      name: displayName(row.name, row.note), slug, brand: row.brand ?? "", description: row.note ?? "",
      categoryId: catIdBySlug[catSlug] ?? null,
      priceCents: hasPrice ? r(row.price!) : 0,
      oldPriceCents: row.old ? r(row.old) : null,
      pixPercent: 10, stock: 10, active: hasPrice,
    };
    await db.product.upsert({
      where: { slug },
      update: data,
      create: { ...data, images: { create: [{ url: `${catEmoji(rowCat[i])}|${bg}`, alt: row.name }] } },
    });
    hasPrice ? live++ : drafts++;
  }

  // hide leftover sample products not in the real catalogue
  const hidden = realSlugs.length
    ? await db.product.updateMany({ where: { slug: { notIn: realSlugs } }, data: { active: false } })
    : { count: 0 };

  // hide categories that ended up with no active products
  const cats = await db.category.findMany({ include: { _count: { select: { products: true } } } });
  for (const c of cats) {
    const activeCount = await db.product.count({ where: { categoryId: c.id, active: true } });
    if (activeCount === 0 && c.active) await db.category.update({ where: { id: c.id }, data: { active: false } });
  }

  console.log(`✅ Catálogo: ${rows.length} produtos (${live} publicados, ${drafts} rascunhos sem preço)`);
  console.log(`   Categorias: ${catNames.length} · amostras ocultadas: ${hidden.count}`);
  console.log(`   Ativos: ${await db.product.count({ where: { active: true } })} · categorias ativas: ${await db.category.count({ where: { active: true } })}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
