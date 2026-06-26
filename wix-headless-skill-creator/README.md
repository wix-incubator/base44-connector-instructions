# wix-headless-skill-creator — author a client-only Wix skill for any business solution

A meta-skill for turning **any** Wix headless business solution (Bookings, Events,
Restaurants, Blog, eCommerce, …) into a self-contained, copy-pastable skill an agent can
follow in any builder — structured exactly like `wix-storefront/`.

The output is always: client-only, dependency-free **REST** (no SDK, no npm), plain
**JavaScript**, **user-facing screens only**, talking to Wix directly over a public
`WIX_CLIENT_ID`.

## Contents
- `SKILL.md` — the authoring guide: process (map 80-20 flows → screens → APIs → exact REST
  endpoints → get approval → generate), design goals, and the SKILL.md structure to mirror.
- `src/rest/client.js` — the solution-agnostic visitor-token + transport layer. Copied
  verbatim into every generated skill; only `WIX_CLIENT_ID` changes.

## How to use
1. Read `SKILL.md` here, and read the reference skill in `wix-storefront/` end-to-end.
2. Pick a business solution and map its 80-20 flows + user-facing screens.
3. Map the core APIs and look each one up in the Wix API reference
   (https://dev.wix.com/docs/api-reference.md).
4. **Get developer approval of the flows** before generating anything.
5. Generate `wix-<solution>/` with `SKILL.md`, `PROMPT.md`, `README.md`,
   `src/rest/client.js` (verbatim), and `src/rest/<solution>.js` (the thin domain client).
6. Test the generated skill across multiple builders on a real Wix site.

Start with `SKILL.md`.
