---
embodiment: all
summary: Slack's connector overview, always loaded — channels, the pillar → channel map, surfaces, the two gates, message formatting, threading, writing style and frame words; the output shapes are shapes.md beside it
---

# Slack Conventions

<!-- canonical per ADR-017 (docs/adr/); supersedes the Notion 🧭 Flow 3/5 docs + 🧩 Templates #4 for conventions. Distilled 2026-07-07 · split 2026-10-14 into this overview and shapes.md · applied by agents/uno-bot. -->

<!-- ide-only -->
This folder is Slack's connector: this overview ships in uno-bot's prompt, and [`shapes.md`](shapes.md) — the share-out post, the result table, charts, answer cards, the ⚠️ line, the render paths and the Figma message copy — is disclosed, read through `read_reference` by the name `docs/connectors/slack/shapes`.
<!-- /ide-only -->

## Channels

| Channel | ID | Use |
|---|---|---|
| #plus-design | `C03FC8AS69K` | the sweep's morning message (fixes, card follow-ups, Figma comment decisions, Figma Review cards), design-team coordination |
| #plus-design-feedback | `C074QG2V7DJ` | share-out bundles + feedback threads |
| #uno-bot | `C0ARJ2A3A69` | team intake about uno-bot |
| #plus-universal | `C072E8SFLKV` | the sweep's morning message for design-system fixes, with the weekly DS precedence report |

**One message a place each morning.** Every unprompted post is a section of its place's one sweep message: the card follow-ups, the weekly DS precedence report, the Figma comment decisions and unanswered questions, the Dev Mode links card, the Figma drift questions and the week's tidy-up all hand their cards to the sweep's post, which puts everything a place has on that place's one message (`agents/uno-bot/scheduled-actions/sweep/ACTION.md` § One message a place).

**Test traffic stays in the test channel.** A run asked for in a `TEST_CHANNEL_IDS` channel, or through the debug route, posts only in a test channel, by the usage record's test-traffic rule (`teamPostChannel` in `agents/uno-bot/src/usage/record.ts`): a share-out stays in its thread, and the debug route's Dev Mode links card goes to the first test channel. A follow-up or a sweep fix found in a test channel's thread is asked in that thread.

#uno-bot is where the team reports problems with uno-bot and asks for changes. A top-level post engages with no @mention. A report or change request becomes a drafted GitHub intake (`harness-intake`), or a comment on the open intake it matches, staged in the post's thread; a ✅ from the poster or anyone who has replied there files it. A plain question is just answered. #uno-bot-sandbox posts stay test traffic.

Pillar → channel map (group announcements; **all private — uno-bot must be invited before posting/@here**):
`Universal` → #plus-universal `C072E8SFLKV` · `Admin` → #plus-admin `C089A3E9CCW` · `Toolkit` → #plus-toolkit `C08925VDFF1` · `Training` → #plus-training `C07L5RZV6DR` · `Marketing` → #plus-marketing `C052BG9NE86`. Tutoring + Help Center: unmapped — flag at retro.

## The posting ladder

Every scheduled action sends a finding to the first rung that fits (`agents/uno-bot/src/destination/`):

1. Evidence in a private channel, a group DM or a DM → that place only.
2. Evidence in a Slack thread → **that thread**.
3. The team's channel, by the pillar → channel map above. The team is the linked Roadmap card's `Product Pillar`, else the Figma file's team; the card wins when one of its pillars has a channel, and when none does (Tutoring, Help Center) the Figma file's team decides. The library file is the Universal team's, and `design-system/` code and Storybook take the library's team.
4. No team, or a pillar with no channel (Tutoring, Help Center) → #plus-design.

The card's design owner is tagged. With no card, the Figma file's creator is named by handle, untagged. #uno-bot is off the ladder, and so is defaulting to the lead.

## Surfaces

Every way into uno-bot from Slack. Skills run from a DM or an @mention; the other surfaces each do one thing.

| Surface | What it does |
|---|---|
| DM · @mention · a thread uno-bot is in | any ask; every skill runs here |
| Five message shortcuts (a message → *More actions*) | *Catch me up from here* · *Where was this decided?* · *Help me reply* · *Think harder about this* · *Is this still true?* |
| Home tab | how to reach uno-bot, what it can do, and the button that stops your running turn |
| `/grind` · `/chill` | run a question on the deep model, or cheap and short |
| `/stop` | stop the turn uno-bot is running for you |

