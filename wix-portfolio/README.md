# wix-portfolio — client-only Wix portfolio skill

A self-contained skill for building a **client-only** Wix portfolio showcase over an existing
Wix site with **Wix Portfolio** installed and content added. Entry point is a copyable **Wix
Business Manager prompt** (`PROMPT.md`) carrying the site's public `WIX_CLIENT_ID`; the browser
talks to Wix directly via dependency-free REST. Read-only over the content tree
**Collection → Project → Project Item (image/video)**. Agent-agnostic — not tied to any one builder.

> **Note:** This folder intentionally uses a different model from the repository root
> `README.md`. The root mandates the **Wix SDK, server-side** (`@wix/sdk`, no raw
> `fetch()`). This skill is deliberately **hand-rolled REST, client-only**. It is kept
> separate on purpose; the two are independent integration paths.

## Contents
- `SKILL.md` — the skill: when to use, the API, how to wire it, hard rules, checklist.
- `PROMPT.md` — the slim copyable Business Manager handoff prompt (`<WIX_CLIENT_ID>` slot).
- `src/rest/wix-client.js` — visitor-token mint/refresh + transport (set `WIX_CLIENT_ID` here).
- `src/rest/wix-portfolio.js` — collections, projects, and project-item (media) helpers.

Start with `SKILL.md`.
