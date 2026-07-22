// Phase 2: assign a subcategory to every product (keyword rules per category)
// and derive recommended age from the product name where present.
// Non-destructive: only updates `subcat` and `ageGroup`, grouped by value for speed.
//   npx tsx prisma/set-subcats.ts
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const db = new PrismaClient();
const here = path.dirname(fileURLToPath(import.meta.url));
const prods = JSON.parse(readFileSync(path.join(here, "data/catalog-full.json"), "utf8")) as
  { slug: string; name: string; category: string; priceCents: number }[];

function subcatFor(cat: string, name: string, priceCents: number): string {
  const n = name.toLowerCase();
  if (cat === "carros-de-ferro") {
    if (/caminh|carreta|truck|caçamba|cacamba/.test(n)) return "Caminhões";
    if (/\bmoto\b|motoca|motocicl|\bmotos\b/.test(n)) return "Motos";
    if (/onibus|ônibus|\bbus\b/.test(n)) return "Ônibus";
    if (/bicicleta|\bbike\b|patinete/.test(n)) return "Bicicletas";
    if (/trator|escavad|construç|guindaste|betoneira|caterpillar/.test(n)) return "Construção";
    if (/kit|coleç|colec|\bset\b|pack|conjunto/.test(n)) return "Coleções";
    return "Carros";
  }
  if (cat === "educativos") {
    if (/quebra|puzzle|cabeç|cabec/.test(n)) return "Quebra-cabeças";
    if (/letra|numero|número|alfabeto|\babc\b|silab/.test(n)) return "Letras e números";
    if (/monta|bloco|lego|encaix|pino|tijol/.test(n)) return "Montar";
    if (/aprend|educa|máquina|maquina|tablet|interativ/.test(n)) return "Aprender";
    if (/jogo|game|dama|domin|xadrez|bingo|memória|memoria/.test(n)) return "Jogos";
    return "Atividades";
  }
  if (cat === "garrafas-copos") {
    if (/térmic|termic|inox|temperatura|smart|led/.test(n)) return "Térmicas";
    if (/copo/.test(n)) return "Copos";
    if (/criança|crianca|infantil|kids|escolar/.test(n)) return "Infantis";
    if (/canudo/.test(n)) return "Com canudo";
    if (/alça|alca/.test(n)) return "Com alça";
    return "Garrafas";
  }
  if (cat === "brinquedos-1-a-6") return "R$" + Math.max(1, Math.round(priceCents / 100));
  // atacado — broad buckets over a large mixed catalogue
  if (/boneca|\bdoll\b|barbie|reborn/.test(n)) return "Bonecas";
  if (/pelúcia|pelucia|\bbicho|urso|unicórnio|unicornio/.test(n)) return "Pelúcias";
  if (/carr|\bmoto|caminh|trem|avião|aviao|helicóp|helicop/.test(n)) return "Veículos";
  if (/bola|futebol|basquete|esporte|piscina|praia|\bágua|\bagua/.test(n)) return "Esportes e água";
  if (/jogo|game|carta|domin|bilhar|sinuca|dardo/.test(n)) return "Jogos";
  if (/slime|massinha|amoeba|geleca/.test(n)) return "Slime e massinha";
  if (/arma|pistola|lança|lanca|nerf|dardo|bolha/.test(n)) return "Lançadores e bolhas";
  if (/quebra|monta|educa|bloco|letra/.test(n)) return "Educativos";
  if (/cozinha|dentista|médic|medic|ferramenta|maquiag|beleza|casinha/.test(n)) return "Faz de conta";
  return "Variados";
}
function ageFor(name: string): string {
  const m = name.match(/(?:\+\s*(\d{1,2})|(\d{1,2})\s*\+|(\d{1,2})\s*anos?)/i);
  if (!m) return "";
  const n = m[1] || m[2] || m[3];
  return `${n}+`;
}

async function main() {
  const groups: Record<string, string[]> = {};
  for (const p of prods) {
    const subcat = subcatFor(p.category, p.name, p.priceCents);
    const age = ageFor(p.name);
    (groups[`${subcat}||${age}`] ??= []).push(p.slug);
  }
  let n = 0;
  for (const [k, slugs] of Object.entries(groups)) {
    const [subcat, ageGroup] = k.split("||");
    for (let i = 0; i < slugs.length; i += 300) {
      const r = await db.product.updateMany({ where: { slug: { in: slugs.slice(i, i + 300) } }, data: { subcat, ageGroup } });
      n += r.count;
    }
  }
  const distinct = await db.product.findMany({ select: { subcat: true } });
  const set = new Set(distinct.map((d) => d.subcat).filter(Boolean));
  console.log(`Updated ${n} products. Distinct subcategories: ${set.size}`);
  const withAge = await db.product.count({ where: { ageGroup: { not: "" } } });
  console.log(`Products with recommended age: ${withAge}`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
