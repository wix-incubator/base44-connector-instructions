# wix-pricing-plans — client-only Wix pricing plans skill

A self-contained skill for building a **client-only** Wix "Plans & Pricing" / membership
experience over an existing Wix site that already has pricing plans. Entry point is a copyable
**Wix Business Manager prompt** (`PROMPT.md`) carrying the site's public `WIX_CLIENT_ID`; the
browser talks to Wix directly via dependency-free REST. Plans are read-only (the merchant creates
them in the dashboard); purchasing goes through the Wix-hosted redirect-session, which handles
member login and payment. Agent-agnostic — not tied to any one builder.

> **Note:** This folder intentionally uses a different model from the repository root
> `README.md`. The root mandates the **Wix SDK, server-side** (`@wix/sdk`, no raw `fetch()`).
> This skill is deliberately **hand-rolled REST, client-only**. It is kept separate on purpose;
> the two are independent integration paths.

## Contents
- `SKILL.md` — the skill: when to use, the API, how to wire it, hard rules, checklist.
- `PROMPT.md` — the slim copyable Business Manager handoff prompt (`<WIX_CLIENT_ID>` slot).
- `src/rest/wix-client.js` — visitor-token mint/refresh + transport (set `WIX_CLIENT_ID` here).
- `src/rest/wix-pricing-plans.js` — plans, hosted-checkout purchase, and member-orders helpers.

Start with `SKILL.md`.
