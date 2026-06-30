---
name: wix-headless-skill-creator
description: Meta-skill for authoring a client-only, dependency-free REST skill for ANY Wix headless business solution (Bookings, Events, Restaurants, Blog, eCommerce, etc.), modeled on the wix-storefront skill. Use when a developer wants to turn a Wix business solution into a copy-pastable storefront-style skill an agent can follow in any builder. Produces the same artifacts as wix-storefront: SKILL.md + src/rest/wix-client.js + src/rest/wix-<solution>.js. The output is buyer/visitor-facing, client-only REST (no SDK, no npm), and builds only user-facing screens — never "manage" screens.
---

# Wix Headless Skill Creator

A guide for building a new **client-only Wix skill** for a given business solution
(Bookings, Events, Restaurants, Blog, etc.), structured exactly like the reference skill
in `wix-storefront/`. The end product lets any coding agent — in any builder — wire a real,
live Wix experience over a public `WIX_CLIENT_ID`, talking to Wix directly via
dependency-free REST.

**The reference implementation is `wix-storefront/`.** Read its `SKILL.md`,
`src/rest/wix-client.js`, and `src/rest/wix-store.js` before you start — you are producing the same
three files for a different business solution. When in doubt, mirror the storefront.

## What you are building (the output)
For one chosen business solution, produce a self-contained skill folder:

```
wix-<solution>/
├── SKILL.md              # the skill: when to use, the API, how to wire it, hard rules, checklist
├── PROMPT.md             # slim copyable site creation prompt (<WIX_CLIENT_ID> slot)
├── README.md             # one-screen overview pointing at SKILL.md
└── src/rest/
    ├── wix-client.js     # visitor-token mint/refresh + transport — COPIED VERBATIM from wix-storefront
    └── wix-<solution>.js # the thin domain client (the only file that really changes per solution)
```

`wix-client.js` is solution-agnostic: it is the OAuth visitor-token + transport layer. **Copy it
verbatim** from `wix-storefront/src/rest/wix-client.js` — do not re-derive it. The real work is
`src/rest/wix-<solution>.js`: a small set of thin helpers over the solution's REST endpoints,
with the core data model inlined as JSDoc.

## Process — do these in order

### 1. Map the core user flows (the 80-20) and the screens
Before any code, write down the handful of flows that cover ~80% of real usage for this
solution, and the **user-facing** screens each needs. Examples:

- **Bookings** → browse services → pick a service → pick a time slot → book/checkout.
  Screens: service list, service detail, slot picker, confirmation.
- **Events** → browse events → event detail → pick tickets → RSVP/checkout.
  Screens: event list, event detail, ticket selection, confirmation.
- **Restaurants** → browse menu → build an order → checkout/reserve.
  Screens: menu, item detail, cart, checkout.
- **Blog** → list posts → read a post → browse by category.
  Screens: post list, post detail, category page.

Keep it minimal and buyer/visitor-facing. **Build only user-facing screens — never any
"manage"/admin/dashboard screens** (the merchant manages content in the Wix dashboard).

### 2. Map the core business APIs to expose to the LLM
For each flow, list the minimum set of operations the thin client must expose — name them
in plain verbs like the storefront does (`queryProducts`, `getProductBySlug`, `addToCart`,
`checkout`). Aim for the smallest API that makes the 80-20 flows real.

### 3. Look up the exact Wix REST endpoints — never guess
Go to the **official Wix API reference** and map each operation to its concrete endpoint,
HTTP method, request body, and response shape:
- Wix API reference index: https://dev.wix.com/docs/api-reference.md
- Drill into the solution's section, e.g.:
  - Bookings: https://dev.wix.com/docs/api-reference/business-solutions/bookings.md
  - Events: https://dev.wix.com/docs/api-reference/business-solutions/events.md
  - Restaurants: https://dev.wix.com/docs/api-reference/business-solutions/restaurants.md
  - Blog: https://dev.wix.com/docs/api-reference/business-solutions/blog.md

