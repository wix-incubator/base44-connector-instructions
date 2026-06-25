import { wixApiRequest } from "./client.js";

// Stores app id — required inside catalogReference for store products.
const STORES_APP_ID = "215238eb-22a5-4c36-9e7b-e7c08025e04e";

/**
 * Wix Stores V3 Product — key fields for building a storefront.
 * Full model: https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v3/products-v3/query-products
 *
 *   id                                      {string}   Product GUID.
 *   name                                    {string}   Display name.
 *   slug                                    {string}   URL slug for PDP routing.
 *   visible                                 {boolean}  Whether shown to site visitors.
 *   productType                             {string}   "PHYSICAL" | "DIGITAL"
 *   mainCategoryId                          {string}   Primary category GUID.
 *   media.main.image                        {object}   Primary image:
 *                                                      { id, url, height, width, altText }
 *   actualPriceRange.minValue.amount        {string}   Lowest variant price (decimal string).
 *   actualPriceRange.minValue.formattedAmount {string} Lowest price with currency symbol (e.g. "$199.99").
 *   actualPriceRange.maxValue.amount        {string}   Highest variant price (decimal string).
 *   actualPriceRange.maxValue.formattedAmount {string} Highest price with currency symbol.
 *   inventory.availabilityStatus            {string}   "IN_STOCK" | "OUT_OF_STOCK" |
 *                                                      "PARTIALLY_OUT_OF_STOCK"
 *   options                                 {array}    Product options (e.g. Size, Color):
 *                                                      [{
 *                                                        id, name,
 *                                                        optionRenderType: "TEXT_CHOICES" | "COLOR_CHOICES",
 *                                                        choicesSettings: {
 *                                                          choices: [{ choiceId, key, name, inStock, visible }]
 *                                                        }
 *                                                      }]
 *   variantSummary.variantCount             {number}   Total number of variants.
 *   plainDescription                        {string}   Product description in HTML format.
 *   variantsInfo.variants                   {array}    [{ id, optionChoiceIds: [{ optionId, choiceId }] }].
 *                                                      Variant id → addToCart's optional variantId
 *                                                      (products with options). Only from
 *                                                      getProductBySlug, not queryProducts.
 */

/**
 * Wix eCom Cart — key fields for building a cart UI.
 * Full model: https://dev.wix.com/docs/api-reference/business-solutions/e-commerce/purchase-flow/cart/get-cart
 *
 *   id                                      {string}  Cart GUID.
 *   currency                                {string}  ISO-4217 currency code.
 *   lineItems                               {array}
 *     id                                    {string}  Line item GUID (lineItemId).
 *                                                     Pass to updateCartItemQuantity / removeFromCart.
 *     quantity                              {number}
 *     catalogReference.catalogItemId        {string}  Product GUID.
 *     productName.original                  {string}  Display name.
 *     price.formattedAmount                 {string}  Price after discounts, with currency symbol.
 *     image.url                             {string}  Line item image URL.
 *     availability.status                   {string}  "AVAILABLE" | "NOT_AVAILABLE" |
 *                                                     "PARTIALLY_AVAILABLE" | "NOT_FOUND"
 */

/**
 * Query products (one page).
 * @param {{ limit?: number, cursor?: string }} [options]
 * @returns {Promise<{ products: object[], nextCursor: string|null }>}
 */
export async function queryProducts({ limit = 100, cursor } = {}) {
  const res = await wixApiRequest("/stores/v3/products/query", {
    method: "POST",
    body: {
      fields: ["CURRENCY", "PLAIN_DESCRIPTION"],
      query: {
        filter: { visible: true },
        cursorPaging: cursor ? { limit, cursor } : { limit },
      },
    },
  });
  return {
    products: res?.products ?? [],
    nextCursor: res?.pagingMetadata?.cursors?.next ?? null,
  };
}

/**
 * Fetch a product by its URL slug. Returns null if not found.
 * @param {string} slug
 * @returns {Promise<object|null>}
 */
export async function getProductBySlug(slug) {
  const res = await wixApiRequest(`/stores/v3/products/slug/${encodeURIComponent(slug)}`, {
    method: "GET",
    query: { fields: ["CURRENCY", "PLAIN_DESCRIPTION"] },
  });
  return res?.product ?? null;
}

/**
 * Add a product to the visitor's current cart.
 * `variantId` is optional: omit it for products without variants; for a product with options,
 * pass the chosen variant's `product.variantsInfo.variants[].id` (from getProductBySlug) to add
 * that specific variant. Throws on out-of-stock so the buyer can't reach checkout with an
 * unbuyable line — Wix would otherwise add it silently at quantity 0.
 * @param {string} catalogItemId  Product GUID (`product.id`).
 * @param {string} [variantId]    `product.variantsInfo.variants[].id` — only for products with variants.
 * @param {number} [quantity]
 * @returns {Promise<object>} Updated cart.
 */
