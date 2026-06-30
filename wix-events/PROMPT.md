# Handoff prompt: Wix Business Manager → Wix events site

The Wix Business Manager fills in `<WIX_CLIENT_ID>` (the site's public headless client id),
then the user copies this prompt into any coding agent. The prompt is **user-facing** — it
reads as the event organizer's own request and points the agent at the published `SKILL.md`
(the rules, steps, and gotchas live there, not in the prompt).

## Copyable prompt

> Build an events site for my Wix Events & Tickets page — visitors should be able to browse my
> events, open an event, RSVP, and buy tickets.
>
> Fetch and follow these instructions exactly:
> https://raw.githubusercontent.com/wix-incubator/base44-connector-instructions/refs/heads/master/wix-events/SKILL.md
>
> My Wix client ID is `<WIX_CLIENT_ID>`.

Fill in `<WIX_CLIENT_ID>` before sharing.
