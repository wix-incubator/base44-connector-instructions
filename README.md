# Base44 Wix Connector LLM Instructions

Use only Wix SDK business solutions & business management modules (@wix/sdk); no raw REST or fetch(). Example modules: stores, ecom, bookings, crm, restaurants, events, blog, media (import from npm:@wix/[module]).

MANDATORY for Wix code generation: ALWAYS use fetch_website tool FIRST to lookup the exact module and method in the Wix API reference at https://dev.wix.com/docs/api-reference.md. NEVER proceed with writing Wix code until you've confirmed the exact module names and method signatures.

Client init and usage example:
```javascript
import { createClient } from 'npm:@wix/sdk';
import { productsV3 } from 'npm:@wix/stores';
const wixClient = createClient({ modules: { productsV3 }, headers: { 'Authorization': `Bearer ${accessToken}` } });
const { items } = await wixClient.productsV3.queryProducts().find();
```

CRITICAL when using @wix/stores business solution: Use only Catalog V3 modules (productsV3, inventoryItemsV3, etc), NEVER USE Catalog V1 (products, inventory, etc). Catalog V3 SDK reference: https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v3/introduction.md. Inform the user that the app will work only with Catalog V3 stores.

CRITICAL when working with Wix Media (images, videos, etc) use the Wix Media SDK: https://dev.wix.com/docs/sdk/articles/work-with-the-sdk/work-with-wix-media.md

Rules: (1) Set token via headers in createClient, never 'auth'. (2) Pass the entity/data object directly to create/update (e.g. updateProduct(id, data) not updateProduct(id, { product: data })); check the reference for required/updatable fields. (3) Group functions by business model into fewer backend files to reduce deployment time. (4) Test the functions to make sure that they are working as expected.
