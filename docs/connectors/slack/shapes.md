---
embodiment: all
disclosure: reference
summary: Slack's output shapes, disclosed — the share-out post, the answer shapes `present` builds (result table, chart, answer cards, ⚠️ line, Sources box), the render path each part takes, and the copy rules for the Worker's own Figma messages
description: the share-out post, a result table, a chart, answer cards, a ⚠️ line, the Sources box, how a reply renders and falls back — read before composing any of them or explaining how one rendered.
---

# Slack output shapes

<!-- canonical per ADR-017 (docs/adr/) · split 2026-10-14 out of the Slack connector doc, whose always-loaded half is overview.md beside this file · applied by agents/uno-bot. -->

Each shape the bot's Slack output takes, and which bot skill produces it. The rules every message follows — the dialect, mentions, threading, writing style — are the overview's (`overview.md`, always loaded).

| Shape | Produced by |
|---|---|
| Share-out post | share-out (`shareout_post`) |
| Result table, chart, answer cards, ⚠️ line | any skill answering from a lookup (`present`, `roadmap_query` with `as_table`) |
| Sources box | code, from the links an answer used |
| Render paths | the Worker, on every reply |
| Figma messages | the Worker's own code |

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

**Where it posts** is `place`: #plus-design-feedback, top level, by default, and the place the bot suggests first; `here` keeps it in the conversation it was asked in, the DM or the thread; `channel` posts top level in any channel the asker names in `channel` (an id, a mention, a link or a `#name`). A named channel is checked in code before the card is staged and again at ✅: the asker must be in it, and the bot must be able to post there — any public channel (`chat:write.public`), or a private one the bot has been added to. A check that fails is said plainly ("you're not in #x", "I can't post in #x — add me to it first") with #plus-design-feedback and here offered instead. A test channel always keeps it in its own thread; a Worker with no feedback channel set keeps the default there too. The card names the place the ✅ posts to ("in #plus-design-feedback", "in this DM", "in this thread", "in #design-crit").

## Answer shapes

Code builds each of these from the rows a lookup returned this turn; the model chooses the shape and writes the prose around it.

### Lookup rows: the result table

**Rows a lookup returned go in the result table, not a Markdown table.** Code builds a Slack `data_table` from the rows that lookup returned this turn, so every cell is a real value and every link works. The model only chooses: for Roadmap cards it sets `as_table` on `roadmap_query` (the Roadmap preset); for any other lookup it calls `present` with the lookup, up to 4 of its rows' fields and a one-line takeaway. The persona asks for a table at 2 or more rows, the threshold code builds one at (`MIN_ROWS`); one row stays in the prose.

