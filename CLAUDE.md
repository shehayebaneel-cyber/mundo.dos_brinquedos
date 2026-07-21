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

## Current status / next up
- ✅ Sitemap + mobile home concept + design directions delivered (artifact).
- ✅ web/ scaffolded; Direction B design system locked & verified (screenshot 390px OK).
- ⏭ Scaffold server/ + Prisma data model (products, categories, orders, users) for Fase 1.
- ⏭ Core components (Button, ProductCard, Header, BottomNav) with all states.
- ⏭ Home + product + cart + checkout prototype → client sign-off before building the rest.
