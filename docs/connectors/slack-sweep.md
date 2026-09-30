---
embodiment: all
disclosure: reference
summary: The end-of-day sweep — what it reads, where its drift cards go, who may confirm, drop or revise one, and how its commitment reminders nudge a promiser.
---

# The end-of-day sweep

<!-- canonical per ADR-017 (docs/adr/) · disclosed reference, read through read_reference · distilled 2026-09-29 from #742 (both amendments), #749, #751 and #764 · the code is agents/uno-bot/src/sweep/. -->

The **sweep** is uno-bot's end-of-day read of the design channels for **drift**: a thread settled something (a date, an owner, a scope, a status) that a Notion page it links still states the old way. uno-bot drafts the in-place fix and holds it on a proposal card until a person confirms it. Every write waits for that ✅.

## What it reads

- **Channels:** only those on `SWEEP_CHANNELS` in `agents/uno-bot/wrangler.toml` (#plus-design and #plus-design-feedback), the one line to grow. #uno-bot stays off the list whatever it says.
- **Private channels:** read only when they are also on `SLACK_SEARCH_PRIVATE_ALLOWLIST`. A private channel off the allowlist stays unread, whatever the sweep list says.
- **Group DMs:** every group DM uno-bot is in, read by one more end-of-day job. DMs stay unread.
- **When:** each weekday's end-of-day run (22:00 UTC) reads each channel since its cursor, which lives in the usage database.
- **Links:** a thread's Notion, GitHub, Figma and canvas links, read the way `source_read` reads them. Only Notion is written in place, so a thread with no Notion link, no named page and no answered question is passed over.
- **Named, not linked:** a message that names a page ("the booking PRD", "the tutor help center") has it searched for in Notion, then in GitHub. Only the top hit is kept, and only above the match floor. The card marks that page *found by search*, so a confirmer can drop a wrong target with one reply.
- **Running notes and Roadmap cards:** two more end-of-day jobs read the Design Running Notes and the Roadmap cards edited since their own cursors. A note's new blocks, or a card's new comments and body edits, are the record. Only team notes are read. A 1:1 note, or any page that is not a row of the running-notes database, stays unread.

## Where a card goes

Every proactive job sends a finding to the first rung that fits (`pickDestination`):

1. Evidence in a private channel, a group DM or a DM → that place only.
2. Evidence in a Slack thread → **that thread**.
3. A design-system target (the Figma library, `design-system/` code, Storybook, a `Universal`-pillar card) → #plus-universal.
4. Anything else → #plus-design.

#uno-bot is off the ladder, and so is defaulting to the lead. A finding reaches only people who could already see its evidence (ADR-031):

- **Private channel:** the card goes in the source thread there, its owner and confirmers are people in that channel, and its text, links and names appear in no other message.
- **Group DM:** the card goes back in that group DM, and its ✅ applies the fix only. Once that batch has written a page, a separate **share card** follows in the same thread. It shows the exact note and names its channel (rung 3 or 4): the page's name and link, with no quote and no names. Its ✅ posts that note; its ⛔ drops it. It has the fix card's confirmers and 72 h. A revised or re-staged fix card offers no share.
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

## Answers and decisions no page holds yet

- **An answer given only in chat (C3):** a thread asks a question, someone answers it, and no page it links or a search finds states that answer. The card goes in that thread, mentions whoever answered, and proposes the exact page, the section and the line: "add under *Tutor Training PRD › Session setup*: 'Ratio is 1 tutor to 4–5 students.'" When no section fits, it opens a new section at the end of the closest page. Its ✅ writes the line after the section's last block, stamped like a replace: if that block has moved since the read, nothing is written. It is always a proposal card, and it files no intake and no ticket. Reply to adjust it, the way you would revise any card.
- **A decision in a note or on a card (C4):** a running note, or a card's comment or edit, records a decision a page still states the old way. It has no thread, so the card goes by its target: #plus-universal for a design-system target (a `Universal`-pillar card), #plus-design for anything else. The owner is the target card's `Contributor`, then the note's takers or the card's own Contributors. Those people can confirm. The card links the note block or the card it came from.
- **Discussion is not a decision:** options weighed, a question, a proposal or a to-do in a note produces nothing.

## Dropping, revising, declining

In a thread uno-bot entered through a sweep card, it answers a reply only when the reply is addressed to the card, before the card is decided and after: an @mention, a typed ✅ or ⛔, or a whole reply that picks fixes by number ("drop 2", "keep 1 and 3", "remove 1, 3 and 4"). A sentence with a number in it ("change 2 buttons to secondary") is the thread's own conversation, and so is the rest. A revised card, the batch result and the sweep's notes carry the sweep's mark, and none of them makes the thread uno-bot's conversation.

- **"drop 2", "keep 1 and 3":** the Worker applies these itself, by number: the revision is the card's own fixes minus the dropped ones, and it replaces the card, keeping its confirmers and its deadline — a revision lives only as long as the card had left. Dropping every fix cancels the card.
- **Any other change to the fixes** comes to you: stage the same batch without the operations the reply leaves out, every other operation byte for byte. Nothing left → cancel with `proposal_resolve`.
- **Only a confirmer can revise.** Anyone else is told who can, and the card stays as it is. This holds on every card that names its confirmers.
- **Change only what was asked:** a revision holds the card's own fixes, minus the dropped ones, each exactly as it was. A batch that touches none of the card's blocks is a separate ask, staged beside it.
- **⛔** declines the whole card.

Every item is recorded in `sweep_items` as confirmed, dropped, refused because the block had moved, refused because the block can no longer take a text replace, or failed. An item still proposed 72 h after its card posted is one that expired.

## Commitment reminders

The same end-of-day read also looks for **commitments**: someone in a swept thread takes on a task themselves ("I'll share the Figma link by Thu", or "yep, will do" to a request). uno-bot nudges the person who promised if it looks undone. The code is `agents/uno-bot/src/commitments/`.

- **Detected** at the end-of-day run, from that night's new messages only. A hypothetical, a joke or a promise made for someone else is not a commitment, and only people's messages count, not uno-bot's.
- **Due** at the end of the day the promiser named (ET, Monday to Friday), or two working days after the promise when they named none.
- **Checked first:** at the first weekday morning run after it is due (14:00 UTC), uno-bot reads the thread since the promise, the promiser's later messages in the channel and the Notion or GitHub pages they linked. If those show it done, the commitment closes and nothing is posted.
- **Where:** a reply in the promise's own thread, mentioning only the promiser. It follows `pickDestination` like every proactive job, so it stays out of #uno-bot and mentions the promiser rather than the lead.
- **Answers,** from the promiser, as reactions on the reminder: 🙌 done, ⏳ soon (due again two working days out, at most twice), 🙅 not doing it, 🤔 not a promise. The answer replaces the legend in place and sends no new ping. Anyone else's reaction, and any other emoji (✅ included), changes nothing.
- **One follow-up:** a reminder nobody answers gets one more, "Still on your list?", two working days later. If that one also goes unanswered, the commitment lapses silently. Those two posts are the whole allowance: a ⏳ moves the date and adds no post, and every reminder posted stays answerable.
- **Said again:** a new promise by the same person in the same thread ("sorry, will do by Fri") is the same task. It adds no reminder, and a later day it names moves the due date the way a ⏳ does.
- **Limits:** at most two reminders per person each morning; the rest wait for the next one. A commitment left unchecked or unposted three mornings running (an archived channel, a deleted thread) lapses.
- **Stored:** a `commitments` row in the usage database holds ids, times, the state and two counts. The short summary of what was promised stays in KV with an expiry, and message text and links stay out of the database (ADR-030).
