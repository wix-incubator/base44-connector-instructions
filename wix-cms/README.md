# wix-cms — client-only Wix CMS skill

A self-contained skill for building a **client-only** site over an existing Wix CMS
(Wix Data) collection — listing content, item detail pages, filtering/search, public
form submissions, and full data-item CRUD. Entry point is a copyable **Wix Business
Manager prompt** (`PROMPT.md`) carrying the site's public `WIX_CLIENT_ID`; the browser
talks to Wix Data directly via dependency-free REST. Calls run as an anonymous visitor,
so they're bound by each collection's permissions. Agent-agnostic — not tied to any one
builder.

> **Note:** This folder intentionally uses a different model from the repository root
> `README.md`. The root mandates the **Wix SDK, server-side** (`@wix/sdk`, no raw
> `fetch()`). This skill is deliberately **hand-rolled REST, client-only**. It is kept
> separate on purpose; the two are independent integration paths.

## Contents
- `SKILL.md` — the skill: when to use, the API, how to wire it, hard rules, checklist.
- `PROMPT.md` — the slim copyable Business Manager handoff prompt (`<WIX_CLIENT_ID>` slot).
- `src/rest/wix-client.js` — visitor-token mint/refresh + transport (set `WIX_CLIENT_ID` here).
- `src/rest/wix-cms.js` — data-item read (`queryDataItems`, `getDataItem`, `getDataItemBy`,
  `countDataItems`) and write (`insertDataItem`, `updateDataItem`, `removeDataItem`) helpers.

Start with `SKILL.md`.