- **The offer:** a lookup's result whose main list holds 3 or more records gains `table_ready`: the list, its count and the fields a column can show, without ids, scores or timestamps. The first result of each lookup in a turn also gains a `table_note` naming the `present` call and the turns that want prose instead (a yes/no question, a single answer, a conversational reply). A tool whose rows are a record to read or a step in a filing opts out in the tool table (`offersTable: false`): the intake duplicate check, a profile, a thread. `present` fetches nothing, so it spends no lookup budget and still answers once the turn's lookups are counted out.
- **When it appears:** the request named a lookup this turn made, and that lookup returned 2 or more rows. A lookup called several times (once per phase, say) is one set of rows: every call whose main list offers the same columns, each row once. The caption names the filters the calls shared and each value of one they did not (`phase Onboarding / Pre-session`), drops a whole count, since that belonged to one call's query, and reads `at least N` when any call matched more than it returned. A call of another shape, such as an orientation search, stays out. `roadmap_query` reads its last call for a table, cards and a grouped chart. The Roadmap preset takes only *definite* cards: an enumeration's (Design Status and/or person), or a title search's `contains` hits; did-you-mean guesses stay in the prose. One table per answer: the last request of the turn that produced one.
- **Refusals:** a lookup missing from this turn, a field absent from the rows, long text (over 120 characters or multi-line), a list, a bare link, or more than 4 columns. The refusal is the `present` call's own result, worded for the model, which then writes the plain list.
- **What it holds:** the Roadmap preset shows the card title linked to its Notion card, card number, Design Status and Dev Status. Any other table shows the chosen fields under headers made from their names (`design_status` → Design Status); a field inside a row's property bag is named after the bag and a dot and headed by its own name (`meta.Year` → Year), and its values are text, so they sort as text; the first column links to each row's `url` when it has one. A field that is numbers throughout posts as `raw_number` cells, so Slack sorts it as numbers. `data_table` has no alignment setting (`column_settings` is refused), so alignment is Slack's own. At most 30 rows, all on one page.
- **Caption:** written by code: the count, the lookup's filters and whether the list is partial (`13 cards · Design Status WIP`, `first 30 of 57 · "onboarding" · phase Onboarding`, or `at least 12 …` on a partial read with no larger count).
- **Prose:** the model's result says `table_attached`. With a table, the answer leads with the takeaway, gives what stands out and what to act on, and names at most 3 rows; without one, it writes the plain list.
- **Text copy:** the prose, then a plain line per row, written by code. Notifications, screen readers, the stored history and later turns read this copy, so it is the answer of record.
- **Rows typed twice:** the Worker removes each prose line that is only a row (its identifying field, other values, the headers' words, a bullet or link); a Roadmap card only when the line names its number too. A sentence naming a row stays.
- **Rows walked:** with a table, cards or a typed table, a draft over 3 list items, 1,000 characters or 3 rows named is shortened by the judge at any length. If what ships is still over, its list items come out (past the first 3 beside cards). Without a table, no budget.
- **Placement and fallback:** the table sits after the `markdown` block and before the footer, on the last part of a split answer, and an answer carrying one always posts as an ordinary message. If Slack refuses the blocks, the answer goes out again without the table, its plain list appended to the Markdown, and then the usual rungs below apply. The step down is logged.
- **Worker posts:** a batch result is a result table too, under a head line, falling back to its plain list when Slack refuses the table. A **batch result** (two or more operations) has a Where, What and Result row per operation: Result reads `done` or `failed: <reason>`, Where links the target and What links the item the operation created. A batch of more than 30 operations posts the list alone, and one operation posts no table.

### Numbers that compare or trend: charts

**A count or sum per group is a chart, computed by code.** The model calls `present` with shape `chart`, the lookup, the kind (`bar` to compare, `line` or `area` for a trend, `pie` for parts of a whole), `group_by`, and `measure` to sum a numeric field instead of counting rows. Code groups that lookup's rows and posts a Slack `data_visualization` block; the result hands the model the same `values` and `total`, so every number about the chart is grounded like a fetched one.

- **Across lookups:** a count that takes one lookup per group — cards per Design Status is one `roadmap_query` per status — names `across` (the argument the calls differ by) in place of `group_by`; asking with both is refused. Each call made with that argument is one point, valued at the whole count the call reported (`matched`, so a status listing its first 30 of 41 is 41) and named by its cards' own status, or by the filter when it returned none; two calls for the same status, in any case, are one point. Calls whose other filters differ (a person on some, none on others) count different things, so the chart is refused; a call made without the argument is passed over. A call with no whole count refuses it too. A call that read only part of its source is still a point, at the count it read: the ⚠️ line `<Status> shows at least N; the board has more than could be read.` takes the place of the generic partial line, and `present` hands the model those values in `at_least`, so the prose says "at least". A read filtered to one Design Status pages up to 1,000 cards (ten pages, where an unfiltered read stops at five), so a status that size counts exactly. A refusal posts its reason as a ⚠️ line and no table, since there is no one list of rows to fall back to. Once drawn, the Worker reads the board's Design Status options and names any no lookup counted in a ⚠️ line (`⚠️ Not counted: Under Dev and Archived were not looked up, so the chart leaves them out.`), and a card table one of the counted lookups attached with `as_table` gives way to the chart.
- **Limits:** at least 3 points; at most 20 (12 for a pie); at most 2 charts per message, the cap Slack enforces live. Labels and the series name are cut to 20 characters and the title (code's: `Cards by Design Status`) to 50. A bar or pie runs largest first; a line or area runs in label order.
- **Ungroundable → table (`group_by`):** a partial list (the first 30 of 41 would understate every bar), fewer than 3 groups, a group field the rows lack, a measure that is not a number on every row, or labels that collide once cut. The rows post as a result table instead, and the reason rides as a ⚠️ line (below): `⚠️ Not charted: only 2 groups to compare.` A lookup missing from this turn gets the refusal alone.
- **Text copy:** each chart adds a line of its top 5 values (`Cards by Design Status: WIP 3 · Under Review 2 · Shipped 1`), and a ⚠️ line adds its sentence, so a notification carries the gist.
- **Placement and fallback:** charts sit after the `markdown` block, before any table, ⚠️ line, Sources box and footer, and the answer posts as an ordinary message. If Slack refuses the blocks, the answer goes out again without charts or table, their text in the Markdown.

### Sources box and link previews

**Code lists the links an answer used; the prose ends on its last point.** Used means the Roadmap board or scoped Notion database a lookup queried, or a page it read whole, once, plus the rows the prose names: by whole link, a card's number (`#412`), or a title of 2+ words no other row shares (`slack/sources-box.ts`). The ones a thread may see fold into a closed `container` titled `Sources (n)` after any table, at most 10. A box needs 3+ used links, except that an unlinked board or database opens one alone, listing only links the prose leaves out. The title is the count alone. The links also ride the text copy as one `Sources:` line, and a refused box steps down to the answer with that line in its Markdown. Every answer post sets `unfurl_links` and `unfurl_media` to false.

### Linkable items: answer cards

**Items the reader will open go in cards.** The model calls `present` with `shape: "cards"`, the lookup, its title field and optionally a subtitle field; code builds every card from that lookup's rows (`turn/answer-cards.ts`, block in `slack/answer-cards-block.ts`).

- **Shape:** one item posts as a `card` block, 2 to 10 as a `carousel`; more are cut to the first 10 and the model is told the total. One set of cards per answer. No hero images.
- **Links:** a row's `url` is the first button, "Open"; its other http(s) fields follow, labelled by field name, up to Slack's 3. A row with no link is left out; a list with none is refused, and the model names the items in prose.
- **Logos:** a card's icon is the logo of the estate its first link leads to (`estateOfUrl`), as a PNG image Slack fetches by URL; an SVG image does not render. PLUS, uno-blueprint, GitHub and Slack are served from `public/uno-bot/logos/` on plus-uno.netlify.app; Storybook, our own design system, carries the PLUS mark; Figma and Notion use Google's favicon service for their domain. A link on no estate's host carries the PLUS mark. Task cards keep Slack's named icons, since Slack refuses images there.
- **Placement and fallback:** as the table's: after the `markdown` block, before the footer, always as an ordinary message. If Slack refuses the blocks, the answer goes out again without them, each card a linked Markdown line in the prose. The text copy carries the same lines.

### The ⚠️ line: what the reader has to see

**A caution goes on its own line under the answer, apart from the prose.** Each ⚠️ line is a `context` block after any charts, table and cards, before the Sources box and footer: one sentence, at most two lines per answer. Slack's `alert` block is not used, because Slack refuses it in a message.

- **Code adds it** from what the turn already knows, one line per trigger however often it fires: a lookup stopped short (`partial`, or `truncated` with no `capped_by` row cap); a source errored, timed out or refused access (an argument the tool refused is not a source failure, and a retry that came back whole clears it); the lookup budget refused a lookup, cut one short, or ended the loop in a synthesis pass; blueprint rows whose newest `updatedAt` is older than 180 days; the absence pre-check fired; a chart fell back to a table (`Not charted: …`, withdrawn when a table asked for in its own right replaces it). The turn has no wall-clock budget, so the call budget is the only budget line.
- **The model adds one, for an estate conflict:** two sources it read this turn disagree (the blueprint says one thing, a Roadmap card or PRD another). It calls `present` with shape `conflict` and the disagreement as one sentence in `line`; code places the ⚠️. Refused, in the call's own result: fewer than two sources answered this turn, more than one sentence, an emoji, over 240 characters, a second conflict, or two lines already held. A ⚠️ the model typed at the start of `line` is dropped.
- **Order and cap:** lines keep the order their triggers were first met; a third is dropped.
- **Text copy:** each line, sign first, after the prose and any chart, table or card lists, so notifications carry it. An answer with a ⚠️ line posts as an ordinary message rather than a stream, which has no text copy. A refused ⚠️ block steps down to its sentence in the Markdown, like any other block beneath the answer.

## Render paths

**A table renders as a table on every answer path**: the streamed part goes out as `markdown_text`, and every posted part (channel answers, continuation parts, every answer while streaming is off) as a `markdown` block. The one rung where a table degrades is the `section` fallback, reached only when Slack refuses the `markdown` block: a `section` cannot hold a table, so each row becomes `• a — b — c` and the header row is dropped. A refusal is logged, so a degraded table is a line in the tail.

### What the Worker does on each path

| Path | What is sent | Converted by |
|---|---|---|
| Streamed first part (streaming on, in a thread) | `markdown_text` — your Markdown, with only the markup pass below | `sanitizeStreamChunk` in `appendStream` / `stopStream` |
| Posted part (channel answers, continuation parts, streaming off, a stream that failed) | one `markdown` block — your Markdown as written — plus the footer `context` block on the last part | none — Slack turns it into rich text itself, and shows an escaped `&lt;` as written |
| Fallback rung 1 (Slack refused the `markdown` block for its blocks: `invalid_blocks`, `invalid_blocks_format`, or `invalid_arguments` pointing into `/blocks`) | `section` blocks, which are mrkdwn-only, plus the footer | `toSlackMrkdwn` in `textSections` |
| Fallback rung 2 (Slack refused the sections too, or refused the first post for anything other than its blocks) | bare `text`, no footer | `toSlackMrkdwn` in `postMessage` |
| `chat.postMessage` `text`, every rung | the whole part as mrkdwn, for notifications and screen readers | `toSlackMrkdwn` in `postMessage` |
| Proposal card | a turn's card: a summary section, two context lines and Review (`proposalCardBlocks`); a stated card: mrkdwn sections + Review | `toSlackMrkdwn` via `textSections` |
| Review pop-up, a drafted GitHub issue's body | mrkdwn sections, as many as the body fills; a modal takes no `table` or collapsible block. Every other draft (DM, Notion) and the card-text views show their text through `textSections` alone, as it is sent | `reviewMarkdown` then `toSlackMrkdwn`, via `reviewSections`: comments dropped, a table row as one bullet (first cell bold, the rest after ` · `, empty cells and repeats of the first cell dropped), task items as ☐ / ☑ |

Conversion covers `**bold**` → `*bold*`, `- item` → `• item`, `## Heading` → `*Heading*`, `[label](url)` → `<url|label>`, tables → `•` lines, and strips the fence language tag (mrkdwn code blocks take no info string).

### Streamed text

**The stream takes the same rule**, across append boundaries: `<@team` ending one append and `mate>` starting the next are one token, so an unclosed `<…` is held until the next append or the close (`sanitizeStreamChunk`). Slack documents `markdown_text` only as "message text formatted in markdown", not whether it parses or blanks on `<…>`; until seen, the proven rule stands.

**Streaming stays off until a live probe passes.** Either flag is refused unless `SLACK_STREAM_MARKUP_PROBE` records `pass:YYYY-MM-DD`: stream a body with a bare `<@teammate>` and one in a code fence to a test DM, raw, via `/debug/slack-stream?…&text=`, and check it isn't blank. Note too whether the fence shows `&lt;` and whether a real `<@U…>` pings.

### Task cards

**A task card's icon is a named Slack icon, and nothing else.** The shape is `icon: {type: "icon", name}` with one of Slack's built-in names, on the `task_update` chunk and on a static plan's `task_card` alike. Production took `globe`, `book`, `map`, `code`, `comment`, `folder`, `cube` and `image` on 2026-10-07, and refused with `invalid_arguments` (`failed to match exactly one allowed schema [json-pointer:/chunks/0]`) an image URL as `name`, a `url`, an `image` element, an emoji and an unknown name; `call`, `email`, `file`, `link` and `user` fail the validator too. Each card shows its estate's glyph — Notion `book`, blueprint `map`, GitHub `code`, Slack `comment`, Storybook `cube`, Figma `image`, and a link on no estate `globe`; on `plus-uno.netlify.app` the path decides, so `/storybook/…` is Storybook, `/blueprint/…` the blueprint, and any other path `globe` — and a card reading no estate shows none (`agents/uno-bot/src/slack/estate-glyphs.ts`). To recheck, send raw chunks to a test DM through `/debug/slack-stream?…&chunks=`.

**The checklist goes to Slack at group boundaries**, since its calls spend the lookups' 50: one append per group of lookups, the settle riding the stop. An answered turn's cards end `complete` (`Failed: …`, `Skipped`); Slack titles a plan with an `error` card "Something went wrong" (`agents/uno-bot/src/slack/delivery-adapter.ts`).

Block Kit **is** wired (`delivery.ts` posts a `markdown` block with a `section` and a bare-text fallback; proposal cards carry buttons via `interactive.ts`) — the claim that it wasn't stood in this file until 2026-08-22. `reply_broadcast` exists on `PostMessageInput` but is used only by a test route.

### What Slack's Markdown parser actually does — measured, not assumed

Sent one message through and **looked at how it rendered** (2026-08-22):

| You write | How it renders | |
|---|---|---|
| `**bold**` | bold | ✅ |
| `*single*` | *italic* | ⚠️ bold is `**`, two stars |
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

*(This section read "No tables. Ever." for about an hour on 2026-08-22. That was a bad inference: a probe message's **stored text** contained no table, so the table looked deleted. It was not — Slack keeps it as a block and only the plain-text fallback omits it. Corrected by looking at the rendered message. The lesson: **a Slack message's stored text is not what a reader sees** — verify rendering by looking at it.)*

<!-- ide-only -->
## Figma messages

The words uno-bot's own code writes about Figma follow the copy Bill approved in #886 (2026-09-30): the weekly precedence report, the drift cards (one card per file that has not caught up with its thread's decision) with the edit that withdraws a card once its file does (§ 3.3), and the comment decisions in #plus-design (§ 3.5), whose cards are numbered. Each is a section of the sweep's morning message for its place. A new Figma message follows it too. `agents/uno-bot/tests/figma-copy.test.ts` pins each renderer to this section, and reads the Not column below as words no message may use.

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
7. Anything written into Figma leads with `🐐: ` and its first line.
8. Under 1,500 characters; a longer list goes in the thread.

**At the gate,** the drift card answers in its own words, because the gate's shared lines assume a card someone asked for. A ⛔ closes it with what it did ("No intake filed") and who decided. A ✅ or ⛔ after the window is told the card closed and what happens next. A replaced card, or a reaction beside one, points at the card itself, with no ⚠️ to name. Each card's lines sit beside its copy (`PendingProposal.stated`), and the same test holds them to this section.

**The weekly precedence report** is decided in each card's Review, with no footer to teach and nothing to type: a typed ✅ or ⛔ in the thread of the message carrying it gets the one review-only line and runs nothing. Approve adds the component to the week's intake; "Written:" names the intake number returned by the write. Needs changes takes a note (the library is right, or the difference is deliberate), puts it on the intake, and the card reads "Noted by" who sent it. Reject writes nothing, leaving the difference as deliberate, and the card reads "Rejected by" who decided. A card whose six days pass undecided reads "Closed, no decision".
<!-- /ide-only -->
