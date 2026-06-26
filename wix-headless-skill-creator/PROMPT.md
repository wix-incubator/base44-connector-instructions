# How to use the wix-headless-skill-creator

Paste the prompt below into any coding agent to kick off the creation of a new
client-only Wix skill for a chosen business solution. The agent will read the
full authoring guide from `SKILL.md` and follow the process end-to-end.

## Copyable prompt

> I want to build a new Wix headless skill for **<SOLUTION>** (e.g. Bookings, Events, Restaurants, Blog).
>
> Fetch and follow these instructions exactly:
> https://raw.githubusercontent.com/wix-incubator/base44-connector-instructions/refs/heads/master/wix-headless-skill-creator/SKILL.md

Replace `<SOLUTION>` with the Wix business solution you are targeting before
you start. The agent will map flows, look up endpoints, ask for your approval,
then generate the skill folder (`wix-<solution>/`).
