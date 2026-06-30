---
name: wix-events
description: Client-only Wix Events scaffold (dependency-free REST). Use when building or extending a Wix Events & Tickets experience over an existing site with published events — wiring live event browsing, an event detail page, RSVP registration, and ticket reservation + checkout. The public WIX_CLIENT_ID is provided in the handoff prompt and hardcoded into the snippet (it is visitor-facing, not a secret). Read-only over events/tickets; the organizer creates and publishes events in the Wix dashboard. Never provisions events, never mocks data, always completes purchase through the official Wix-hosted ticket form.
---

# Wix Events Skill

Builds a real, client-only Wix Events site. The browser talks to Wix directly over a
public `WIX_CLIENT_ID`. Never mock events; never hand-build registration or payment URLs —
register via the RSVP/ticketing APIs, and complete paid tickets on the official Wix-hosted
ticket form.

## When to use
- User wants an events site over Wix Events & Tickets, or asks to "connect Wix Events".
- Replacing placeholder/mock events with live Wix data.
- Adding event listings, an event detail page, RSVP, or ticket purchase over existing,
  published Wix events.

## Prerequisites
1. A Wix site with **Wix Events & Tickets installed and events already published** (this skill
   does NOT create events — it's read-only over them). Selling **paid** tickets also needs a
   Wix premium plan + a configured payment method; **free** events and RSVP events work without.
2. The site's public headless **`WIX_CLIENT_ID`**, provided in the handoff prompt (the Wix
   Business Manager surfaces a copyable prompt with the id filled in — see `PROMPT.md`). Paste
   it into `src/rest/wix-client.js` in place of the placeholder. It is a visitor-facing
   credential (it only mints anonymous visitor tokens), **not** a secret, so hardcoding/
   committing it is fine.
3. For paid tickets the buyer completes payment on the **Wix-hosted ticket form** (the redirect
   target of `getTicketCheckoutUrl`). The deployed app domain may need to be allow-listed on the
   OAuth client for that page to return cleanly — a **separate Wix setup the user completes
   later**, out of this skill's scope. If the return fails before that's done, that's expected;
   flag it and continue.

## The API (copy as-is; do not re-derive it)
This skill ships only the REST layer — no UI components. Build the events UI however the
project wants; wire it to these two snippets. Copy them into the app (e.g. `src/api/`) and only
adjust import paths:
- `src/rest/wix-client.js` — visitor-token mint/refresh + transport. Set `WIX_CLIENT_ID` to the
  id from the prompt (replace the `<YOUR-CLIENT-ID>` placeholder). The visitor refresh token is
  persisted to localStorage and IS the identity of the visitor's ticket reservation/cart — do
  not re-mint anonymously per load.
- `src/rest/wix-events.js` — exports:
  - **Browse:** `queryEvents`, `getEventBySlug`, `countUpcomingEvents`
  - **Categories:** `queryEventCategories`, `listEventsByCategory`
  - **RSVP:** `createRsvp`
  - **Ticketing:** `queryTicketDefinitions`, `reserveTickets`, `getTicketCheckoutUrl`, `checkoutTickets`

The `Event`, `TicketDefinition`, and `RSVP`/`Order` shapes are documented as JSDoc comments at
the top of `wix-events.js`. Read them before building the UI — they describe the key fields and
link to the full API reference for anything not shown.

## How to wire it (UI is the project's choice)
- **Event grid** — `queryEvents()` lists live (UPCOMING/STARTED) events, soonest first. Render
  `title`, `mainImage.url`, `dateAndTimeSettings.formatted.dateAndTime`, `location.name`, and
  `shortDescription`. Use `offset`/`nextOffset` from the result to page. Link each card by `slug`.
- **Event detail** — `getEventBySlug(slug)`; returns null on miss — show a not-found state, never
  invent an event. Branch the registration UI on `event.registration.type`:
  - `"RSVP"` → render the RSVP form (fields from `event.form.controls`).
  - `"TICKETING"` → render the ticket picker.
  - `"EXTERNAL"` → link out to `event.registration.external.url`.
  - `"NONE"` → details only, no registration.
  Only `registration.status` values starting `OPEN_` accept new registrations; otherwise show the
  closed state.
- **Categories (optional)** — `queryEventCategories()` for a filter menu (`counts.assignedEventsCount`
  per category); `listEventsByCategory(categoryId)` to list a category's events (same card fields
  and paging as `queryEvents`).