Record the endpoint path, method, required body fields, and the key response fields you will
inline as JSDoc. Confirm every endpoint against the reference — do not infer paths from the
storefront by analogy.

### 4. Get developer approval of the flows BEFORE generating the skill
Present the mapped 80-20 flows, screens, and the proposed thin-client API surface to the
developer and **wait for explicit approval**. Do not generate `SKILL.md` or the domain
client until the flows are signed off — this is the cheapest place to correct scope.

### 5. Generate the three files
Copy `wix-client.js` verbatim, write `src/rest/wix-<solution>.js`, then write `SKILL.md`,
`PROMPT.md`, and `README.md` following the structure and design goals below.

## Design goals for the client (non-negotiable)
- **Complete and copy-pastable.** Every snippet must run as-is once `WIX_CLIENT_ID` is set.
  No TODOs, no placeholders other than the client id, no "left as an exercise".
- **REST over SDK.** Use plain `fetch` (via the shared `wix-client.js` transport). No `@wix/sdk`,
  no npm packages, no query builders. This keeps onboarding instant and works on every
  builder. We give up the SDK's built-in auth/monitoring/retries on purpose — the
  zero-dependency win pays for it.
- **Thin clients over headless components & helpers.** Assume the builder already knows how
  to build a store/blog/booking UI. Ship only the most common APIs as thin helpers — do not
  wrap every field or edge case.
- **JavaScript, not TypeScript.** For universal builder support. Use JSDoc for types.
- **Open vs. closed → prefer the client, but extend freely.** Instruct the LLM to use the
  client **as-is** for everything it already covers, but to not be afraid to **extend it with
  the missing APIs** — the "20%" the thin client deliberately leaves out. When a flow needs a
  field or endpoint the helpers don't cover, add a new helper built on `wixApiRequest` (after
  looking up the exact endpoint in the reference). Default to the snippets; reach for the
  reference to grow them when needed, not to rewrite them.
  - **Leave doc references inline for extensibility.** Next to every helper and every inlined
    model, drop a link to its exact Wix reference page so the LLM can extend it without
    hunting. **Always link the `.md` form of the doc** (append `.md` to the page URL, e.g.
    `https://dev.wix.com/docs/api-reference/business-solutions/bookings/services.md`) — the
    `.md` variant is plain-text and far more readable to an agent than the rendered HTML page.
- **Inline the core model in JSDoc comments.** The Wix data model is far from trivial.
  Document the key entity shapes (the solution's analog of Product & Cart) at the top of
  `<solution>.js` as JSDoc, with a link to the full reference (`.md` form) for anything not
  shown. This
  saves a network call and cuts iterations of fixing wrong-shape assumptions. See the
  `Product` and `Cart` typedefs in `wix-storefront/src/rest/wix-store.js` for the bar to hit.
- **User-facing screens only.** No "manage"/admin screens — content is managed in the Wix
  dashboard.
- **Provide the `WIX_CLIENT_ID`.** The skill must instruct the developer/agent to set the
  site's public headless `WIX_CLIENT_ID` (from the site creation prompt) in `wix-client.js`.
  It is buyer-facing (mints only anonymous visitor tokens), **not** a secret — safe to
  hardcode/commit.

## SKILL.md content structure (mirror wix-storefront)
Keep the same sections, in this order:

1. **Frontmatter** — `name` (`wix-<solution>`) + a `description` that says: client-only,
   dependency-free REST; when to use; that `WIX_CLIENT_ID` comes from the site creation prompt and
   is buyer-facing/not a secret; read-only over existing content where applicable; never
   provisions, never mocks data.
2. **One-paragraph intro** — what it builds and the one hard rule (talk to Wix directly via
   the public client id; never mock; always go through the official flow, never hand-build
   URLs).
3. **When to use** — the trigger phrases for this solution.
4. **Prerequisites** — the Wix app installed + content already added; the `WIX_CLIENT_ID`
   from the prompt; any later Wix setup flow that's out of scope (e.g. domain allow-listing
   for hosted checkout) — flag-and-continue if it isn't done yet.
