---
name: wix-storefront
description: Client-only Wix eCommerce storefront scaffold (dependency-free REST). Use when building or extending a Wix-powered store over an existing stocked Wix site — wiring live product fetching, a Wix-owned cart (add/update/remove), and redirect-session checkout. The public WIX_CLIENT_ID is provided in the handoff prompt and hardcoded into the snippet (it is buyer-facing, not a secret). Read-only catalog; the merchant adds products in the Wix dashboard. Never provisions, never mocks products.
---

# Wix Storefront Skill

Builds a real, client-only Wix storefront. The browser talks to Wix directly over a
public `WIX_CLIENT_ID`. Never mock products; never hand-build `/checkout` URLs — always
go through the eCom cart + redirect-session.

## When to use
- User wants a Wix eCommerce store or asks to "connect Wix".
- Replacing placeholder/mock products with live Wix data.
- Adding cart, checkout, or product detail pages over an existing Wix Stores catalog.

## Prerequisites
1. A Wix site with **Wix Stores installed and products already added** (this skill does
   NOT provision — it's read-only over the catalog).
2. The site's public headless **`WIX_CLIENT_ID`**, provided in the handoff prompt (the
   Wix Business Manager surfaces a copyable prompt with the id filled in — see
   `PROMPT.md`). Paste it into `src/rest/client.ts` in place of the placeholder. It is a
   buyer-facing credential (it only mints anonymous visitor tokens), **not** a secret, so
   hardcoding/committing it is fine.
3. The deployed app domain must be allow-listed on the OAuth client for Wix-hosted
   checkout to return. This is a **separate Wix setup flow the user completes later** —
   out of this skill's scope. If checkout return fails before that setup is done, that's
   expected; flag it and continue.

## The API (copy as-is; do not re-derive it)
This skill ships only the REST layer — no UI components. Build the storefront's UI
however the project wants; wire it to these two snippets. Copy them into the app (e.g.
`src/lib/`) and only adjust import paths:
- `src/rest/client.ts` — visitor-token mint/refresh + transport. Set `WIX_CLIENT_ID` to
  the id from the prompt (replace the `<YOUR-CLIENT-ID>` placeholder). The visitor refresh
  token IS the cart identity; it is persisted to localStorage. Do not re-mint anonymously
  per load or the cart silently empties.
- `src/rest/ecom.ts` — `fetchProducts`, `getProductBySlug`, `normalizeProduct`,
  `addToCart`, `getCurrentCart`, `updateCartLineQuantity`, `removeFromCart`, `checkout`,
  `countProducts`, `formatPrice`.

## How to wire it (UI is the project's choice)
- **Product grid / PDP** — `fetchProducts()` → `normalizeProduct` for the listing;
  `getProductBySlug(slug)` for a detail page (returns null on miss — show a not-found
  state, never invent a product).
- **Cart** — `addToCart(catalogItemId)`, `updateCartLineQuantity(lineId, qty)`,
  `removeFromCart(lineId)`, `getCurrentCart()`. The cart lives on Wix, keyed by the
  visitor identity — read it back with `getCurrentCart()` rather than mirroring it.
- **Checkout** — `window.location.href = await checkout()`. After the buyer returns from
  hosted checkout the order is placed and the current cart is empty, so re-fetch with
  `getCurrentCart()` on return (e.g. on mount + `visibilitychange`) to clear the UI.
- **Empty state** — if `countProducts()` is 0, show an empty state telling the user to
  add products in their Wix dashboard. Never invent products.

## Hard rules (do not violate)
- ✅ Checkout ONLY via `checkout()` (`create-checkout` → `/headless/v1/redirect-session`
  `fullUrl`), then redirect.
- ❌ Never hand-build `/checkout`, cart-add, or product permalinks for purchase.
- ❌ Never mock products — render live Wix data or the empty state.
- ❌ Never generate fake reviews, ratings, or testimonials. Empty review UI only.
- ✅ Set `WIX_CLIENT_ID` from the prompt's value (public client id — safe to hardcode).
- ✅ `lineId` for cart mutations is the cart `LineItem.id`, not `catalogItemId`.
- The engine fails loudly on purpose: `addToCart`/`checkout` throw on out-of-stock or
  empty carts. A green path means it is really buyable — don't swallow these.

## Scope
eCommerce only (products + cart + checkout + PDP + empty state). For content sections
(blog/lookbook), `src/rest/data.ts` reads public-read CMS collections — optional, not
part of this path. Provisioning/admin is out of scope (see `wix-headless-from-design`).

## Verification checklist (before declaring done)
- [ ] `WIX_CLIENT_ID` set to the prompt's value (not the `<YOUR-CLIENT-ID>` placeholder)
- [ ] Visitor token persists across reload (cart survives reload, same visitor)
- [ ] Add to cart works; out-of-stock items throw rather than add a dead line
- [ ] Quantity update / remove reflect in `getCurrentCart()`
- [ ] Checkout redirects via redirect-session `fullUrl` (no hand-built URL)
- [ ] Cart re-fetched on return from checkout (clears once the order is placed)
- [ ] Empty state shown when `countProducts()` is 0
- [ ] No mock products anywhere
