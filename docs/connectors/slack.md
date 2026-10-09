---
embodiment: all
summary: Pillar → channel map (group announcements; all private — uno-bot must be invited before posting/@here): Universal → #plus-universal C072E8SFLKV · Admin → #plus-admin C089A3E9CCW ·
---

# Slack Conventions

<!-- canonical per ADR-017 (docs/adr/); supersedes the Notion 🧭 Flow 3/5 docs + 🧩 Templates #4 for conventions. Distilled 2026-07-07 · applied by agents/uno-bot. -->

## Channels

| Channel | ID | Use |
|---|---|---|
| #plus-design | `C03FC8AS69K` | review requests, design-team coordination |
| #plus-design-feedback | `C074QG2V7DJ` | share-out bundles + feedback threads |
| #uno-bot | `C0ARJ2A3A69` | team intake about uno-bot |
| #plus-universal | `C072E8SFLKV` | Figma library publish cards |

#uno-bot is where the team reports problems with uno-bot and asks for changes. A top-level post engages with no @mention. A report or change request becomes a drafted GitHub intake (`harness-intake`), or a comment on the open intake it matches, staged in the post's thread; a ✅ from the poster or anyone who has replied there files it. A plain question is just answered. #uno-bot-sandbox posts stay test traffic.

Pillar → channel map (group announcements; **all private — uno-bot must be invited before posting/@here**):
`Universal` → #plus-universal `C072E8SFLKV` · `Admin` → #plus-admin `C089A3E9CCW` · `Toolkit` → #plus-toolkit `C08925VDFF1` · `Training` → #plus-training `C07L5RZV6DR` · `Marketing` → #plus-marketing `C052BG9NE86`. Tutoring + Help Center: unmapped — flag at retro.

<!-- ide-only -->
## The end-of-day sweep — read path and audience rule

The Worker's one proactive read of channels, whose rules the bot reads through `read_reference` (`docs/connectors/slack-sweep.md`):

- **Read path.** At the 00:00 ET end-of-day run, dated to the workday that just ended, one job per channel on `SWEEP_CHANNELS` (`agents/uno-bot/wrangler.toml`) reads with the **bot token**:
  - `conversations.info` first: a private channel is read only when it is also on `SLACK_SEARCH_PRIVATE_ALLOWLIST`, and a DM stays unread;
  - one more job reads every group DM uno-bot is in (`users.conversations`, `types=mpim`); a retry passes over those already handled today, and one that fails is counted while the rest are read;
  - then `conversations.history` since the channel's cursor, in pages of 200, plus `conversations.replies` for every thread active since then, also in pages of 200.
  - The cursor lives in D1 (`sweep_cursors`) and moves after each thread, so a job stopped by the budget resumes where it stopped. A history read that reaches its page cap holds the cursor at the oldest root it read, and a thread past the reply-page cap is left with a note in `sweep_runs`.
  - #uno-bot stays off the read path, whatever the list says.
- **Audience rule.** A finding reaches only people who could already see its evidence:
  - a public thread's finding is posted in that thread;
  - a private channel's stays there, with an owner and confirmers from that channel, and a group DM's goes back to that group DM. After a group-DM fix writes a page, a separate share card there offers a reworded note (page name only, no quote, no names) for rung 3 or 4, and only its own ✅ posts it (`sweep_share_post`, a `worker` tool only the Worker stages);
  - a fix found in both a public thread and a private place goes only on the private card (ADR-031);
  - findings in no thread go to #plus-universal for the design system and to #plus-design otherwise (`pickDestination` in `agents/uno-bot/src/sweep/finding.ts`).
  - Proactive output stays out of #uno-bot, and the owner it mentions comes from the thread or the card, not a default to the lead.
- **Cards** post at the next weekday 9 am ET run: one live card per thread, up to 10 fixes, and the rest queued until it resolves. A thread is taken while its card is live by the records or in ThreadState, a revision or re-staged card included. Owners and thread posters can confirm; a card lapses after 72 h with no re-ping.
- **Posted means staged.** A card starts only when the invocation's budget covers it. Its snapshot (the fixes as shown) goes to KV and its items to D1; it is posted tagged with its key and its operations' digest in message metadata, staged, then marked posted. A retry stages only from the snapshot, and only when the posted card's digest matches; a card the search comes back unsure about is held, and a card the earlier try already staged is recorded as posted and left as it is, resolved or live. Staging puts the card on the proposal record, as any card's staging does. A staging that fails outright edits the card to say it did not go through and releases its items.
- **A failing thread** (replies, a linked page, or the detector) holds the cursor; on its second night running it is skipped with a note, so one thread holds a channel back two nights at most. A quota stop, the model's or Notion's 429, holds without counting.
<!-- /ide-only -->