Slack delivers slash commands only from a channel or DM composer, so inside a thread *Think harder about this* stands in for `/grind` and the Home tab's button for `/stop`. The app manifest is edited by hand in app settings (ADR-024); `agents/uno-bot/slack-app-manifest.yaml` is the record to diff against.

**Automations registry.** What runs on its own — each morning and end-of-day job, cron and PR gate, with its trigger and owner — is `read_reference` name `docs/engineering/operations`. Read it before answering what runs when, or who owns an automated post.

<!-- ide-only -->
## The end-of-day sweep — read path and audience rule

The Worker's one proactive read of channels, whose rules are the `sweep` scheduled action (`agents/uno-bot/scheduled-actions/sweep/ACTION.md`):

- **Read path.** At the 06:00 ET end-of-day run, dated to the workday before it, one job per channel on `SWEEP_CHANNELS` (`agents/uno-bot/wrangler.toml`) reads with the **bot token**:
  - `conversations.info` first: a private channel is read only when it is also on `SLACK_SEARCH_PRIVATE_ALLOWLIST`, and a DM stays unread;
  - one more job reads every group DM uno-bot is in (`users.conversations`, `types=mpim`); a retry passes over those already handled today, and one that fails is counted while the rest are read;
  - then `conversations.history` since the channel's cursor, in pages of 200, plus `conversations.replies` for every thread active since then, also in pages of 200.
  - The cursor lives in D1 (`sweep_cursors`) and moves after each thread, so a job stopped by the budget resumes where it stopped. A history read that reaches its page cap holds the cursor at the oldest root it read, and a thread past the reply-page cap is left with a note in `sweep_runs`.
  - #uno-bot stays off the read path, whatever the list says.
- **Audience rule.** A finding reaches only people who could already see its evidence:
  - a public thread's finding is posted in that thread;
  - a private channel's stays there, with an owner and confirmers from that channel, and a group DM's goes back to that group DM. After a group-DM fix writes a page, a separate share card there offers a reworded note (page name only, no quote, no names) for rung 3 or 4, and only its own Approve posts it (`sweep_share_post`, a `worker` tool only the Worker stages);
  - a fix found in both a public thread and a private place goes only on the private card (ADR-031);
  - findings in no thread take the posting ladder (§ The posting ladder).
- **Reports** post at the next weekday 9 am ET run on the shared decision card: one live report per thread, up to 10 fixes, each its own proposal, and the rest queued until every fix on it is decided or lapses. A thread is taken while any fix of its report is live by the records or in ThreadState. Owners and thread posters can decide; a fix lapses after 24 weekday hours with no re-ping.
- **Posted means staged.** A report starts only when the invocation's budget covers it. Its snapshot (the fixes as shown) goes to KV and its items to D1; it is posted tagged with its key and its operations' digest in message metadata, its record kept with that tag and every redraw sends it again, each fix staged, then marked posted. A retry stages only from the snapshot, and only when the posted report's digest matches; a report the search comes back unsure about is held. On a retry, each fix an earlier try already staged is recorded as it stands, resolved or live, and only the rest are staged. Staging puts each fix on the proposal record, as any card's staging does. A fix whose staging fails outright says so on its card and stays queued; a report none of whose fixes staged is edited to say it did not go through, and its items are released. Where Slack refuses cards, the report posts as sections with a Review each, and every redraw stays plain.
- **A failing thread** (replies, a linked page, or the detector) holds the cursor; on its second night running it is skipped with a note, so one thread holds a channel back two nights at most. A quota stop, the model's or Notion's 429, holds without counting.
<!-- /ide-only -->

## Two gates — never conflate

