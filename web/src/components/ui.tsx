import { Link } from "react-router-dom";
import type { Product } from "../lib/types";
import { useI18n } from "../lib/i18n";
import { ProductCard } from "./ProductCard";

// gradient by design-token name
export const grad: Record<string, string> = {
  brand: "from-brand to-sun",
  grape: "from-grape to-sky",
  mint: "from-mint to-sky",
  sun: "from-sun to-brand",
  sky: "from-sky to-grape",
};

export function SectionHead({ title, emoji, to, extra }: { title: string; emoji?: string; to?: string; extra?: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="mb-3 flex items-end justify-between gap-2 px-1">
      <h2 className="font-display text-xl font-extrabold text-ink sm:text-2xl">
        {emoji && <span className="mr-1">{emoji}</span>}
        {title}
      </h2>
      {extra}
      {to && (
        <Link to={to} className="whitespace-nowrap text-sm font-bold text-brand-dark">
          {t("Ver todos")} →
        </Link>
      )}
    </div>
  );
}

// Horizontal scroll row of product cards (mobile), grid-ish on desktop.
export function ProductRow({ items }: { items: Product[] }) {
  if (!items.length) return <p className="px-1 text-sm text-muted">—</p>;
  return (
    <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
      {items.map((p) => (
        <div key={p.id} className="w-40 shrink-0 sm:w-48">
          <ProductCard p={p} />
        </div>
      ))}
    </div>
  );
}

export function ProductGrid({ items }: { items: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((p) => (
        <ProductCard key={p.id} p={p} />
      ))}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted">
      <span className="h-8 w-8 animate-spin rounded-full border-3 border-line border-t-brand" style={{ borderWidth: 3 }} />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}