## Share-out post

The Flow 3 feedback rail. Bundle completeness is loudly audited — on uno-bot the card flags any gap before ✅ posts. *(revised 2026-07-16; tool brought into line 2026-08-22)*

```
📣 *[Project]* — [artifact] · fidelity: [low/mid/high] · round N
*What this is:* 1–2 sentences.
*What changed since last round:* … (round 2+)
🎯 *Feedback wanted on:*
  1. …
  2. …            (max 3, stage-specific — never "thoughts?")
*Not looking for feedback on:* [out of scope this round]
🔗 [link]
cc @reviewers
Shared by @requester. Comments in-thread by *[date]*.
```

**This is what `shareout_post` posts**, field for field — `project`, `artifact`, `fidelity`, `round`, `summary`, `what_changed`, `feedback_wanted` (a list), `not_looking_for`, `link`, `reviewers`, `deadline`. Every line below the header is optional and omitted when empty, so a thin share-out still posts rather than being blocked. `tests/share-out.test.ts` pins the doc and the renderer together — it reads this file and fails if a field named here has no home in the tool schema.

Until 2026-08-22 the tool had no fields for fidelity, round, what-changed, the questions or the out-of-scope line — it posted four fixed lines from `summary`/`link`/`reviewers`/`deadline`, so this template was reachable only if the model crammed everything into `summary`, and the header could never match. The doc won the disagreement because each field changes what a reviewer does.

Bundle links (Loom · live preview · Figma replica · Decisions DB) go in `link` and the surrounding thread; the confirmation card audits them and names anything missing before ✅.

## Two gates — never conflate