export async function addToCart(catalogItemId, variantId, quantity = 1) {
  const catalogReference = { appId: STORES_APP_ID, catalogItemId };
  if (variantId) catalogReference.options = { variantId };
  const res = await wixApiRequest("/ecom/v1/carts/current/add-to-cart", {
    method: "POST",
    body: { lineItems: [{ catalogReference, quantity }] },
  });
  const line = (res?.cart?.lineItems ?? []).find(
    (l) => l.catalogReference?.catalogItemId === catalogItemId && (!variantId || l.catalogReference?.options?.variantId === variantId),
  );
  if (line?.availability?.status && line.availability.status !== "AVAILABLE") {
    throw new Error(`Item not available for sale (status: ${line.availability.status}). Is it in stock?`);
  }
  return res?.cart;
}

/** Read the visitor's current cart. Returns null if no cart exists yet. */
export async function getCurrentCart() {
  try {
    const res = await wixApiRequest("/ecom/v1/carts/current", { method: "GET" });
    return res?.cart ?? null;
  } catch {
    return null;
  }
}

/**
 * Create a checkout from the current cart and return the hosted checkout URL.
 * Throws on empty cart, unavailable lines, or a missing redirect URL.
 * @returns {Promise<string>}
 */
export async function checkout() {
  const cart = await getCurrentCart();
  const lines = cart?.lineItems ?? [];
  if (!lines.length) throw new Error("Cannot check out: the cart is empty.");
  const unavailable = lines.filter((l) => l.availability?.status && l.availability.status !== "AVAILABLE");
  if (unavailable.length) {
    const names = unavailable.map((l) => l.productName?.original ?? l.catalogReference?.catalogItemId).join(", ");
    throw new Error(`Cannot check out: ${unavailable.length} item(s) not available — ${names}.`);
  }

  const checkoutRes = await wixApiRequest("/ecom/v1/carts/current/create-checkout", {
    method: "POST",
    body: { channelType: "WEB" },
  });
  const checkoutId = checkoutRes?.checkoutId;
  if (!checkoutId) throw new Error("Failed to create checkout from the current cart.");

  const redirect = await wixApiRequest("/headless/v1/redirect-session", {
    method: "POST",
    body: { ecomCheckout: { checkoutId }, callbacks: { postFlowUrl: window.location.href } },
  });
  const url = redirect?.redirectSession?.fullUrl;
  if (!url) throw new Error("Failed to create the checkout redirect session.");
  return url;
}

/**
 * Update the quantity of a cart line.
 * `lineItemId` is `cart.lineItems[].id`, not `catalogItemId`.
 * Wix caps the result at remaining stock — the returned quantity may be lower than requested.
 * @returns {Promise<object>} Updated cart.
 */
export async function updateCartItemQuantity(lineItemId, quantity) {
  const res = await wixApiRequest("/ecom/v1/carts/current/update-line-items-quantity", {
    method: "POST",
    body: { lineItems: [{ id: lineItemId, quantity }] },
  });
  return res?.cart;
}

/**
 * Remove a line from the current cart by its `cart.lineItems[].id`. Returns the updated cart.
 * @param {string} lineItemId
 */
export async function removeFromCart(lineItemId) {
  const res = await wixApiRequest("/ecom/v1/carts/current/remove-line-items", {
    method: "POST",
    body: { lineItemIds: [lineItemId] },
  });
  return res?.cart;
}

/**
 * Total number of visible products. Used for empty-state logic (0 → prompt user to add products).
 * @returns {Promise<number>}
 */
export async function countProducts() {
  const res = await wixApiRequest("/stores/v3/products/count", {
    method: "POST",
    body: { filter: { visible: true } },
  });
  return res?.count ?? 0;
}

/**
 * Query Wix Stores categories (one page).
 * @param {{ limit?: number, cursor?: string }} [options]
 * @returns {Promise<{ categories: object[], nextCursor: string|null }>}
 */
export async function queryCategories({ limit = 100, cursor } = {}) {
  const res = await wixApiRequest("/categories/v1/categories/query", {
    method: "POST",
    body: {
      treeReference: { appNamespace: "@wix/stores", treeKey: null },
      query: { cursorPaging: cursor ? { limit, cursor } : { limit } },
    },
  });
  return {
    categories: res?.categories ?? [],
    nextCursor: res?.pagingMetadata?.cursors?.next ?? null,
  };
}

/**
 * Get a single category by its URL slug. Returns null if not found.
 * Category fields: id, name, slug, visible, description, image, itemCounter, parentCategory.id
 * Full model: https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v3/categories/get-category-by-slug
 * @param {string} slug
 * @returns {Promise<object|null>}
 */
export async function getCategoryBySlug(slug) {
  const res = await wixApiRequest(`/categories/v1/categories/slug/${encodeURIComponent(slug)}`, {
    method: "GET",
    query: { "treeReference.appNamespace": "@wix/stores" },
  });
  return res?.category ?? null;
}