- **RSVP** — `createRsvp(eventId, { firstName, lastName, email, status, additionalGuestNames?, extraFields? })`.
  `status` defaults to `"YES"`; only offer `"NO"` when `registration.rsvp.responseType` is
  `"YES_AND_NO"`. If the event is full with a waitlist enabled, the returned RSVP comes back with
  status `"WAITLIST"` — tell the guest. Completes fully client-side; no redirect.
- **Ticketing** — show tickets, reserve, then complete on the hosted form:
  1. `queryTicketDefinitions(eventId)` → render each ticket's `name`, price (`pricingMethod.fixedPrice.value`
     + currency, or `pricingOptions`/`guestPrice`), and availability (`salesDetails.soldOut`).
  2. `reserveTickets([{ ticketDefinitionId, quantity, guestPrice?, pricingOptionId? }])` → holds the
     tickets; returns `{ id, expirationDate }`. Show a countdown to `expirationDate` if you like.
  3. `window.location.href = getTicketCheckoutUrl(event, reservation.id)` → the Wix-hosted ticket
     form collects guest details + payment and returns the buyer to the event. This is the path for
     **all paid tickets**.
  - **Free tickets only:** you may instead call `checkoutTickets(eventId, { reservationId, buyer, guests })`
    to finish in-app — it returns an order with status `"FREE"`, a `ticketsPdf`, and `tickets[]`. It
    throws for paid orders (status `INITIATED`), telling you to use the hosted form.
- **Empty state** — if `countUpcomingEvents()` is 0, show an empty state telling the user to publish
  events in their Wix dashboard. Never invent events.

## Hard rules (do not violate)
- ✅ Complete paid ticket purchases ONLY via `reserveTickets()` → `getTicketCheckoutUrl()` redirect
  (the official Wix-hosted ticket form). 
- ❌ Never hand-build registration, ticket, payment, or checkout URLs — derive the hosted form URL
  from `event.eventPageUrl` via `getTicketCheckoutUrl`.
- ❌ Never mock events, tickets, or guest counts — render live Wix data or the empty/closed state.
- ❌ Never invent reviews, ratings, attendee names, or "X spots left" numbers not returned by the API.
- ✅ Set `WIX_CLIENT_ID` from the prompt's value (public visitor-facing client id — safe to hardcode).
- ✅ Branch registration UI on `event.registration.type`; respect `registration.status` (only `OPEN_*`
  accepts registrations) and ticket `saleStatus`/`salesDetails.soldOut`.
- ✅ Pass `guestPrice` for donation/"pay what you want" tickets and `pricingOptionId` for tiered tickets
  to `reserveTickets`.
- The helpers fail loudly on purpose: `reserveTickets` throws when tickets aren't actually held,
  `createRsvp` throws on closed/full registration, `checkoutTickets` throws when payment is still owed.
  A green path means it really worked — don't swallow these.

## Beyond the snippets
The snippets cover the common RSVP + ticketing paths. If you hit a use case they don't cover
(coupons/`discount` at checkout, members/auth, schedule/agenda, seating maps, canceling a
reservation, a field not in the typedefs), make the call yourself with `wixApiRequest` — but look
up the exact endpoint, HTTP method, and request body in the **official Wix Events API reference**
first; never guess:
- Events API reference: https://dev.wix.com/docs/api-reference/business-solutions/events.md
- Registration (RSVP + ticketing) overview: https://dev.wix.com/docs/api-reference/business-solutions/events/registration/introduction.md
- Ticketing flow (reservations → orders → tickets): https://dev.wix.com/docs/api-reference/business-solutions/events/registration/ticketing/introduction.md

Keep the snippets as the default for everything they already do; reach for the API reference only
for the gap.

## Verification checklist (before declaring done)
- [ ] `WIX_CLIENT_ID` set to the prompt's value (not the `<YOUR-CLIENT-ID>` placeholder)
- [ ] Visitor token persists across reload (same visitor identity for reservations)
- [ ] Event grid renders live events; clicking a card opens the detail page by `slug`
- [ ] Detail page branches correctly on `registration.type` (RSVP form vs. ticket picker vs. external link)
- [ ] RSVP submit creates a real RSVP (and surfaces a `WAITLIST` result when the event is full)
- [ ] Ticket purchase reserves tickets, then redirects via `getTicketCheckoutUrl` (no hand-built URL)
- [ ] Paid checkout lands on the Wix-hosted ticket form; buyer returns to the event afterward
- [ ] Closed registration / sold-out tickets show a clear state rather than a dead end
- [ ] Empty state shown when `countUpcomingEvents()` is 0
- [ ] No mock events, tickets, or attendee data anywhere
