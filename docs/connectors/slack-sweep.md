---
embodiment: all
disclosure: reference
summary: The end-of-day sweep — what it reads, where its drift cards go, who may confirm, drop or revise one, how it asks about a read-only file, how its commitment reminders nudge a promiser, and its card follow-ups.
---

# The end-of-day sweep

<!-- canonical per ADR-017 (docs/adr/) · disclosed reference, read through read_reference · distilled 2026-09-29 from #742 (both amendments), #749, #750, #751 and #764 · the code is agents/uno-bot/src/sweep/. -->

The **sweep** is uno-bot's end-of-day read of the design channels for **drift**: a thread settled something (a date, an owner, a scope, a status) that a Notion page it links still states the old way. uno-bot drafts the in-place fix and holds it on a proposal card until a person confirms it. Every write waits for that ✅.

## What it reads

- **Channels:** only those on `SWEEP_CHANNELS` in `agents/uno-bot/wrangler.toml` (#plus-design and #plus-design-feedback), the one line to grow. #uno-bot stays off the list whatever it says.
- **Private channels:** read only when they are also on `SLACK_SEARCH_PRIVATE_ALLOWLIST`. A private channel off the allowlist stays unread, whatever the sweep list says.
- **Group DMs:** every group DM uno-bot is in, read by one more end-of-day job.
- **DMs:** unread, except a person's own DMs once they tick "Catch decisions from my DMs" on the Home tab. Those are read with their own token, and the fix goes on a card in their DM with uno-bot that only they can confirm (ADR-032).
- **When:** each weekday's end-of-day run (6 pm ET) reads each channel since its cursor, which lives in the usage database.
- **Links:** a thread's Notion, GitHub, Figma and canvas links, read the way `source_read` reads them. Only Notion is written in place. A thread with no Notion, Figma or `design-system/` code link, no named page and no answered question is passed over.
- **Named, not linked:** a message that names a page in two or more words ("the booking flow PRD", "the tutor help center") has it searched for in Notion, then in GitHub. Only the top hit is kept, only when it shares two words with the name, and only from a team surface: a Roadmap card, a Help Center article, a Decisions or Marketplace row, or a top-level workspace page titled as a PRD or spec. A page nested under another page, and any page titled as a 1:1, is no hit. The card marks that page *found by search*, so a confirmer can drop a wrong target with one reply. A search that fails finds nothing and holds nothing up.
- **Running notes and Roadmap cards:** two more end-of-day jobs read the Design Running Notes and the Roadmap cards edited since their own cursors. A note's new blocks, or a card's new comments and body edits, are the record. Only team notes are read. A 1:1 note (tagged `1:1` in *Note Type*, or titled as one), or any page that is not a row of the running-notes database, stays unread, and so does a 1:1 that a thread links or a search finds.

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

- **Timing:** the card posts at the next weekday morning run (10 am ET), so its 72 h start when people can act on it.
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

- **An answer given only in chat (C3):** a thread asks a question, someone answers it, and no page it links or a search finds states that answer. The card goes in that thread, mentions whoever answered, and proposes the exact page, the section and the line: "add under *Tutor Training PRD › Session setup*: 'Ratio is 1 tutor to 4–5 students.'" When no section fits, it opens a new section at the end of the closest page. Its ✅ writes the line after the section's last block, stamped like a replace: if that block has moved since the read, nothing is written. It is always a proposal card, and it files no intake and no ticket. A card that adds an answer is revised by `drop N` alone; for any other change, ⛔ it and ask.
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

## Drift in a read-only file

When a thread settles something a linked Figma file, `design-system/` code, Storybook page or repo file may not show yet, uno-bot does not try to edit the file. The code is `agents/uno-bot/src/figma-drift/`.

- **The ask:** the next weekday morning run posts once in that thread, naming every file it discussed: "you talked about <file> — is the Figma up to date?" (or "the code", or "Storybook"; "are they up to date?" for several). Each file is linked, and only each file's owner is @-mentioned. A Figma file's last publisher is named by handle, in bold, as plain text rather than an @-mention. The ask goes where `pickDestination` puts it, as a sweep card does.
- **The drafted intakes:** a thread that drafts intakes gets one card, in its own slot beside any sweep card or turn card, holding one intake per file. Its ✅ files a Roadmap card from the PRD template (`notion_create`, surface `prd`) for a Figma file, or a `harness-intake` issue (`github_issue_create`) for code or a repo file. `drop 2` leaves a file out, as on a sweep card. The Product Pillar is only ever a value the Roadmap already offers, taken from a Roadmap card the thread linked (Universal for the design-system library). An unknown value is left out, and the card says so.
- **The public repo:** an issue drafted from a private channel, a group DM or a DM carries only the file and one neutral line, with no thread words and no link back. Any `@handle` in an issue's text is set in code. A Roadmap card from a private channel carries the thread's words after a ✅ from someone in it.
- **One intake per file:** when several threads discussed the same file, the first gets the card and the others get the question alone, pointing at it. While that card is live, a new thread about the file also gets the question alone, and a thread whose own drift card is live waits for it. Each thread is asked about a given file once.
- **"yes":** a whole-message yes ("yes", "yep", "yes, up to date", "already updated") or a reply saying the file is current, from someone the card names or who posted in an asked thread, withdraws the card at once. The card is edited to say so, and nobody can ✅ it after that. A reply that asks for something ("yes please file it", "go ahead", "ship it"), a question back or a no leaves the card as it is. A bare yes in a thread that also holds a turn's card answers that card. When the card also drafts intakes for files the replying thread did not discuss, it stays, and the reply names the `drop N` that leaves the answered files out.
- **Terms:** the card's confirmers are the owners plus everyone who posted in the threads that discussed its files that morning. It expires after 72 h, with no re-ping.

## Commitment reminders

The same end-of-day read also looks for **commitments**: someone in a swept thread takes on a task themselves ("I'll share the Figma link by Thu", or "yep, will do" to a request). uno-bot nudges the person who promised if it looks undone. The code is `agents/uno-bot/src/commitments/`.

- **Detected** at the end-of-day run, from that night's new messages only. A hypothetical, a joke or a promise made for someone else is not a commitment, and only people's messages count, not uno-bot's.
- **Due** at the end of the day the promiser named (ET, Monday to Friday), or two working days after the promise when they named none.
- **Checked first:** at the first weekday morning run after it is due (10 am ET), uno-bot reads the thread since the promise, the promiser's later messages in the channel and the Notion or GitHub pages they linked. If those show it done, the commitment closes and nothing is posted.
- **Where:** a reply in the promise's own thread, mentioning only the promiser. It follows `pickDestination` like every proactive job, so it stays out of #uno-bot and mentions the promiser rather than the lead.
- **Answers,** from the promiser, as reactions on the reminder: 🙌 done, ⏳ soon (due again two working days out, at most twice), 🙅 not doing it, 🤔 not a promise. The answer replaces the legend in place and sends no new ping. Anyone else's reaction, and any other emoji (✅ included), changes nothing.
- **One follow-up:** a reminder nobody answers gets one more, "Still on your list?", two working days later. If that one also goes unanswered, the commitment lapses silently. Those two posts are the whole allowance: a ⏳ moves the date and adds no post, and every reminder posted stays answerable.
- **Learns from answers:** the detector is shown the three newest 🤔 and the three newest 🙌 commitments, as short summaries and at most one per person, so it misreads fewer messages as promises. They come only from public channels and the swept channel itself, so a DM's or another private channel's stay out. There is no fine-tuning and no prompt edit, and with no answers yet the prompt is unchanged.
- **Said again:** a new promise by the same person in the same thread ("sorry, will do by Fri") is the same task. It adds no reminder, and a later day it names moves the due date the way a ⏳ does.
- **Limits:** at most two reminders per person each morning; the rest wait for the next one. A commitment left unchecked or unposted three mornings running (an archived channel, a deleted thread) lapses.
- **"Remind me":** someone asks uno-bot directly, in its DM or in a thread where they mention it ("remind me Thu to review the PRD", "remind me in 2 days about this thread"). It is read in the turn, not by the sweep: `reminder_set` reads the time (a weekday, "tomorrow", "in N days", "next week", a date) and uno-bot confirms in one line, "Got it, Thu 10 am ET.", with no proposal card. A time that could mean two days ("next Thu") gets one question and sets nothing. It is a commitment of kind `self_reminder`, posted at the first weekday morning run on or after that day, in the same DM or thread, mentioning only the asker. There is no evidence check and no follow-up. The answers are 🙌 done and ⏳ snooze, which brings it back once, at the morning run two working days out. A DM's reminder goes back only to that DM, and none is set in #uno-bot. It counts toward the two a morning, and its answers stay out of the detector's examples.
- **Stored:** a `commitments` row in the usage database holds ids, times, the state and two counts. The short summary of what was promised stays in KV with an expiry, and message text and links stay out of the database (ADR-030).

## Card follow-ups

Three more follow-ups ride the commitments' schedule and limits: the same end-of-day detection, the 10 am ET weekday morning post, and one follow-up at most and then lapsed. They have a morning budget of their own, two a person: a person's own reminders (promises, "remind me") go first and keep their own two, so a card backlog leaves them on time. The code is `agents/uno-bot/src/follow-through/`.

- **F3, a card to-do with no card.** A thread or a running note says to create a Roadmap card ("Bill to create a card for the facelift last stage", "can someone make a card for this"). Two working days on, uno-bot searches the Roadmap by the to-do's words; a matching card closes it silently. Otherwise it asks "Want me to draft the card for …?", mentioning the assignee, or the note's takers when nobody was named. ✅ from the assignee or anyone who posted in the thread stages the drafted card (the PRD template, its own ✅ files it); 🙅 drops it. A message kept as a card to-do is passed over as a promise, so it gets one reminder, not two. Running notes reach it through the notes job, team notes only.
- **F4, an active card with no owner.** A card in WIP or Under Review with an empty Contributor and no edit for 7 days; a card waiting in Need PRD / Under Playground or Ready for Design is queued work, and is passed over. "Who's taking …?" mentions the card's creator. Only someone the question asked (the card's creator, or a person it mentioned) can name the owner: their reply naming exactly one person ("@Maya"), or their own "me", "mine" or "I'll take it", stages the Contributor change. The follow-up closes once the card shows a Contributor; a proposal nobody applies leaves it open for its follow-up. Cards uno-bot's own integration created are passed over.
- **F5, a stuck card.** An active card with a Contributor, unedited and uncommented for 3 weeks. "Still moving?" mentions the Contributors: 🙌 done, ⏳ still on it (checked again in 3 weeks), 🙅 drop. After 🙌 or 🙅 from an owner, uno-bot lists the card's live Design Status options in the thread, read from the Roadmap schema, Shipped and Under Dev first for 🙌 and Archived first for 🙅. The owner replies with a number or a name typed whole, and that stages the move on a ✅ card. The first other reply gets the options again, once, and stages nothing; after that, and after 72 h, replies are the thread's own. Only an owner's reply counts.
- **Where:** a thread's to-do is answered in that thread; a card or a note has none, so a Universal-pillar card goes to #plus-universal and anything else to #plus-design, at most two new card questions a channel each morning. Every follow-up is a Slack post outside #uno-bot, mentioning the owner; with no owner found in Slack, nothing is posted.
- **Replies:** the thread of an F4 question or an F5 options list carries a KV mark while it waits, so a short reply anywhere else costs no database read. A failed reply check hands the reply to the thread as usual.
- **Passed over:** a card with nobody to ask in Slack, or no channel, is marked in KV and looked at again a week on; a stale card with a recent comment, once that comment is three weeks old.
- **Evidence first:** each morning re-reads the card. A Contributor set, a status moved, an edit or a comment since closes it with no post.
- **One message a card a week:** a follow-up's follow-up waits five working days, and a card asked about in the past week is not asked about again.
- **Proposal cards** sit in the follow-up's thread for 72 h, in their own slot, confirmable by the people it names and whoever answered. Select values are exact-matched: a pillar only when the Roadmap offers it, a status refused rather than created.
- **Stored:** a `commitments` row of kind `card_todo`, `card_unowned` or `card_stale`, keyed to the card's page id. Titles and links stay in KV (ADR-030).

