# Mundo dos Brinquedos e Variedades — CLAUDE.md

## What this is
Complete e-commerce store for **Mundo dos Brinquedos e Variedades**, a toy & variety
store in Goiânia, Goiás, Brazil. Sells **retail AND wholesale** ("Varejo e Atacado")
with delivery throughout Brazil. Most traffic arrives from Instagram
(@mundo.dos_brinquedos, ~13k followers), so the site is **mobile-first** and in
**Brazilian Portuguese** with prices in **Brazilian Real (R$)**. The site must feel
like an established, trustworthy store — not a basic catalogue — where customers browse,
pay online (Pix/card/boleto), track orders, contact via WhatsApp, and apply for
wholesale access.

## Stack & layout
- web/ (Vite + React + Tailwind v4, TypeScript strict) — port **5310**
- server/ (Express + Prisma + Neon Postgres, tsx dev) — port **4210** *(not scaffolded yet)*
- Deploy: **API → Render, web → Vercel** (planned; ASK before first deploy). Domain TBD.

## Commands
- Dev: `cd server && npm run dev` + `cd web && npm run dev`
- Typecheck: `npx tsc --noEmit` in web/ and server/
- Build (matches CI): `cd web && npx tsc -b && npx vite build`  ← always run the REAL build before claiming a deploy is done
- DB: `cd server && npx prisma db push` (Neon may need 2–3 retries to wake)

## Brand — Direction B "Confete" (chosen 2026-07-21)
- Voice: colorful, friendly, trustworthy "big toy store" — joyful but NOT childish/cheap.
- Tokens: web/src/index.css `@theme` — hero **coral-red #ff3d57** (CTAs/prices),
  warm ground **#fff7f2**, ink **#241f3b**; confetti accents sun #ffc53d / sky #3da5ff /
  mint #21c197 / grape #8b5cf6 used sparingly for category coding; Pix green #129d63.
- Fonts: display **Baloo 2** (rounded, playful), body **Nunito** (Google Fonts).
- Never: purple-gradient-on-white cliché, childish clutter, cheap look, uniform radii.

## Domain rules (the stuff that's easy to get wrong)
1. **Two customer types.** Retail (varejo) sees retail prices. Wholesale (atacado)
   customers must **apply → be approved by the owner** before seeing wholesale prices,
   minimum quantities and package multiples. Retail users must NOT see wholesale prices
   unless the owner opts to show them.
2. **Wholesale cart rules:** enforce minimum quantity per product, minimum order value,
   and package multiples.
3. **Payments (Brazil):** Mercado Pago planned — Pix (with discount), credit card
   (+ installments/parcelas), boleto, debit. Order is confirmed by the gateway
   **webhook**, never by the client redirect alone.
4. **Never sell out-of-stock:** validate stock at checkout; decrement on confirmed
   payment; return stock on cancellation per configured rules.
5. **Shipping** by CEP + weight + dimensions (Melhor Envio/Correios, Fase 2). Store
   pickup available in Goiânia. Fase 1 may start with flat/CEP-range rates.
6. **LGPD:** cookie consent + privacy controls required.
7. WhatsApp is central: floating button + context buttons carry pre-filled messages
   with product/order info. WhatsApp **+55 62 98165-2030**, hours **08:00–18:00**.

## Build order (phased — MVP first, chosen 2026-07-21)
- **Fase 1 (MVP, "already sells"):** catalog + category + product page → cart → checkout
  (Pix + card via Mercado Pago) → order confirmation + email; admin (products, orders,
  stock); WhatsApp button; mobile home; essential legal + LGPD.
- **Fase 2:** wholesale accounts/approval/pricing, coupons + Ofertas page (countdown),
  reviews, order tracking statuses, CEP shipping calc, customer account, reports.
- **Fase 3:** analytics, abandoned cart, WhatsApp status notifications, CSV import/export,
  Instagram feed, SEO structured data, performance passes.
- **Future (structured for, not built):** loyalty, gift cards, bundles, multi-location,
  sales reps, supplier portal, multi-language, marketplace.

## Running the prototype
- API: `cd server && npm run start` (port 4210). DB is SQLite `server/prisma/dev.db`
  (committed so it runs immediately). Reset demo data: `cd server && npx tsx prisma/seed.ts`.
- Web: `cd web && npm run dev` (port 5310). Admin at `/admin`, key **mundo123**
  (from server `.env` ADMIN_KEY). Storefront at `/`.

## Languages (bilingual)
- Storefront is **PT (default) + EN**, toggle in the header (🇧🇷/🇺🇸), persisted in
  localStorage (`mundo_lang`). i18n lives in web/src/lib/i18n.tsx — a PT-source
  overlay: PT strings are the keys, `t()` returns the EN value in English mode,
  `tf(obj,"name")` picks `nameEn`/`descriptionEn`/`blurbEn`/banner `*En` fields.
- DB has English columns (Product.nameEn/descriptionEn, Category.nameEn/blurbEn,
  Banner.*En, Setting taglineEn) seeded for all sample data. Admin stays Portuguese.
- User-generated review text stays in its original language (by design).

## Current status / next up
- ✅ Sitemap + concept + design directions delivered; Direction B chosen.
- ✅ web/ + design system locked & verified.
- ✅ Bilingual PT/EN storefront (toggle, translated UI + product/category/banner content).
- ✅ **Production wiring:** Neon Postgres (schema pushed + seeded); single Render web
  service (Express serves API + built web/dist) via render.yaml blueprint. Secrets in
  git-ignored server/.env + Render env vars (DATABASE_URL, DIRECT_URL, ADMIN_KEY).
  Migrate to Hetzner later = same Postgres + same server (point DATABASE_URL at new DB).
- ⏭ First Render deploy is a manual Blueprint import by the owner (see below); then
  auto-deploys on push. Rotate the Neon password after setup (it was shared in chat).
- ⏭ Mercado Pago payments (Pix/card/webhook) before real selling.
- ✅ **Full working prototype (this milestone):** server + Prisma model + rich seed
  (20 products, variants, 6 customers, 8 orders, 12 reviews, banners, settings) +
  public & admin API; storefront (home/shop/product/cart/checkout/confirmation/track/
  atacado/favoritos/static+policies+LGPD); admin (dashboard/products CRUD/orders/
  customers/wholesale/reviews/content). All DB-backed & editable. Verified 390px+1280px.
- ⏭ Fase 1 → launch: real Mercado Pago (Pix/card/webhook), real product data + photos,
  migrate SQLite→Neon Postgres, deploy (Render API + Vercel web) — ASK before first deploy.
- ⏭ Fase 2: wholesale price gating by approved login, coupons/offers countdown,
  reviews moderation polish, CEP shipping calc, customer accounts, reports.
