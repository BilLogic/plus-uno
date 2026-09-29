---
embodiment: all
disclosure: reference
summary: The end-of-day sweep — what it reads, where its drift cards go and who may confirm, drop or revise one.
---

# The end-of-day sweep

<!-- canonical per ADR-017 (docs/adr/) · disclosed reference, read through read_reference · distilled 2026-09-29 from #742 (both amendments) and #749 · the code is agents/uno-bot/src/sweep/. -->

The **sweep** is uno-bot's end-of-day read of the design channels for **drift**: a thread settled something (a date, an owner, a scope, a status) that a Notion page it links still states the old way. uno-bot drafts the in-place fix and holds it on a proposal card until a person confirms it. Every write waits for that ✅.

## What it reads

- **Channels:** only those on `SWEEP_CHANNELS` in `agents/uno-bot/wrangler.toml`, which starts with #plus-design and is the one line to grow. #uno-bot stays off the list whatever it says. Private channels are skipped for now, and DMs and group DMs stay unread.
- **When:** each weekday's end-of-day run (22:00 UTC) reads each channel since its cursor, which lives in the usage database.
- **Links:** a thread's Notion, GitHub, Figma and canvas links, read the way `source_read` reads them. Only Notion is written in place, so a thread with no Notion link is passed over.

## Where a card goes

Every proactive job sends a finding to the first rung that fits (`pickDestination`):

1. Evidence in a private channel, a group DM or a DM → that place only.
2. Evidence in a Slack thread → **that thread**.
3. A design-system target (the Figma library, `design-system/` code, Storybook, a `Universal`-pillar card) → #plus-universal.
4. Anything else → #plus-design.

#uno-bot is off the ladder, and so is defaulting to the lead. A finding reaches only people who could already see its evidence. Every sweep card today comes from a public thread and is posted in that thread.

## The card

- **Timing:** the card posts at the next weekday morning run (14:00 UTC), so its 72 h start when people can act on it.
- **Grouping:** one card per source thread per day. Each card holds up to 10 fixes, and more fixes go on more cards in the same thread. A fix the thread has already had on a card (proposed, dropped or applied) is left off later ones.
- **Several cards in one thread:** each stays live on its own. A reply revises the newest one, so to change an earlier card, react on it directly.
- **Each fix** is one `notion_update` in-place replace, stamped with the `last_edited_time` the sweep read (ADR-029). If the block has moved since then, the write is refused and nothing is written.
- **Owner:** each fix names one owner, who is @-mentioned. That is whoever claimed or did the work in the thread; failing that, the linked card's `Contributor`; failing that, the thread starter.
- **Who can confirm:** the owners plus everyone who posted in the thread. A ✅ from anyone else gets the note naming who can.
- **Expiry:** after 72 hours unanswered, the card expires with no re-ping.

## Dropping, revising, declining

- **Drop an item:** reply in the thread ("drop 2"). Stage the same batch without that operation, keeping every other operation byte for byte. The revision replaces the card and keeps its TTL and its confirmers.
- **Drop the last item:** cancel the card through `proposal_resolve`.
- **Only a confirmer can revise.** Anyone else is told who can, and the card stays as it is.
- **Change only what was asked:** a revision holds the card's own fixes, minus the dropped ones, each exactly as it was.
- **⛔** declines the whole card.

Every item is recorded in `sweep_items` as confirmed, dropped, refused because the block had moved, or failed. An item still proposed 72 h after its card posted is one that expired.