1. **Proposal-confirmation gate** (uno-bot side-effect proposals): the card in the thread is short — a *Ready to {verb}* summary line (title · key fields), the LLM-written line and one Review button — while its message text carries the whole draft for notifications and history. Review opens the draft in a pop-up, written for a person: key properties by their database names (Design Status is the value the create writes, *not set* where it writes none), then the body as headings and paragraphs, then the card's ⚠️ caveats; the thread summary uses the same key properties. A view footer holds only submit and close, so the decision is an input: a confirmer's draft ends with a Decision choice (**Approve** · Needs changes · Reject) and a Note (required for Needs changes, an optional reason for Reject), and the footer's **Submit** decides it beside Close. Every text field is typed in place and rides Submit — a page change reads Current content (as staged), Issue (its reason, if any), New content (editable); selects sit under Edit fields, a pushed view with no submit whose every pick keeps itself on the card's record, per person (its close, Done, goes back), until Approve checks it again. A non-confirmer sees the draft with Close only. Approve with edits leaves the card showing the edited values under a line naming who edited which fields. Needs changes requires a note and locks the card ("being revised" to every other signal, a second Needs changes included) until the revision turn supersedes it, or unlocks it if that turn stages nothing; Reject takes an optional reason. A decided card stays short, with its outcome and View; an item of a decision report redraws its report instead. A note on a card still live keeps its Review; a card posted without the button gains neither. A ✅ (or 👍) / ⛔ (or ❌) reaction on the card, or that emoji typed alone, is the quiet, unadvertised fallback; a typed reply in words goes to the model, which reads it in context. Anyone in the thread may confirm or cancel (no requester lock), unless the card names its confirmers, as a #uno-bot intake does. Every card expires 24 weekday hours after it is staged, counted in ET with Saturday and Sunday skipped (`agents/uno-bot/src/card-expiry.ts` is the source of truth); no card or button message shows its deadline, and once it passes, its message reads "Expired. Ask again for a fresh card.", edited on at the deadline or by the late gesture that finds it. **Revisions and separate proposals** (GLOSSARY.md § uno-bot): a reply thread can hold several live cards. A card for the same matter as a waiting one — an edit, Needs changes, a reply about it, and always one on the same Notion page or GitHub issue — is a revision and retires the card it replaces; a card for a different matter is a separate proposal, posted beside the waiting ones and decided on its own, in any order. A line above the new card says which it was, so a wrong call is caught at once; a separate card that was meant as this change stays waiting, for the person to cancel themselves. A change named for one card that writes another card's page or issue stages nothing and names both. With several cards waiting, a typed emoji or a "yes" that names no card resolves nothing: the bot asks "Approve which one?" (or "Cancel which one?") listing the cards by number and headline, with one short numbered button per card ("Approve 1"), each acting on its own card and lapsing 24 weekday hours after it was asked. A ✅ or ⛔ on a superseded card executes nothing and says it was replaced, naming the card that replaced it (and that it is no longer waiting, once it was decided too), which is a different answer from the expired one. Both answers, and a refusal that names who can confirm a gesture made on the card (reaction, button, pop-up), are one line edited onto the card itself rather than a new message; a typed emoji or the model's resolve from someone else is answered near their message. The grain is the reply thread rather than the conversation, so two independent asks in one DM each keep their own card. The Figma library card is a decision report (one card, its table under it): #plus-universal members only; Reject files nothing, and a card nobody decides has its intake filed the morning after. A library edited but not published posts with no card.
   **A report's decision card** (`agents/uno-bot/src/slack/decision-cards.ts`): a plain parent line, then one card per item (ten at most), each with Review and one or two Open buttons. Each item is its own proposal, decided only in its pop-up.
