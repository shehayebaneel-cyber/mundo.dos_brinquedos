export type ProductImage = { id: number; url: string; alt: string; sortOrder: number };
export type Variant = { id: number; kind: string; label: string; swatch: string; stock: number; priceDeltaCents: number };
export type Category = {
  id: number; slug: string; name: string; nameEn?: string; emoji: string; accent: string;
  blurb: string; blurbEn?: string; sortOrder: number; active: boolean; _count?: { products: number };
};
export type Review = {
  id: number; productId: number; author: string; rating: number; comment: string;
  verified: boolean; approved: boolean; createdAt: string; product?: { name: string; slug: string };
};
export type Product = {
  id: number; slug: string; name: string; nameEn?: string; brand: string; sku: string;
  description: string; descriptionEn?: string;
  categoryId: number | null; category?: Category | null;
  priceCents: number; oldPriceCents: number | null; costCents: number; wholesaleCents: number | null;
  pixPercent: number; stock: number; lowStockAt: number; minWholesaleQty: number; packQty: number;
  installmentsMax: number; ageGroup: string; material: string; weightGrams: number; warranty: string;
  featured: boolean; isNew: boolean; bestSeller: boolean; wholesaleOnly: boolean; active: boolean;
  images: ProductImage[]; variants: Variant[]; reviews?: Review[];
  avgRating?: number; reviewCount?: number;
  createdAt: string; updatedAt: string;
};
export type Banner = {
  id: number; title: string; titleEn?: string; subtitle: string; subtitleEn?: string;
  badge: string; badgeEn?: string; ctaLabel: string; ctaLabelEn?: string; ctaHref: string;
  cta2Label: string; cta2LabelEn?: string; cta2Href: string; bg: string; emoji: string;
  sortOrder: number; active: boolean;
};
export type OrderItem = { id: number; productId: number | null; name: string; variant: string; priceCents: number; qty: number };
export type Order = {
  id: number; code: string; customerName: string; customerPhone: string; customerEmail: string;
  kind: string; status: string; paymentMethod: string; paymentStatus: string;
  subtotalCents: number; discountCents: number; shippingCents: number; totalCents: number;
  cep: string; address: string; city: string; state: string; trackingCode: string; note: string;
  items: OrderItem[]; createdAt: string;
};
export type Customer = {
  id: number; name: string; email: string; phone: string; cpfCnpj: string; kind: string;
  wholesaleStatus: string; businessName: string; city: string; state: string; notes: string;
  createdAt: string; ordersCount?: number; spentCents?: number;
};
export type Settings = Record<string, string>;
