import { wixApiRequest } from "./client";

// Stores app id — required inside catalogReference for store products.
const STORES_APP_ID = "215238eb-22a5-4c36-9e7b-e7c08025e04e";

/** List products (one page). Bump `limit` or wire cursor paging for large catalogs. */
export async function fetchProducts(limit = 100) {
  const res = await wixApiRequest("/stores/v3/products/query", {
    method: "POST",
    body: { query: { cursorPaging: { limit } } },
  });
  return res?.products ?? [];
}

/**
 * Fetch a single product by slug — for a product (PDP) page, keyed off the URL
 * slug. This is the analog of Shopify's `fetchProductByHandle`: storefront routes
 * carry the slug, not the raw id. Returns null if not found.
 */
export async function getProductBySlug(slug: string) {
  const res = await wixApiRequest<any>(`/stores/v3/products/slug/${encodeURIComponent(slug)}`, { method: "GET" });
  return res?.product ?? null;
}

/**
 * Flat view model for a design's product grid / PDP. Wix V3 products are deep and a
 * few fields live in more than one place across query vs get-by-slug responses, so
 * `normalizeProduct` reads them defensively into this stable shape.
 */
export interface ProductView {
  id: string;
  slug: string;
  name: string;
  /** Price in CENTS — designs / Shopify ports expect cents; Wix returns currency units. */
  priceCents: number;
  currency?: string;
  image?: string;
  inStock: boolean;
  /** The untouched Wix product, for anything this view model drops. */
  raw: any;
}

/**
 * Map a Wix V3 storefront product → the flat view model a design renders from
 * (the analog of reshaping a Shopify product). Replaces the design's hardcoded
 * product objects. Reads price/image/availability defensively across V3 response
 * shapes. Pass a name-keyed `enrichment` sidecar for presentation-only fields the
 * design has but Wix doesn't (category, badge, swatches) — it shallow-overrides
 * the mapped fields.
 */
export function normalizeProduct(p: any, enrichment: Record<string, Partial<ProductView>> = {}): ProductView {
  const amount =
    p?.actualPriceRange?.minValue?.amount ??
    p?.variantsInfo?.variants?.[0]?.price?.actualPrice?.amount ??
    p?.price?.actualPrice?.amount ??
    "0";
  const mainImage = p?.media?.main?.image;
  const view: ProductView = {
    id: p?.id ?? p?._id,
    slug: p?.slug,
    name: p?.name,
    priceCents: Math.round(Number(amount) * 100),
    currency: p?.currency ?? p?.actualPriceRange?.minValue?.currency,
    image: typeof mainImage === "string" ? mainImage : mainImage?.url,
    inStock: (p?.inventory?.availabilityStatus ?? "IN_STOCK") === "IN_STOCK",
    raw: p,
  };
  return { ...view, ...enrichment[view.name] };
}

function findLine(cart: any, catalogItemId: string) {
  return (cart?.lineItems ?? []).find((l: any) => l.catalogReference?.catalogItemId === catalogItemId);
}

/**
 * Add a product to the visitor's current cart.
 * Fails loudly: Wix will add an out-of-stock item as a `quantity: 0`, `NOT_AVAILABLE`
 * line WITHOUT erroring, so we inspect the returned line and throw if it isn't sellable.
 */
export async function addToCart(catalogItemId: string, quantity = 1) {
  const res = await wixApiRequest<any>("/ecom/v1/carts/current/add-to-cart", {
    method: "POST",
    body: { lineItems: [{ catalogReference: { appId: STORES_APP_ID, catalogItemId }, quantity }] },
  });
  const line = findLine(res?.cart, catalogItemId);
  if (line?.availability?.status && line.availability.status !== "AVAILABLE") {
    throw new Error(`Item not available for sale (status: ${line.availability.status}). Is it in stock?`);
  }
  return res?.cart;
}

/** Read the visitor's current cart (null if none exists yet). */
export async function getCurrentCart() {
  try {
    const res = await wixApiRequest<any>("/ecom/v1/carts/current", { method: "GET" });
    return res?.cart ?? null;
  } catch {
    return null;
  }
}

/**
 * Create a checkout from the current cart and return the hosted checkout URL.
 * Guards the silent-failure modes instead of redirecting to a broken checkout:
 * empty cart, unavailable lines, or a missing redirect URL all throw.
 */
export async function checkout(): Promise<string> {
  const cart = await getCurrentCart();
  const lines: any[] = cart?.lineItems ?? [];
  if (!lines.length) throw new Error("Cannot check out: the cart is empty.");
  const unavailable = lines.filter((l) => l.availability?.status && l.availability.status !== "AVAILABLE");
  if (unavailable.length) {
    const names = unavailable.map((l) => l.productName?.original ?? l.catalogReference?.catalogItemId).join(", ");
    throw new Error(`Cannot check out: ${unavailable.length} item(s) not available — ${names}.`);
  }

  const checkoutRes = await wixApiRequest<any>("/ecom/v1/carts/current/create-checkout", {
    method: "POST",
    body: { channelType: "WEB" },
  });
  const checkoutId = checkoutRes?.checkoutId;
  if (!checkoutId) throw new Error("Failed to create checkout from the current cart.");

  const redirect = await wixApiRequest<any>("/headless/v1/redirect-session", {
    method: "POST",
    body: { ecomCheckout: { checkoutId }, callbacks: { postFlowUrl: window.location.href } },
  });
  const url = redirect?.redirectSession?.fullUrl;
  if (!url) throw new Error("Failed to create the checkout redirect session.");
  return url as string;
}

/**
 * Update the quantity of one cart line. `lineId` is the cart LineItem.id
 * (from getCurrentCart().lineItems[].id), not the catalog item id. Wix caps the
 * result at remaining stock, so the returned line quantity may be lower than asked.
 */
export async function updateCartLineQuantity(lineId: string, quantity: number) {
  const res = await wixApiRequest<any>("/ecom/v1/carts/current/update-line-items-quantity", {
    method: "POST",
    body: { lineItems: [{ id: lineId, quantity }] },
  });
  return res?.cart;
}

/** Remove one line from the current cart by its cart LineItem.id. Returns the updated cart. */
export async function removeFromCart(lineId: string) {
  const res = await wixApiRequest<any>("/ecom/v1/carts/current/remove-line-items", {
    method: "POST",
    body: { lineItemIds: [lineId] },
  });
  return res?.cart;
}

/**
 * Number of products in the catalog — drives the empty state (0 → "add products in
 * the Wix dashboard"). Reads one page (up to 100); wire cursor paging for a true
 * count on large catalogs. Empty-state logic only needs 0 vs. >0.
 */
export async function countProducts(): Promise<number> {
  return (await fetchProducts(100)).length;
}

/** Display helper: cents → localized currency string (mirrors Shopify's formatPrice). */
export function formatPrice(amountCents: number, currency = "USD"): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amountCents / 100);
}
