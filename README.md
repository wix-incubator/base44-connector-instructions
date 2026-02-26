# Base44 Wix Connector LLM Instructions

## Core Constraint

Use only Wix SDK business solutions & business management modules (`@wix/sdk`); no raw REST or `fetch()`. Import modules from `npm:@wix/[module]` (e.g. `npm:@wix/stores`, `npm:@wix/ecom`).

## Mandatory Lookup — Before Writing Any Wix Code

ALWAYS use the `fetch_website` tool FIRST to confirm exact module names and method signatures. Check the **Wix SDK Module Index** at the bottom of this file — if the relevant package is listed, fetch that specific module URL directly. If not found in the index, fall back to the full API reference at https://dev.wix.com/docs/api-reference.md. NEVER write Wix code without confirming the API first.

## Client Setup

```javascript
import { createClient } from "npm:@wix/sdk";
import { productsV3 } from "npm:@wix/stores";
const wixClient = createClient({
  modules: { productsV3 },
  headers: { Authorization: `Bearer ${accessToken}` },
});
const { items } = await wixClient.productsV3.queryProducts().find();
```

## Rules

1. Set token via `headers` in `createClient`, never `auth`.
2. Pass the entity object directly to create/update (e.g. `updateProduct(id, data)` not `updateProduct(id, { product: data })`); check the reference for required/updatable fields.
3. Group functions by business model into fewer backend files to reduce deployment time.
4. ALWAYS test the generated Base44 backend functions and fix them if they are not working.

## Critical Gotchas

**Stores — Catalog V3 only:** When using `@wix/stores`, use only Catalog V3 modules (`productsV3`, `inventoryItemsV3`, etc.). NEVER use Catalog V1 (`products`, `inventory`, etc.). Inform the user that the app will work only with Catalog V3 stores. Reference: https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v3.md

**Media — convert before rendering:** Wix media fields (images, videos) return internal `wix:image://` identifiers, NOT renderable URLs. Always use `import { media } from 'npm:@wix/sdk'` and convert — e.g. `const { url } = media.getImageUrl(product.media.mainMedia.image)`. Never pass raw Wix media identifiers directly to `<img src>` or similar. Reference: https://dev.wix.com/docs/sdk/articles/work-with-the-sdk/work-with-wix-media.md

## Wix SDK Module Index

| Package            | Reference                                                                                                   | Top Modules                                                                                                                                                                                                                                                                                                                                                           |
| ------------------ | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@wix/stores`      | [Catalog V3](https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v3.md)                | [Products V3](https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v3/products-v3.md) · [Inventory V3](https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v3/inventory-items-v3.md) · [Categories](https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v3/categories.md)                               |
| `@wix/ecom`        | [eCommerce](https://dev.wix.com/docs/api-reference/business-solutions/e-commerce.md)                        | [Orders](https://dev.wix.com/docs/api-reference/business-solutions/e-commerce/orders.md) · [Checkout](https://dev.wix.com/docs/api-reference/business-solutions/e-commerce/purchase-flow/checkout/checkout.md) · [Cart](https://dev.wix.com/docs/api-reference/business-solutions/e-commerce/purchase-flow/cart/cart.md) · [Discount Rules](https://dev.wix.com/docs/api-reference/business-solutions/e-commerce/extensions/discounts/discount-rules.md) |
| `@wix/bookings`    | [Bookings](https://dev.wix.com/docs/api-reference/business-solutions/bookings.md)                           | [Services](https://dev.wix.com/docs/api-reference/business-solutions/bookings/services.md) · [Bookings](https://dev.wix.com/docs/api-reference/business-solutions/bookings/bookings.md) · [Staff Members](https://dev.wix.com/docs/api-reference/business-solutions/bookings/staff-members.md) · [Time Slots](https://dev.wix.com/docs/api-reference/business-solutions/bookings/time-slots.md) |
| `@wix/events`      | [Events](https://dev.wix.com/docs/api-reference/business-solutions/events.md)                               | [Events V3](https://dev.wix.com/docs/api-reference/business-solutions/events/event-management/events-v3.md) · [Ticket Definitions V3](https://dev.wix.com/docs/api-reference/business-solutions/events/event-management/ticket-definitions-v3.md) · [Event Guests](https://dev.wix.com/docs/api-reference/business-solutions/events/registration/event-guests.md) · [RSVP V2](https://dev.wix.com/docs/api-reference/business-solutions/events/registration/rsvp-v2.md) |
| `@wix/restaurants` | [Restaurants](https://dev.wix.com/docs/api-reference/business-solutions/restaurants.md)                     | [Menus](https://dev.wix.com/docs/api-reference/business-solutions/restaurants/wix-restaurants-new/menus.md) · [Online Orders](https://dev.wix.com/docs/api-reference/business-solutions/restaurants/wix-restaurants-new/online-orders.md) · [Reservations](https://dev.wix.com/docs/api-reference/business-solutions/restaurants/wix-restaurants-new/reservations.md) |
| `@wix/blog`        | [Blog](https://dev.wix.com/docs/api-reference/business-solutions/blog.md)                                   | [Posts & Stats](https://dev.wix.com/docs/api-reference/business-solutions/blog/posts-stats.md) · [Draft Posts](https://dev.wix.com/docs/api-reference/business-solutions/blog/draft-posts.md) · [Categories](https://dev.wix.com/docs/api-reference/business-solutions/blog/category.md)                                                                              |
| `@wix/crm`         | [Contacts](https://dev.wix.com/docs/api-reference/crm/members-contacts/contacts.md)                         | [Contacts](https://dev.wix.com/docs/api-reference/crm/members-contacts/contacts.md) · [Tasks](https://dev.wix.com/docs/api-reference/crm/crm/tasks.md)                                                                                                                                                                                                                |
| `@wix/members`     | [Members](https://dev.wix.com/docs/api-reference/crm/members-contacts/members/member-management/members.md) | [Members](https://dev.wix.com/docs/api-reference/crm/members-contacts/members/member-management/members.md)                                                                                                                                                                                                                                                           |
| `@wix/inbox`       | [Inbox](https://dev.wix.com/docs/api-reference/crm/communication/inbox.md)                                  | [Messages](https://dev.wix.com/docs/api-reference/crm/communication/inbox/messages.md) · [Conversations](https://dev.wix.com/docs/api-reference/crm/communication/inbox/conversations.md)                                                                                                                                                                             |
| `@wix/forms`       | [Forms](https://dev.wix.com/docs/api-reference/crm/forms.md)                                                | [Form Schemas](https://dev.wix.com/docs/api-reference/crm/forms/form-schemas.md) · [Form Submissions](https://dev.wix.com/docs/api-reference/crm/forms/form-submissions.md)                                                                                                                                                                                           |
| `@wix/email-marketing` | [Email Marketing](https://dev.wix.com/docs/api-reference/business-management/marketing/emails/email-marketing.md) | [Campaign](https://dev.wix.com/docs/api-reference/business-management/marketing/emails/email-marketing/campaign.md) |