1. **Proposal-confirmation gate** (uno-bot side-effect proposals): the card in the thread is short — a ⚠️ *Ready to {verb}* summary line (title · key fields), the body's size, the LLM-written line and one Review button — while its message text carries the whole draft for notifications and history. Review opens the draft in a pop-up, written for a person: key properties by their database names (Design Status is the value the create writes, *not set* where it writes none), then the body as headings and paragraphs, then the card's ⚠️ caveats; the thread summary uses the same key properties. A view footer holds only submit and close, so the decision is an input: a confirmer's draft ends with a Decision choice (**Approve** · Needs changes · Reject) and a Note (required for Needs changes, an optional reason for Reject), and the footer's **Submit** decides it beside Close. Edit fields sits at the top and pushes a view of its own (`views.push`) with the fields (Save edits, which keeps the edits on the draft's `private_metadata`; Approve checks them again against the live card and options). A non-confirmer sees the draft with Close only. Approve with edits leaves the card showing the edited values under a ✏️ line naming who edited which fields. Needs changes requires a note and locks the card ("being revised" to every other signal, a second Needs changes included) until the revision turn supersedes it, or unlocks it if that turn stages nothing; Reject takes an optional reason. A decided card stays short, with its outcome and View; a card posted with blocks of its own (a sweep card's carousel, the Figma library card's release card and table) keeps them under that line. A note on a card still live keeps its Review; a card posted without the button gains neither. A ✅ (or 👍) / ⛔ (or ❌) reaction on the card, or that emoji typed alone, is the quiet, unadvertised fallback; a typed reply in words goes to the model, which reads it in context. Anyone in the thread may confirm or cancel (the requester lock was removed 2026-07-14), unless the card names its confirmers, as a #uno-bot intake does. 60-min expiry (`PROPOSAL_TTL_MS` in `agents/uno-bot/src/thread-state/store.ts` is the source of truth). **One live card per reply thread:** staging a revised card retires the one it replaces — a ✅ or ⛔ on the superseded card executes nothing and says it was replaced, which is a different answer from the expired one. Both answers, and a refusal that names who can confirm a gesture made on the card (reaction, button, pop-up), are one line edited onto the card itself rather than a new message; a typed emoji or the model's resolve from someone else is answered near their message. The grain is the reply thread rather than the conversation, so two independent asks in one DM each keep their own card. The Figma library card: 72 hours, #plus-universal members only, and its ⛔ still files the intake — as does a card nobody decides. A library edited but not published posts with no card.
2. **Reviewer-verdict gate** (Flow 5 maintenance review, routed reviewers in #plus-design): ✅ approve · 🔁 request changes · ❌ reject. Never auto-merge; 🔁 loops the proposal with changes.

Decisions reached in threads are written to **Decisions DB** (row with **Roadmap Card** = the project + **Evidence** = Slack permalink) **before** the thread is considered resolved. Do not append to obsolete Decision Log subpages.

**Reactions outside the gates are the bot's wit channel.** Code adds 👀 when a message arrives and ❌ when a turn fails, and no other reaction. The model adds at most one per message, any workspace emoji, standard or custom, matched to the content (the budget: `agents/uno-bot/AGENT.md § Emoji budget`; the register: § Slack etiquette). Only the gate semantics above are reserved: ✅ (and 👍) and ⛔ (and ❌) carry meaning on proposal cards, and ✅/🔁/❌ on review verdicts, so `slack_react` refuses the card set and the ❌ on a failure is code's.

## Message formatting — write standard Markdown

**Write standard Markdown.** `**bold**`, `_italic_`, `- bullets`, `1. numbered`, `[label](url)`, `> quote`, `` `code` ``, fenced blocks with a language tag. Slack's agent message field (`markdown_text`) renders it directly, and the Worker converts on the paths that need a different form. *(Rule changed 2026-08-22 — see the note at the end of this section.)*

**Two things Markdown cannot express** — Slack has its own syntax for these:

| Thing | Write | Why |
|---|---|---|
| A person | `<@U01ABCDEF>` | the **user ID**, never `@handle` — a handle is plain text and pings nobody |
| A channel | `<#C0ARJ2A3A69>` | the channel **ID** in angle brackets |
| A broadcast | `<!here>` / `<!channel>` | needs installer permission, reads as noise — use almost never |

### Tables work. Use them when the content is a grid.

Confirmed visually 2026-08-22: a Markdown table posted to Slack renders as a **real table** — ruled header row, aligned columns, the lot.

Reach for one when the content genuinely is a grid: three or more rows compared across the same fields, like a lane × step matrix. Roadmap cards have their own table, below. Keep it to **2–4 narrow columns** — Slack does not wrap a cell gracefully and a wide table is unreadable on a phone. Prose in a table is worse than prose.

```
| Lane | Step | Owner |
|---|---|---|
| Tutor | Session prep | Ops |
| System | Day-of | — |
```

**A table renders as a table on every answer path**: the streamed part goes out as `markdown_text`, and every posted part (channel answers, continuation parts, every answer while streaming is off) as a `markdown` block. The one rung where a table degrades is the `section` fallback, reached only when Slack refuses the `markdown` block: a `section` cannot hold a table, so each row becomes `• a — b — c` and the header row is dropped. A refusal is logged, so a degraded table is a line in the tail.

*(This section read "No tables. Ever." for about an hour on 2026-08-22. That was a bad inference: a probe message's **stored text** contained no table, so the table looked deleted. It was not — Slack keeps it as a block and only the plain-text fallback omits it. Corrected by looking at the rendered message. The lesson: **a Slack message's stored text is not what a reader sees** — verify rendering by looking at it.)*

#### Lookup rows: the result table

**Rows a lookup returned go in the result table, not a Markdown table.** Code builds a Slack `data_table` from the rows that lookup returned this turn, so every cell is a real value and every link works. The model only chooses: for Roadmap cards it sets `as_table` on `roadmap_query` (the Roadmap preset); for any other lookup it calls `present` with the lookup, up to 4 of its rows' fields and a one-line takeaway. The persona asks for a table at 2 or more rows, the threshold code builds one at (`MIN_ROWS`); one row stays in the prose.

- **When it appears:** the request named a lookup this turn made, and that lookup returned 2 or more rows. The Roadmap preset takes only *definite* cards: an enumeration's (Design Status and/or person), or a title search's `contains` hits; did-you-mean guesses stay in the prose. One table per answer: the last request of the turn that produced one.
- **Refusals:** a lookup missing from this turn, a field absent from the rows, long text (over 120 characters or multi-line), a list, a bare link, or more than 4 columns. The refusal is the `present` call's own result, worded for the model, which then writes the plain list.
- **What it holds:** the Roadmap preset shows the card title linked to its Notion card, card number, Design Status and Dev Status. Any other table shows the chosen fields under headers made from their names (`design_status` → Design Status); the first column links to each row's `url` when it has one. A field that is numbers throughout posts as `raw_number` cells, so Slack sorts it as numbers. `data_table` has no alignment setting (`column_settings` is refused), so alignment is Slack's own. At most 30 rows, all on one page.
- **Caption:** written by code: the count, the lookup's filters and whether the list is partial (`13 cards · Design Status WIP`, `first 30 of 57 · "onboarding" · phase Onboarding`, or `at least 12 …` on a partial read with no larger count).
- **Prose:** the model's result says `table_attached`. With a table, the answer leads with the takeaway, gives what stands out and what to act on, names at most 3 rows, and points at the table in one short phrase. Without one, it writes the plain list.
- **Text copy:** the prose, then a plain line per row, written by code from the table's rows. Notifications, screen readers, the stored history and later turns read this copy, so it is the answer of record.
- **Rows typed twice:** with a table attached, the Worker removes each line of the prose that is only a row of it (the row's identifying field, its other values, the column headers' words, a bullet or link), so every row prints once. A Roadmap card counts as typed out only when the line names its number too. A sentence that names a row stays. The count removed is logged as `[result-table]`.
- **Placement and fallback:** the table sits after the `markdown` block and before the footer, on the last part of a split answer, and an answer carrying one always posts as an ordinary message. If Slack refuses the blocks, the answer goes out again without the table, its plain list appended to the Markdown, and then the usual rungs below apply. The step down is logged.
- **Worker posts:** two fixed messages are result tables too, under a head line, falling back to their plain list when Slack refuses the table. A **batch result** (two or more operations) has a Where, What and Result row per operation: Result reads `done` or `failed: <reason>`, Where links the target and What links the item the operation created. A batch of more than 30 operations posts the list alone, and one operation posts no table. The **weekly precedence list** has the drop number in the first column, so `drop N` names the row a reader sees. The table holds up to 30 items in one message, and any items past 30 go in the thread under their own numbers.

#### Numbers that compare or trend: charts

**A count or sum per group is a chart, computed by code.** The model calls `present` with shape `chart`, the lookup, the kind (`bar` to compare, `line` or `area` for a trend, `pie` for parts of a whole), `group_by`, and `measure` to sum a numeric field instead of counting rows. Code groups that lookup's rows and posts a Slack `data_visualization` block; the result hands the model the same `values` and `total`, so every number about the chart is grounded like a fetched one.

- **Across lookups:** a count that takes one lookup per group — cards per Design Status is one `roadmap_query` per status — names `across` (the argument the calls differ by) in place of `group_by`; asking with both is refused. Each call made with that argument is one point, valued at the whole count the call reported (`matched`, so a status listing its first 30 of 41 is 41) and named by its cards' own status, or by the filter when it returned none; two calls for the same status, in any case, are one point. Calls whose other filters differ (a person on some, none on others) count different things, so the chart is refused; a call made without the argument is passed over. A call with no whole count, or one that read only part of its source, refuses it too. A refusal posts its reason as a ⚠️ line and no table, since there is no one list of rows to fall back to. Once drawn, the Worker reads the board's Design Status options and names any no lookup counted in a ⚠️ line (`⚠️ Not counted: Under Dev and Archived were not looked up, so the chart leaves them out.`), and a card table one of the counted lookups attached with `as_table` gives way to the chart.
- **Limits:** at least 3 points; at most 20 (12 for a pie); at most 2 charts per message, the cap Slack enforces live. Labels and the series name are cut to 20 characters and the title (code's: `Cards by Design Status`) to 50. A bar or pie runs largest first; a line or area runs in label order.
- **Ungroundable → table (`group_by`):** a partial list (the first 30 of 41 would understate every bar), fewer than 3 groups, a group field the rows lack, a measure that is not a number on every row, or labels that collide once cut. The rows post as a result table instead, and the reason rides as a ⚠️ line (below): `⚠️ Not charted: only 2 groups to compare.` A lookup missing from this turn gets the refusal alone.
- **Text copy:** each chart adds a line of its top 5 values (`Cards by Design Status: WIP 3 · Under Review 2 · Shipped 1`), and a ⚠️ line adds its sentence, so a notification carries the gist.
- **Placement and fallback:** charts sit after the `markdown` block, before any table, ⚠️ line, Sources box and footer, and the answer posts as an ordinary message. If Slack refuses the blocks, the answer goes out again without charts or table, their text in the Markdown.

#### Sources box and link previews

**Code lists the links an answer read; the prose ends on its last point.** Every link the turn's lookups read, as their task cards carry it, is gathered once in the order read, and the ones a thread may see (`slack/card-sources.ts`) fold into a closed `container` titled `Sources (n)` beneath the answer, after any table. At most 10; fewer than 3 make no box, and those links sit on names in the prose. The title is the count alone. The links also ride the text copy as one `Sources:` line, and a refused box steps down to the answer with that line in its Markdown. Every answer post sets `unfurl_links` and `unfurl_media` to false.

#### Linkable items: answer cards

**Items the reader will open go in cards.** The model calls `present` with `shape: "cards"`, the lookup, its title field and optionally a subtitle field; code builds every card from that lookup's rows (`turn/answer-cards.ts`, block in `slack/answer-cards-block.ts`).

- **Shape:** one item posts as a `card` block, 2 to 10 as a `carousel`; more are cut to the first 10 and the model is told the total. One set of cards per answer. No hero images.
- **Links:** a row's `url` is the first button, "Open"; its other http(s) fields follow, labelled by field name, up to Slack's 3. A row with no link is left out; a list with none is refused, and the model names the items in prose.
- **Logos:** a card's icon is the logo of the estate its first link leads to (`estateOfUrl`), as a PNG image Slack fetches by URL; an SVG image does not render. PLUS, uno-blueprint, GitHub and Slack are served from `public/uno-bot/logos/` on plus-uno.netlify.app; Storybook, our own design system, carries the PLUS mark; Figma and Notion use Google's favicon service for their domain. A link on no estate's host carries the PLUS mark. Task cards keep Slack's named icons, since Slack refuses images there.
- **Placement and fallback:** as the table's: after the `markdown` block, before the footer, always as an ordinary message. If Slack refuses the blocks, the answer goes out again without them, each card a linked Markdown line in the prose. The text copy carries the same lines.

#### The ⚠️ line: what the reader has to see

**A caution goes on its own line under the answer, apart from the prose.** Each ⚠️ line is a `context` block after any charts, table and cards, before the Sources box and footer: one sentence, at most two lines per answer. Slack's `alert` block is not used, because Slack refuses it in a message.

- **Code adds it** from what the turn already knows, one line per trigger however often it fires: a lookup reported `truncated` or `partial`; a source errored, timed out or refused access (an argument the tool refused is not a source failure, and a retry that came back whole clears it); the lookup budget refused a lookup, cut one short, or ended the loop in a synthesis pass; blueprint rows whose newest `updatedAt` is older than 180 days; the absence pre-check fired; a chart fell back to a table (`Not charted: …`, withdrawn when a table asked for in its own right replaces it). The turn has no wall-clock budget, so the call budget is the only budget line.
- **The model adds one, for an estate conflict:** two sources it read this turn disagree (the blueprint says one thing, a Roadmap card or PRD another). It calls `present` with shape `conflict` and the disagreement as one sentence in `line`; code places the ⚠️. Refused, in the call's own result: fewer than two sources answered this turn, more than one sentence, an emoji, over 240 characters, a second conflict, or two lines already held. A ⚠️ the model typed at the start of `line` is dropped.
- **Order and cap:** lines keep the order their triggers were first met; a third is dropped.
- **Text copy:** each line, sign first, after the prose and any chart, table or card lists, so notifications carry it. An answer with a ⚠️ line posts as an ordinary message rather than a stream, which has no text copy. A refused ⚠️ block steps down to its sentence in the Markdown, like any other block beneath the answer.

### What the Worker does on each path

| Path | What is sent | Converted by |
|---|---|---|
| Streamed first part (streaming on, in a thread) | `markdown_text` — your Markdown, with only the markup pass below | `sanitizeStreamChunk` in `appendStream` / `stopStream` |
| Posted part (channel answers, continuation parts, streaming off, a stream that failed) | one `markdown` block — your Markdown as written — plus the footer `context` block on the last part | none — Slack turns it into rich text itself, and shows an escaped `&lt;` as written |
| Fallback rung 1 (Slack refused the `markdown` block for its blocks: `invalid_blocks`, `invalid_blocks_format`, or `invalid_arguments` pointing into `/blocks`) | `section` blocks, which are mrkdwn-only, plus the footer | `toSlackMrkdwn` in `textSections` |
| Fallback rung 2 (Slack refused the sections too, or refused the first post for anything other than its blocks) | bare `text`, no footer | `toSlackMrkdwn` in `postMessage` |
| `chat.postMessage` `text`, every rung | the whole part as mrkdwn, for notifications and screen readers | `toSlackMrkdwn` in `postMessage` |
| Proposal card, Figma library posts | a turn's card: a summary section, two context lines and Review (`proposalCardBlocks`); a stated card: mrkdwn sections + Review | `toSlackMrkdwn` via `textSections` |

Conversion covers `**bold**` → `*bold*`, `- item` → `• item`, `## Heading` → `*Heading*`, `[label](url)` → `<url|label>`, tables → `•` lines, and strips the fence language tag (mrkdwn code blocks take no info string).

**Don't hand-escape `&` `<` `>` in prose.** Posted `text` and every mrkdwn block pass `sanitizeSlackMarkup`: valid markup (a real `<@U…>`, `<#C…>`, `<!here>`, `<https://…|label>`) stays, every other `<` `>` and bare `&` is escaped, since markup Slack can't parse blanks the message (live 2026-09-22). A `markdown` block gets no pass: Slack converts it to rich text, so an unparseable `<…>` shows as plain text rather than blanking the message, and an escaped `&lt;` would show as those characters (live 2026-10-07). Worker code escapes a title inside a link label (`escapeSlackText`).

#### Streamed text

**The stream takes the same rule**, across append boundaries: `<@team` ending one append and `mate>` starting the next are one token, so an unclosed `<…` is held until the next append or the close (`sanitizeStreamChunk`). Slack documents `markdown_text` only as "message text formatted in markdown", not whether it parses or blanks on `<…>`; until seen, the proven rule stands.

**Streaming stays off until a live probe passes.** Either flag is refused unless `SLACK_STREAM_MARKUP_PROBE` records `pass:YYYY-MM-DD`: stream a body with a bare `<@teammate>` and one in a code fence to a test DM, raw, via `/debug/slack-stream?…&text=`, and check it isn't blank. Note too whether the fence shows `&lt;` and whether a real `<@U…>` pings.

#### Task cards

**A task card's icon is a named Slack icon, and nothing else.** The shape is `icon: {type: "icon", name}` with one of Slack's built-in names, on the `task_update` chunk and on a static plan's `task_card` alike. Production took `globe`, `book`, `map`, `code`, `comment`, `folder`, `cube` and `image` on 2026-10-07, and refused with `invalid_arguments` (`failed to match exactly one allowed schema [json-pointer:/chunks/0]`) an image URL as `name`, a `url`, an `image` element, an emoji and an unknown name; `call`, `email`, `file`, `link` and `user` fail the validator too. Each card shows its estate's glyph — Notion `book`, blueprint `map`, GitHub `code`, Slack `comment`, Storybook `cube`, Figma `image`, and a link on no estate `globe`; on `plus-uno.netlify.app` the path decides, so `/storybook/…` is Storybook, `/blueprint/…` the blueprint, and any other path `globe` — and a card reading no estate shows none (`agents/uno-bot/src/slack/estate-glyphs.ts`). To recheck, send raw chunks to a test DM through `/debug/slack-stream?…&chunks=`.

**The working status names the card in progress** ("is checking the Roadmap board…"). `agents.sessions.setStatus` takes a lifecycle value and no words, so the words go by the bridged `assistant.threads.setStatus`, always non-empty, on the checklist's own update chain, and stop before the settle: a line landing after it would move the session back to `processing` (`agents/uno-bot/src/slack/assistant.ts` § `setStatusLine`).

Block Kit **is** wired (`delivery.ts` posts a `markdown` block with a `section` and a bare-text fallback; proposal cards carry buttons via `interactive.ts`) — the claim that it wasn't stood in this file until 2026-08-22. `reply_broadcast` exists on `PostMessageInput` but is used only by a test route.

### The same Markdown goes everywhere else too

One dialect, four destinations — you write Markdown, the Worker renders it per surface:

| Destination | Renderer | Notes |
|---|---|---|
| Slack | `slack/mrkdwn.ts` (mrkdwn paths only) | this file — tables render |
| Notion (`notion_create`, `notion_update`) | `integrations/notion-blocks.ts` | real blocks, annotations **and real tables** — `notion.md` § Writing a body |
| Email (`email_send`) | `integrations/email-render.ts` | plain text **and** HTML; tables flatten to bullets |
| GitHub issue body (`github_issue_create`) | none — sent as written, plus a footer from `tools/github-issue-render.ts` | GitHub renders Markdown natively, tables included; the repo may be public |
| GitHub issue comment (`github_issue_update`) | none — sent as written, plus the same footer | as above |

**Tables are the one construct that differs by destination, and every one handles it well.** Slack renders a real table; Notion gets a real `table` block; email flattens to one labelled bullet per row (`Column: value · Column: value`) because HTML mail tables break across clients; GitHub renders the table as written. Write the table whenever the content is a grid — nothing is lost anywhere.

### What Slack's Markdown parser actually does — measured, not assumed

Sent one message through and read back what Slack stored (2026-08-22). This is the mapping, and it is why the rules above are what they are:

Sent one message through and **looked at how it rendered** (2026-08-22):

| You write | How it renders | |
|---|---|---|
| `**bold**` | bold | ✅ |
| `*single*` | *italic* | ⚠️ never use a single `*` for bold |
| `_italic_` · `~~strike~~` · `` `code` `` | italic · strikethrough · code | ✅ |
| `- item`, nested by two spaces | bulleted list, indented sub-items | ✅ |
| `1. item` | numbered list | ✅ |
| `[label](url)` | a real link | ✅ |
| `> quote` | blockquote | ✅ |
| a `\|` table | **a real table** | ✅ |
| `## Heading` | bold text — no larger, no hierarchy | works, but it is just bold |
| ```` ```sql ```` | code block, language tag not shown | ✅ |

`*single*` resolving to *italic* is exactly the bug the old mrkdwn mandate produced — it told the model to write `*bold*` on a path where that means emphasis.

Since a `##` heading renders as plain bold, there is no reason to prefer it over a `**Bold label**` line; both look the same and the bold line reads better in a chat message.

*(Caveat that bounds the claim: this went through a Slack client's own Markdown send path, not `chat.appendStream` directly. That field is documented as the same parser. Nothing here is load-bearing on the difference — the Worker converts before sending on the mrkdwn paths regardless.)*

<details>
<summary>Why this changed on 2026-08-22</summary>

Until then this file mandated Slack **mrkdwn** (`*single*` bold, literal `•`, `<url|label>`), the Worker's converter assumed Markdown *in* and mrkdwn *out*, and the live streaming path sent the body to Slack's `markdown_text` field — which is standard Markdown. Three layers, three assumed formats. A model that obeyed the prompt perfectly rendered *worst* (in Markdown, `*bold*` is italic — since confirmed by measurement — and `<url|label>` is nothing); a model that "slipped" into `**bold**` rendered correctly. The bot was fighting its own instructions. Fixed by picking the dialect the model writes best and Slack's agent field takes natively, and converting in code wherever something else is needed.
</details>

## Threading & mentions

- **Reply in-thread by default** (`thread_ts` = the *parent* message's ts). Keeps the channel clean.
- A fresh top-level post is only for cross-channel announcements (e.g. a review fan-out to #plus-design) — a real new message, not a reply.
- **A `/uno-*` slash command runs as a public thread.** The Worker posts a framing message in the channel and threads the run under it, so history, the emoji gate, and proposals behave exactly as they do for an @mention.
- **Mention only who must act** (`<@U…>`). Never spray `<!here>` / `<!channel>` / `<!everyone>` — they need installer permission and read as noise. Batch related updates into one message, not five.

## Writing style (all Slack output)

Uses the model's default voice for chat; the bot's specific register lives in `agents/uno-bot/AGENT.md § Identity & voice`, and its emoji budget in § Emoji budget there.

- **Lead with the answer / outcome** — the first line is one `**bold**` sentence that answers; no preamble, no restating the ask back.
- **Glanceable, not paragraphs.** `**Bold label**` lines in place of `#` headings, `-` bullets two levels deep at most, and a table for any grid of three or more rows.
- **Summarize, link the artifact** — the link sits on the name of the thing (`[the Roadmap card](url)`); steps are summarized, not transcribed.
- **Human, contraction-y, low ceremony.** Brief and clear over formal; no jokes that don't serve the task.
- **A failure says what did not change and names one next step** (retry, adjust or escalate) — a bare "something went wrong" helps nobody. The Worker's own failure post is that shape in blocks: a bold progress line with the next step, a ⚠️ line, and a Try again button that asks the question again as the person.
- **Confirm before real-world side-effects** (the proposal gate) — but gate only genuinely risky ops; no confirmation fatigue.
- **On behalf of** — acting for a person, say so, and surface what was done + a link.
- **A post in a channel** — top level rather than a thread reply — is a summary plus a link; the detail goes in its thread or on the linked page.
- **One length rule, and it lives here.** Past ~600 characters of prose (lists are exempt — they stay scannable at any length), lead with a 2–3 line summary and put the detail after it. One message holds **11,000 characters** — the `markdown` block's 12,000 with headroom, `MAX_POST_CHARS` in `agents/uno-bot/src/slack/answer-posts.ts`. Past that the Worker splits the answer into continuation messages in the same thread, at paragraph boundaries, each one led by `_(i/n)_`; nothing is cut and nothing is lost. That is a fallback, not a licence to write long: a reply that runs to three messages is usually a reply that should have threaded the detail or put it on the relevant Notion card with a link. There is no Gist tool. *(Every other number that used to float around — "~4,000" here, ">3000" in `AGENT.md` — now points at this one.)*

<!-- Grounded in Slack's own docs (fetched 2026-07-08): Formatting message text · Block Kit · chat.postMessage · Agent design · App design guidelines. -->

## Frame words render as code

When uno-bot (or any agent) writes to Slack or Notion, the estates' FRAME words render as `code` so designers learn to recognize them as system vocabulary, not casual English — Bill, Jul 2026:

- **Blueprint frame words:** `phase` · `scenario` · `path` · `step` · `lane` · `cell`, plus the lane (actor-row) names as the board spells them.
- **Roadmap frame words:** `card` · `RM-ID` · `Design Status` · `Dev Status` · `Product Pillar` · `Product Tag` · `Intake Status`.

Scenario and project *names* (Goal Setting, Warm-Up, Session Sign Up) stay `*bold*` — they're topics, not frame words. Codify a frame word when it's used AS the system term ("the `Regular Tutor` `lane`"), not in ordinary prose ("a tutor joins the call").

<!-- ide-only -->
## Figma messages

The words uno-bot's own code writes about Figma follow the copy Bill approved in #886 (2026-09-30): the library publish card and its thread, the post for a library edited but not published, the weekly precedence thread, and the drift question with the edit that withdraws it (§ 3.3). A new Figma message follows it too. `agents/uno-bot/tests/figma-copy.test.ts` pins each renderer to this section, and reads the Not column below as words no message may use.

**A proactive post** speaks first, in someone's channel or file, so it earns the interruption in its first line: it opens with the fact, asks one named person for one action, and keeps wit for a success post. ✅ and ⛔ appear only as the gate, 🐐 only in the label, and one 🎉 when something ships.

| Say | Not |
|---|---|
| library | Foundation library, DS file |
| published · edited, not published | metadata changed, version-less change |
| component · variant | component set, node |
| has code · no code mapping yet | mapped, unmapped |
| intake (linked, nothing more) | harness-intake issue |
| Card 2482 | RM-2482, card #2482, ticket |
| the file | the Figma, the doc |
| Decisions DB | decision log |
| skip · drop | dismiss, ignore, dispute |

Every Figma message passes these eight:

1. The first line says what happened, or asks the question.
2. Every count matches the names listed, or the list ends with "and N more".
3. One named person is asked for one action, with no `<!here>`.
4. ✅ and ⛔ each say what they do, in one footer.
5. No decorative emoji: 🎉 appears only on a ship, and 🐐 only in the label.
6. The words match the table above.
7. Anything written into Figma leads with `🐐 le goat (uno-bot) · AI-generated`.
8. Under 1,500 characters; a longer list goes in the thread. Two exceptions carry their list as a result table in one message: the weekly precedence list (up to 30 rows), and the library publish post, which leads with a release card and a table of every changed component above its decision, so its thread gets the list only when the table could not post.

**At the gate,** the library card, the weekly precedence card and the drift card answer in their own words, because the gate's shared lines assume a card someone asked for. A ⛔ closes the card with what it did ("Intake only", "Nothing filed this week", "No intake filed") and who decided. A ✅ or ⛔ after the window is told the card closed and what happens next. A replaced card, or a reaction beside one, points at the card itself, with no ⚠️ to name. Each card's lines sit beside its copy (`PendingProposal.stated`), and the same test holds them to this section.
<!-- /ide-only -->