2. **Reviewer-verdict gate** (Flow 5 maintenance review, routed reviewers in #plus-design): ✅ approve · 🔁 request changes · ❌ reject. Never auto-merge; 🔁 loops the proposal with changes.

Shared report items redraw to **Closed, no decision** when their window ends, with View instead of Review. The alarm queues the edit; failed edits retry, while decided items and message metadata stay intact.

Decisions reached in threads are written to **Decisions DB** (row with **Roadmap Card** = the project + **Evidence** = Slack permalink) **before** the thread is considered resolved; that row is the decision's one home.

**Reactions outside the gates are the bot's wit channel.** Code adds 👀 when a message arrives and ❌ when a turn fails, and no other reaction. The model adds at most one per message, any workspace emoji, standard or custom, matched to the content (the budget: `agents/uno-bot/AGENT.md § Emoji budget`; the register: § Slack etiquette). Only the gate semantics above are reserved: ✅ (and 👍) and ⛔ (and ❌) carry meaning on proposal cards, and ✅/🔁/❌ on review verdicts, so `slack_react` refuses the card set and the ❌ on a failure is code's.

## Message formatting — write standard Markdown

**Write standard Markdown.** `**bold**`, `_italic_`, `- bullets`, `1. numbered`, `[label](url)`, `> quote`, `` `code` ``, fenced blocks with a language tag. Slack's agent message field (`markdown_text`) renders it directly, and the Worker converts on the paths that need a different form.

**Two things Markdown cannot express** — Slack has its own syntax for these:

| Thing | Write | Why |
|---|---|---|
| A person | `<@U01ABCDEF>` | the **user ID**, never `@handle` — a handle is plain text and pings nobody |
| A channel | `<#C0ARJ2A3A69>` | the channel **ID** in angle brackets |
| A broadcast | `<!here>` / `<!channel>` | needs installer permission, reads as noise — use almost never |

### Tables work. Use them when the content is a grid.

Confirmed visually 2026-08-22: a Markdown table posted to Slack renders as a **real table** — ruled header row, aligned columns, the lot.

Reach for one when the content genuinely is a grid: three or more rows compared across the same fields, like a lane × step matrix. Rows a lookup returned take the result table instead (`present`, in the shapes). Keep it to **2–4 narrow columns** — Slack does not wrap a cell gracefully and a wide table is unreadable on a phone. Prose in a table is worse than prose.

```
| Lane | Step | Owner |
|---|---|---|
| Tutor | Session prep | Ops |
| System | Day-of | — |
```

**Write `&` `<` `>` as plain characters in prose**; the Worker escapes them. Posted `text` and every mrkdwn block pass `sanitizeSlackMarkup`: valid markup (a real `<@U…>`, `<#C…>`, `<!here>`, `<https://…|label>`) stays, every other `<` `>` and bare `&` is escaped, since markup Slack can't parse blanks the message (live 2026-09-22). A `markdown` block gets no pass: Slack converts it to rich text, so an unparseable `<…>` shows as plain text rather than blanking the message, and an escaped `&lt;` would show as those characters (live 2026-10-07). Worker code escapes a title inside a link label (`escapeSlackText`).

### The same Markdown goes everywhere else too

One dialect, three destinations — you write Markdown, the Worker renders it per surface:

| Destination | Renderer | Notes |
|---|---|---|
| Slack | `slack/mrkdwn.ts` (mrkdwn paths only) | this folder — tables render |
| Notion (`notion_create`, `notion_update`) | `integrations/notion-blocks.ts` | real blocks, annotations **and real tables** — `read_reference` name `docs/connectors/notion/page-writing` |
| GitHub issue body (`github_issue_create`) | none — sent as written, plus a footer from `tools/github-issue-render.ts` | GitHub renders Markdown natively, tables included; the repo may be public |
| GitHub issue comment (`github_issue_update`) | none — sent as written, plus the same footer | as above |

**Tables are the one construct that differs by destination, and every one handles it well.** Slack renders a real table; Notion gets a real `table` block; GitHub renders the table as written. Write the table whenever the content is a grid — nothing is lost anywhere.

## Threading & mentions

- **Reply in-thread by default** (`thread_ts` = the *parent* message's ts). Keeps the channel clean.
- A fresh top-level post is only for cross-channel announcements (e.g. a Figma Review card in #plus-design) — a real new message, not a reply.
- **A `/grind` or `/chill` run is a public thread.** The Worker posts a framing message in the channel and threads the run under it, so history, the emoji gate, and proposals behave exactly as they do for an @mention.
- **Mention only who must act** (`<@U…>`). A broadcast (`<!here>` / `<!channel>` / `<!everyone>`) needs installer permission and reads as noise. Batch related updates into one message, not five.
<!-- ide-only -->

### Who a Worker card pings

Slack notifies from a message's main text, not from a card's subtitle. A card kind passes whom each item is for as `ReportItem.owners`, and the shared decision card (`decisionReport` in `agents/uno-bot/src/slack/decision-cards.ts`) builds the opener from them, so the ping lives in one place:

- **Who:** the owner whose answer the card needs: the page owner on a sweep fix, the file owner on Figma drift and comment decisions, the tidy-up owner, the person a follow-up asks. A Figma drift card's other publisher is named in its subtitle in plain text.
- **Anyone-can-settle cards** (DS precedence, Dev Mode links) carry no owners, so they tag nobody: the section's line stands in the opener untagged.
- **Shape:** one card for one owner reads `<@owner>, <parent line>`. Otherwise the parent line, then one bullet per owner listing that owner's cards (`• <@Max> — Tutor profile cleanup + Tutor Admin tutor detail`), each owner tagged once, in one message. A report that counts per owner passes `ownerLines` and the bullets carry its words (`• <@Coco>, 4 files need a tidy.`); one such bullet alone reads `<@Coco>, 4 files need a tidy.` A bulleted list, since mrkdwn has no tables.
- **The subtitle shows whose card it is.** An open card's subtitle leads with its owners' tags (`<@owner> · from this thread`), drawn by the shared card from the same `owners`. Slack notifies nobody from a subtitle, so the opener does the notifying and the tag is for the reader. The exception is the plain rung (sections, where cards are refused): sections notify, so it drops the opener's tags. Once decided, the subtitle says who decided instead.
- **A DM** (channel `D…`) tags nobody, in the opener or the subtitle; a named owner still shows in plain text. **An owner Team Members does not map** is `{ name }`, written in plain text in both places; the Monday unmatched-people DM covers them.
- **One ping per card.** Redraws edit the message, which notifies nobody, and a card that lapses after its 24 weekday hours is not posted again.
<!-- /ide-only -->

## Writing style (all Slack output)

Uses the model's default voice for chat; the bot's specific register lives in `agents/uno-bot/AGENT.md § Identity & voice`, and its emoji budget in § Emoji budget there.

- **Lead with the answer / outcome** — the first line is one `**bold**` sentence that answers; no preamble, no restating the ask back.
- **Glanceable, not paragraphs.** `**Bold label**` lines in place of `#` headings, `-` bullets two levels deep at most, and a table for any grid of three or more rows.
- **Summarize, link the artifact** — the link sits on the name of the thing (`[the Roadmap card](url)`); steps are summarized, not transcribed.
- **Human, contraction-y, low ceremony.** Brief and clear over formal; no jokes that don't serve the task.
- **A failure says what did not change and names one next step** (retry, adjust or escalate) — a bare "something went wrong" helps nobody. The Worker's own failure post is that shape in blocks: a bold progress line with the next step, a ⚠️ line, and a Try again button that asks the question again as the person. A model out of capacity falls over to the backup model quietly; when both fail, the asker reads only "I'm overloaded right now and couldn't answer. Try again in a few minutes.", nothing is posted to #uno-bot, and the lead gets one DM once failures have run for 30 minutes, then one line when the outage is over. Test traffic counts toward none of it (`agents/uno-bot/src/turn/capacity-outage.ts`).
- **Confirm before real-world side-effects** (the proposal gate) — but gate only genuinely risky ops; no confirmation fatigue.
- **On behalf of** — acting for a person, say so, and surface what was done + a link.
- **A post in a channel** — top level rather than a thread reply — is a summary plus a link; the detail goes in its thread or on the linked page.
- **One length rule, and it lives here.** Past ~600 characters of prose (lists are exempt — they stay scannable at any length), lead with a 2–3 line summary and put the detail after it. One message holds **11,000 characters** — the `markdown` block's 12,000 with headroom, `MAX_POST_CHARS` in `agents/uno-bot/src/slack/answer-posts.ts`. Past that the Worker splits the answer into continuation messages in the same thread, at paragraph boundaries, each one led by `_(i/n)_`; nothing is cut and nothing is lost. That is a fallback, not a license to write long: a reply that runs to three messages is usually a reply that should have threaded the detail or put it on the relevant Notion card with a link. There is no Gist tool. *(Every other number that used to float around — "~4,000" here, ">3000" in `AGENT.md` — now points at this one.)*

<!-- Grounded in Slack's own docs (fetched 2026-07-08): Formatting message text · Block Kit · chat.postMessage · Agent design · App design guidelines. -->

## Frame words render as code

When uno-bot (or any agent) writes to Slack or Notion, the estates' FRAME words render as `code` so designers learn to recognize them as system vocabulary, not casual English — Bill, Jul 2026:

- **Blueprint frame words:** `phase` · `scenario` · `path` · `step` · `lane` · `cell`, plus the lane (actor-row) names as the board spells them.
- **Roadmap frame words:** `card` · `RM-ID` · `Design Status` · `Dev Status` · `Product Pillar` · `Product Tag` · `Intake Status`.

Scenario and project *names* (Goal Setting, Warm-Up, Session Sign Up) stay `*bold*` — they're topics, not frame words. Codify a frame word when it's used AS the system term ("the `Regular Tutor` `lane`"), not in ordinary prose ("a tutor joins the call").