5. **The API (copy as-is; do not re-derive it)** — list `wix-client.js` and the
   `wix-<solution>.js` exports grouped by flow. Point to the inlined JSDoc model.
6. **How to wire it (UI is the project's choice)** — one bullet per screen/flow, naming the
   exact helper and the key fields to render.
7. **Hard rules (do not violate)** — ✅/❌ list: official flow only; never hand-build URLs;
   never mock data; never invent reviews/ratings; set `WIX_CLIENT_ID`; fail loudly on
   unavailable/empty states.
8. **Beyond the snippets** — for the "20%" the helpers don't cover, extend the client: add a
   new helper on `wixApiRequest`, looking up the exact endpoint/method/body in the official
   API reference first (never guess). Keep the shipped snippets as the default and grow them
   for genuine gaps.
9. **Verification checklist (before declaring done)** — concrete, checkable items: client id
   set; visitor token persists across reload; the core happy path is really completable; the
   official redirect/flow is used (no hand-built URL); empty state shown when there's no
   content; no mock data anywhere.

## src/rest/wix-<solution>.js — how to write it
- `import { wixApiRequest } from "./wix-client.js";` and build every call on it.
- Put the inlined model JSDoc at the top (the key entities for this solution), each with a
  link to its full reference page (always the `.md` form of the URL).
- Export thin async helpers named in plain verbs, one per mapped operation. Return the data
  the UI needs (`{ items, nextCursor }` style for lists; the entity or `null` for single
  fetches). Above each helper, leave a JSDoc comment with a link to its exact Wix reference
  page (`.md` form) so the next agent can extend it without re-deriving the endpoint.
- **Fail loudly on purpose** where a silent success would let the user reach a dead end
  (out-of-stock, unavailable slot, empty cart, missing mandatory modifier) — throw, like
  `addToCart`/`checkout` do. Mandatory modifiers/customizations must be validated before
  submitting — surface the error to the UI rather than swallowing it.
- Keep pagination, slug lookups, and empty-state counts consistent with the storefront's
  patterns so agents that know one skill recognize the next.

## PROMPT.md — the site creation prompt
Mirror `wix-storefront/PROMPT.md`: a slim, **user-facing** copyable prompt that reads as the
business owner's own request, carries the `<WIX_CLIENT_ID>` slot, and points the agent at the
published raw `SKILL.md` URL. Keep the rules in `SKILL.md`, not in the prompt.

## Tell the developer to test in multiple builders
The skill is agent-agnostic by design. Before publishing, instruct the developer to run the
generated `SKILL.md` + prompt through **several builders** (e.g. Base44, Lovable, Cursor,
Claude Code, and any target builders) over a real Wix site with content already added, and to
confirm the core 80-20 flow completes end-to-end in each. Fix anything that only works in one
builder — universal support is the whole point of the REST/JS/zero-dependency choices.

## Authoring checklist (before declaring the skill done)
- [ ] 80-20 flows + user-facing screens mapped and **approved by the developer**
- [ ] Core business APIs mapped to exact Wix REST endpoints (verified against the reference)
- [ ] `wix-client.js` copied verbatim from wix-storefront (only `WIX_CLIENT_ID` to be set)
- [ ] `src/rest/wix-<solution>.js` written: thin verbs, inlined model JSDoc, fails loudly on dead ends
- [ ] `SKILL.md` follows the section structure above
- [ ] `PROMPT.md` user-facing, with `<WIX_CLIENT_ID>` slot and raw SKILL.md URL
- [ ] Only user-facing screens — no "manage"/admin screens
- [ ] No SDK, no npm, no TypeScript — REST + plain JS only
- [ ] No mock data; official flow used; no hand-built URLs
- [ ] Tested end-to-end across multiple builders on a real, stocked Wix site
