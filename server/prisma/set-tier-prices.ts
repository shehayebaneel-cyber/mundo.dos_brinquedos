// Seed default tier prices so the 10+ items and wholesale-value levels actually
// discount. Defaults: -10% at 10+ items, -20% at wholesale value. Editable per
// product in the admin afterwards. Non-destructive (only price10Cents/wholesaleCents).
//   npx tsx prisma/set-tier-prices.ts            → -10% / -20%
//   npx tsx prisma/set-tier-prices.ts 8 15       → -8% / -15%
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const T2 = Number(process.argv[2] ?? 10); // % off when cart has 10+ items
const T3 = Number(process.argv[3] ?? 20); // % off when cart reaches wholesale value

async function main() {
  const prods = await db.product.findMany({ select: { id: true, priceCents: true } });
  const groups: Record<number, number[]> = {};
  for (const p of prods) (groups[p.priceCents] ??= []).push(p.id);
  let n = 0;
  for (const [priceStr, ids] of Object.entries(groups)) {
    const price = Number(priceStr);
    const p10 = Math.round(price * (1 - T2 / 100));
    const p3 = Math.round(price * (1 - T3 / 100));
    for (let i = 0; i < ids.length; i += 300) {
      const r = await db.product.updateMany({ where: { id: { in: ids.slice(i, i + 300) } }, data: { price10Cents: p10, wholesaleCents: p3 } });
      n += r.count;
    }
  }
  console.log(`Set tier prices on ${n} products — tier 2 -${T2}%, tier 3 -${T3}%.`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
