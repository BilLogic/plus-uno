---
embodiment: all
disclosure: reference
summary: The end-of-day sweep — what it reads, where its drift cards go and who may confirm, drop or revise one.
---

# The end-of-day sweep

<!-- canonical per ADR-017 (docs/adr/) · disclosed reference, read through read_reference · distilled 2026-09-29 from #742 (both amendments), #749 and #751 · the code is agents/uno-bot/src/sweep/. -->

The **sweep** is uno-bot's end-of-day read of the design channels for **drift**: a thread settled something (a date, an owner, a scope, a status) that a Notion page it links still states the old way. uno-bot drafts the in-place fix and holds it on a proposal card until a person confirms it. Every write waits for that ✅.

## What it reads

- **Channels:** only those on `SWEEP_CHANNELS` in `agents/uno-bot/wrangler.toml` (#plus-design and #plus-design-feedback), the one line to grow. #uno-bot stays off the list whatever it says.
- **Private channels:** read only when they are also on `SLACK_SEARCH_PRIVATE_ALLOWLIST`. A private channel off the allowlist stays unread, whatever the sweep list says.
- **Group DMs:** every group DM uno-bot is in, read by one more end-of-day job. DMs stay unread.
- **When:** each weekday's end-of-day run (22:00 UTC) reads each channel since its cursor, which lives in the usage database.
- **Links:** a thread's Notion, GitHub, Figma and canvas links, read the way `source_read` reads them. Only Notion is written in place, so a thread with no Notion link is passed over.

## Where a card goes

Every proactive job sends a finding to the first rung that fits (`pickDestination`):

1. Evidence in a private channel, a group DM or a DM → that place only.
2. Evidence in a Slack thread → **that thread**.
3. A design-system target (the Figma library, `design-system/` code, Storybook, a `Universal`-pillar card) → #plus-universal.
4. Anything else → #plus-design.

#uno-bot is off the ladder, and so is defaulting to the lead. A finding reaches only people who could already see its evidence (ADR-031):

- **Private channel:** the card goes in the source thread there, its owner and confirmers are people in that channel, and its text, links and names appear in no other message.
- **Group DM:** the card goes back in that group DM. Its ✅ also posts a reworded note in the rung 3 or 4 channel, naming the page it brought up to date, with no quote and no names. The card says so before anyone confirms.
- **Mixed evidence:** a fix found both in a public thread and in a private place goes only on the private card.

## The card

- **Timing:** the card posts at the next weekday morning run (14:00 UTC), so its 72 h start when people can act on it.
- **One live card per thread,** holding up to 10 fixes. More fixes, and a later day's fixes for a thread whose card is still live, wait in the queue until that card is resolved or expires, then go out on the next one. A fix the thread has already had on a card (proposed, dropped or applied) is left off later ones.
- **Beside a turn's card:** the sweep card has its own slot in the thread, so an unrelated ask made there (filing an issue, say) stages as its own card and leaves the sweep card live.
- **Each fix** is one `notion_update` in-place replace of a whole block, stamped with the `last_edited_time` the sweep read (ADR-029). If the block has moved since then, the write is refused and nothing is written. The block keeps its type: a list item stays a list item, a to-do keeps its tick, a heading its level.
- **Plain words only:** a replace writes plain text, so the sweep offers only text blocks of plain words on one line. Code, a table row, and a block with a link, a mention or formatting are left alone, and a replace onto a block that has gained any of those since the read is refused. A drafted fix that adds a line break is discarded.
- **Shown whole:** the card shows every fix's full change, before → after, with a little context either side. A card holds only as many fixes as one Slack message shows in full; the rest wait for the next card.
- **Whole blocks only:** the detector sees every block it may rewrite in full, and a block too long for that is left alone. A drafted fix that carries a truncation mark, or comes back much shorter than its block when no one in the thread asked for a removal, is discarded.
- **Owner:** each fix names one owner, who is @-mentioned. That is whoever claimed or did the work in the thread; failing that, the linked card's `Contributor`; failing that, the thread starter.
- **Who can confirm:** the owners plus everyone who posted in the thread. A ✅ from anyone else gets the note naming who can.
- **Expiry:** after 72 hours unanswered, the card expires with no re-ping.

## Dropping, revising, declining

In a thread uno-bot entered through a sweep card, it answers a reply only when the reply is addressed to the card, before the card is decided and after: an @mention, a typed ✅ or ⛔, or a whole reply that picks fixes by number ("drop 2", "keep 1 and 3", "remove 1, 3 and 4"). A sentence with a number in it ("change 2 buttons to secondary") is the thread's own conversation, and so is the rest. A revised card, the batch result and the sweep's notes carry the sweep's mark, and none of them makes the thread uno-bot's conversation.

- **"drop 2", "keep 1 and 3":** the Worker applies these itself, by number: the revision is the card's own fixes minus the dropped ones, and it replaces the card, keeping its confirmers and its deadline — a revision lives only as long as the card had left. Dropping every fix cancels the card.
- **Any other change to the fixes** comes to you: stage the same batch without the operations the reply leaves out, every other operation byte for byte. Nothing left → cancel with `proposal_resolve`.
- **Only a confirmer can revise.** Anyone else is told who can, and the card stays as it is. This holds on every card that names its confirmers.
- **Change only what was asked:** a revision holds the card's own fixes, minus the dropped ones, each exactly as it was. A batch that touches none of the card's blocks is a separate ask, staged beside it.
- **⛔** declines the whole card.

Every item is recorded in `sweep_items` as confirmed, dropped, refused because the block had moved, refused because the block can no longer take a text replace, or failed. An item still proposed 72 h after its card posted is one that expired.
