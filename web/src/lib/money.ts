// Brazilian Real formatting + payment helpers. Money is stored in centavos.
export function brl(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function discountPct(oldCents: number | null, cur: number): number {
  if (!oldCents || oldCents <= cur) return 0;
  return Math.round((1 - cur / oldCents) * 100);
}

export function pixCents(cents: number, pct: number): number {
  return Math.round(cents * (1 - pct / 100));
}

// Best whole-number installment (no interest), capped by max.
export function installment(cents: number, max: number): { n: number; eachCents: number } {
  const minEach = 1000; // don't split below R$10/parcela
  let n = Math.min(max, Math.max(1, Math.floor(cents / minEach)));
  if (n < 1) n = 1;
  return { n, eachCents: Math.round(cents / n) };
}
