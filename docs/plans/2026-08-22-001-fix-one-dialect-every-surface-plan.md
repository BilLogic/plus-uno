---
title: "One dialect, every surface: the model writes Markdown, each egress converts"
type: fix
status: implemented
date: 2026-08-22
implemented: "All three surfaces — Slack (rows 1–3, 6-partial, 7, 11–13, 17), Notion (8–9, 15), email (10) — 2026-08-22"
deferred: "none — rows 16 and 19 decided 2026-08-22, see Closing the last two rows"
repos: plus-uno (agents/uno-bot, docs/conventions)
related: docs/plans/2026-08-21-003-fix-how-uno-bot-takes-a-yes-plan.md
---

# One dialect, every surface

## Overview

Two audits on 2026-08-22: the markdown → Slack path in `agents/uno-bot`, and
the per-destination content conventions in `docs/conventions/`. The user's
report — *"bullet points, bold, etc. are not properly processed when the
message is passed on Slack"* — is real, and the cause is not the converter.

**Three layers each assume a different input format, and none of them is on
the path that ships.**

| Layer | Assumes the model writes | Where |
| --- | --- | --- |
| The prompt | Slack **mrkdwn** (`*bold*`, literal `•`, `<url\|label>`) | `AGENT.md:140`, `docs/conventions/slack.md:42-59`, `draft-judge.ts:68-77` |
| The converter | **Markdown** in, mrkdwn out | `src/slack/mrkdwn.ts:13`, applied only at `api.ts:140` |
| The live egress | **Markdown** — Slack's `markdown_text` field | `delivery.ts:227` → `appendStream` → `api.ts:236` |

`wrangler.toml:53` sets `SLACK_STREAMING = "on"` and `threadTs` is always set,
so **every model reply streams**, and `toSlackMrkdwn` is never called on it. A
model that obeys the prompt perfectly — single-asterisk bold, `<url|label>`
links — is the one that renders worst, because `markdown_text` is standard
Markdown where `*x*` is italic and `<url|label>` is nothing. A model that
"slips" into `**bold**` and `- item` (the thing `AGENT.md` says *"bites
hourly"*) renders best. The bot has been fighting its own prompt to look right.

The same audit found the Notion path is worse: `src/integrations/notion.ts:68`
posts every section body as plain paragraphs with **no** markup parsing, and
nothing anywhere tells the model that — so `**Decision:** one sentence`, the
body shape `notion.md:52` instructs, lands in Notion as literal asterisks.
Email is `text/plain` with the same silence.

**The fix is one decision, applied everywhere:** the model writes standard
Markdown — the dialect it is trained on and the one Slack now accepts natively —
and every egress converts for its destination in code. The convention doc
becomes a matrix of what each converter does, not a style guide the model has
to hold in its head.

---

## Revision 2026-08-22 (pm) — the streamlined scope

Asked: *"are we sure this is the most optimal, streamlined, non-overengineered
solution?"* Not as first written. The first draft fixed everything the audit
found; most of it is on paths that rarely run. The user-visible bug is on one
path and needs no new code. The cut:

**Ship now — zero new modules, one prompt change, two one-line code changes:**

1. `AGENT.md:140` and `draft-judge.ts:68-77`: stop mandating mrkdwn. The model
   writes standard Markdown. `slack.md`'s mrkdwn table goes; in its place a
   six-line "what renders in Slack" list. *(The no-tables half of this was
   SUPERSEDED the same day — tables render fine; see "Verified … twice" below.
   Kept here as the record of what was decided before it was measured.)*
2. ~~`delivery.ts` stream path: convert tables before `markdown_text`.~~
   *(Superseded — it destroyed a construct Slack renders.)*
3. `delivery.ts:159` `textSections`: run `toSlackMrkdwn` on each section so
   the blocks fallback renders the same as the stream. One line.
4. `tsconfig.test.json` + `tests/mrkdwn.test.ts`: five fixtures — `**bold**`,
   `- item`, `[l](u)`, a pipe table → bullets, idempotence on valid mrkdwn.

That is the whole Slack fix. The model writes what it writes best, Slack's
agent field renders it, the one thing Slack cannot render is caught twice.

### What actually shipped, 2026-08-22

Close to the above, with three additions found while doing it:

- `AGENT.md:140` now says *"Write standard Markdown"*; the `<url|label>`
  citation rule (`:25`), the literal-`•` preview rule (`:115`) and the
  duplicate length number (`:137`) went with it. The draft judge's formatting
  gate became a **table** gate plus a bracket-citation gate, and its `revised`
  instruction asks for Markdown.
- `stripMarkdownTables` (new, fence-protected) runs inside
  `renderDeliveredBody`, so tables die on **every** path — stream, blocks and
  text — before the cap, and the delivered body matches what history records.
- `textSections` now runs `toSlackMrkdwn` over the whole body before splitting.
  This was the second real bug: the blocks path shipped the **raw** body, and
  Slack renders blocks over `text`, so the sanitized copy was seen by nothing
  but notifications. Every `**bold**` on that path reached people as asterisks.
- **Addition 1 — the six skill files.** `skills/*/bot.md` carry the per-skill
  output templates and are bundled into the same prompt. All six still
  mandated mrkdwn (`*bold*` labels, literal `•` bullets, `<url|label>` links),
  which would have fought the new rule on exactly the replies that use a
  template. Converted.
- **Addition 2 — the fence language tag.** `toSlackMrkdwn` now strips it:
  mrkdwn code blocks take no info string, so ```` ```ts ```` rendered "ts" as a
  literal first line inside the block on the blocks path, while `AGENT.md`
  asks for language tags (correct for Markdown). Both can now be true.
- **Addition 3 — two false claims in the new doc, caught on re-read.** The
  first draft of `slack.md` said escaping `& < >` is "the Worker's job" —
  nothing escapes them, and on the Markdown path an `&amp;` renders literally,
  so it now says don't hand-escape and names the one real hazard (text that
  looks like a Slack token). It also banned tables while using them for
  reference, so it now says so explicitly.
- `tests/mrkdwn.test.ts` (11 assertions) and `src/slack/mrkdwn.ts` added to
  `tsconfig.test.json` — the module was not previously compiled by `npm test`.
- Row 17's `layer` → `lane` sweep done in `terminology.md`, `supabase.md`,
  `AGENTS.md`; row 13's stale "Block Kit is not wired" replaced with what the
  code does.

**Verified 2026-08-22 — twice, because the first reading was wrong.**

A probe message was sent through Slack's Markdown path and read back. The first
pass judged it by the message's **stored text**, and drew two conclusions that
were both false:

| Claimed from stored text | Actually renders as |
| --- | --- |
| a table is **deleted** | **a real table** — ruled header, aligned columns |
| `## Heading` loses all weight | bold text |

A Slack message's stored text is not what a reader sees. Slack keeps a table as
a block; only the plain-text fallback omits it. Corrected by looking at the
rendered message.

**What the render actually shows:**

| You write | Renders as | |
| --- | --- | --- |
| `**bold**` | bold | ✅ |
| `*single*` | *italic* | ⚠️ the old mrkdwn mandate's bug, confirmed |
| `_italic_` · `~~strike~~` · `` `code` `` | italic · strike · code | ✅ |
| `- item`, nested | bulleted list, indented sub-items | ✅ |
| `1. item` | numbered list | ✅ |
| `[label](url)` | a real link | ✅ |
| `> quote` | blockquote | ✅ |
| a `\|` table | **a real table** | ✅ |
| `## Heading` | bold — no larger, no hierarchy | works, but it is only bold |
| ```` ```sql ```` | code block | ✅ |

**Code changed twice, and the second change reverted the first.** For about an
hour `renderDeliveredBody` ran `stripMarkdownTables` and `headingsToBold` on
every path. Both were deleted: each was destroying a construct Slack renders
well. `renderDeliveredBody` now strips only the retired confidence affix, and
the Markdown that streams to Slack goes as written.

Tables degrade to bullets on the **mrkdwn paths only** — the blocks fallback and
`postMessage`'s `text` — because a `section` block genuinely cannot hold one.
That is a rare downgrade on a fallback, not a policy.

`AGENT.md`, the draft judge and `slack.md` moved from *"never a table"* to
*"use one when the content is a grid, 2–4 narrow columns"*. The judge's table
hard-gate is gone.

**Then the follow-up was done too.** Tables now land as richly as each
destination allows, and the parse produces the RICHEST form once — a `table`
block — with each renderer deciding from there:

| Destination | A Markdown table becomes |
| --- | --- |
| Slack, streamed | the Markdown, untouched — Slack renders a real table |
| Slack, blocks fallback | one bullet per row (a `section` block cannot hold a table) |
| Notion | a real `table` block, header row flagged, cells parsed for inline markup |
| Email (both parts) | one labelled bullet per row, `Column: value · Column: value` |

Email keeps bullets by decision (*"Email, not working, bullet point instead"*),
and it is the right call — HTML mail tables are the classic cross-client mess.

Two things the Notion table needed that the API is unforgiving about: **every
row must have exactly `table_width` cells or the entire request is rejected**
(so the header sets the width and each row is padded or truncated — a ragged
row is what an unescaped `|` inside a cell produces), and the rows must be
present as `children` at creation, since a table cannot be made empty and
filled later.

One bug found by reading the rendered output rather than the diff: a table's
`children` ARE its rows, so the email renderer's generic child-walk rendered
each row a second time as a blank indented line — invisible in a diff, a ragged
gap in the delivered mail.

### Notion, shipped the same day (rows 8, 9, 15)

`src/integrations/notion-blocks.ts` — pure, 200 test assertions — replaces
`bodyToParagraphs`. Every construct in Part 2's table lands as a real block:
annotations, links, both list kinds, checkboxes, quotes, fenced code with a
mapped language, dividers. `chunkBlocks` batches at Notion's 100-block limit,
in `notionCreate` (create with the first batch, append the rest) and in
`notionUpdate`.

Four things worth recording, because none was in the plan:

- **The recursion bug.** `parseInline` recurses to compose annotations
  (`**bold with _italic_**`), and it shared one module-level `/g` regex. An
  inner call rewound the outer call's `lastIndex`, so the outer loop
  re-consumed tokens and never terminated — the run array grew until the test
  process took **SIGABRT after 47 seconds**. Fixed with a fresh matcher per
  call. Caught only because a test fed it a 5,000-character paragraph; a
  shorter fixture would have passed and this would have hung a live turn.
- **snake_case must not italicise.** A naive `_..._` rule turns "notion_create
  and source_read" into mangled emphasis, and this codebase's vocabulary is
  full of exactly that. The underscore forms carry word-boundary lookarounds,
  with a test naming the hazard.
- **Unusable link schemes degrade instead of failing the write.** Notion
  rejects a non-http(s)/mailto url and rejects the **whole request**, so one
  relative link in one paragraph would have lost the entire page. It now
  renders as `label (url)` text.
- **Headings inside a body are `heading_3`, never `heading_2`.** Section
  headings own `heading_2` and `fetchNotionPRD` walks that outline downstream
  to find Acceptance Criteria and Implementation Notes; letting a body's `##`
  emit `heading_2` would put it level with the section containing it and break
  that reader.

Partial-failure handling is deliberate on both write paths: a continuation
batch that fails after the page exists logs and returns the page rather than
throwing — reporting "create failed" for a card that is sitting there would
send someone hunting for it.

The bot-facing contract now lives in `docs/conventions/notion.md` § Writing a
body, **outside** the `<!-- ide-only -->` fence. That fence is why this bug ran:
all the formatting guidance was inside it, stripped from the bot's prompt, so
the model had zero instruction on what goes in a body and defaulted to
Markdown — correctly, into a parser that did not exist.

### Email, shipped the same day (row 10)

`src/integrations/email-render.ts` — and the notable thing is what it does
*not* contain: a parser. It renders the block model `notion-blocks.ts` already
produces, into plain text and into HTML. A second Markdown parser would have
been a second copy of the snake_case rule, the link-scheme rule and the
code-span rule, and they would have drifted.

`gmail.ts` now sends `multipart/alternative` — both parts, least-rich first as
the RFC requires. HTML alone would lose text-only readers and most
accessibility tooling; plain text alone loses the structure, which is the whole
point. In plain text a link becomes `label (url)`, which mail clients auto-link,
so the URL — the part that is useless when lost — survives either way.

Three things beyond the plan:

- **A latent RFC bug, unrelated to Markdown, fixed in passing.** Parts were
  sent as `7bit` with the body inline, and RFC 5322 caps a line at 998
  characters. One long paragraph — routine in a PRD summary — exceeds it, and
  a strict receiving MTA may reject or mangle the message. Both parts are now
  base64 wrapped at 76 columns, so the declared encoding is finally true of
  the bytes and non-ASCII is exact. Verified by building a real message and
  parsing it back: max line 94, CRLF throughout, both parts decode, `Résumé —
  ✅` intact.
- **Two bugs my own tests caught.** `renderPlainText` ended with `.trim()`,
  which ate the four-space indent of a body whose first block is a code block —
  silently turning code back into prose. And HTML annotation nesting was
  inside-out (`<em><strong>` for `**bold _and italic_**`); it now mirrors the
  source.
- **The no-tables rule is now global, and true.** I nearly documented "tables
  are fine in email" — they are not: the shared parser had no table branch, so
  a pipe table would have rendered as literal pipes in both Notion and email,
  the exact defect the Slack rule exists to prevent. All three renderers now
  degrade a table to one bullet per row, keeping the column names as bold
  labels (better than Slack's older version, which drops the header).

**Not verified:** a real send. The MIME is verified structurally, but nothing
has gone through Gmail's API — worth one message to yourself before the first
outward one.

### The splitter, shipped the same day (row 5)

`src/slack/split.ts` — `splitBalanced(text, limit)`, now the single cutter
behind both `capText` (3900) and `textSections` (2900). Both used to cut at
"the last newline or space before the limit" with no idea what they were
cutting through.

**It deliberately is not a Markdown parser.** It tracks exactly one piece of
state — the open fence — because that is the only construct that spans lines,
and therefore the only one a line-boundary cut can break. Emphasis never spans
a line in either dialect (the converter's own regexes are `[^\n]`-bounded), so
splitting only at line boundaries keeps it intact for free. The one exception
is a line longer than the limit, which must be cut mid-line; `balancedCut`
prefers a space that leaves backticks and `**` balanced, because an
unterminated inline code span swallows the rest of the line visually.

Verified on the composed pipeline, not just in units: a 9,943-character reply
with a `sql` block straddling the cap now truncates to 3,853 characters with
the fence **closed above** the truncation notice; and the full
`stripMarkdownTables → capText → toSlackMrkdwn → splitBalanced` chain yields
two sections of 2,866 and 987 characters, both balanced, table degraded, bold
and links converted. A continuation chunk reopens the fence with its language
on the Markdown path and without one on the mrkdwn path — correct on both,
since mrkdwn code blocks take no info string.

One implementation note worth keeping. The mutable state lives on a single
object rather than four `let`s: `flush` and `append` are closures that reassign
it, TypeScript's control-flow analysis cannot see through a closure call, and
with plain `let`s it narrowed `openFence` to `null` — so `openFence.length`
failed with *"Property 'length' does not exist on type 'never'"*. Property
narrowing resets after any function call, which is exactly the behaviour this
needs.

### The share-out template, shipped the same day (row 14)

The doc won this disagreement, and the tool grew to carry it. Each field the
Flow 3 template asks for changes what a reviewer does: **fidelity** says which
critiques are useful yet (polish notes on a low-fi wire waste everyone's time),
**round** says whether to repeat last round's points, **three specific
questions** prevent "thoughts?", and **out-of-scope** stops feedback nobody can
act on. Shrinking the doc to match an under-built tool would have deleted a
team practice to make a mismatch go away.

`shareout_post` gains `project`, `artifact`, `fidelity` (enum), `round`,
`what_changed`, `feedback_wanted` (capped at three — the cap is enforced in
code, not requested in prose) and `not_looking_for`. `share-out-render.ts`
holds the shape, split out of the executor so it can be asserted at all.

Every line below the header is optional and omitted when empty, so a share-out
carrying only a summary still posts — the same stage-with-gaps policy as the
bundle audit (2026-07-16), rather than a new way to be blocked.

**The guard is the actual fix.** `tests/share-out.test.ts` reads
`docs/conventions/slack.md` § Share-out post and fails if a `shareout_post`
parameter is not named there. It caught a mismatch on its first run — the doc
had written `` `feedback_wanted[]` ``, so the exact field name never appeared.
That is the class of drift that let this sit for months: the two artefacts
described the same thing and nothing read both.

**Deferred, recorded so they are not forgotten** (rows 5, 6, 8–10, 14–16,
18–19 below): the fence-aware splitter (only bites on replies > 3900 chars),
the remaining converter gaps (fallback path only), the Notion block parser and
email plain-text pass (real, separate plan — the literal-asterisk bug in Notion
bodies stands and is the next thing to fix after this lands), the share-out
template drift, and the `content-surfaces.md` consolidation. The `layer` →
`lane` sweep (row 17) and the stale `slack.md:59` (row 13) are doc-only and
ride along with the prompt change since those files are open anyway.

---

## The ledger — every issue caught, and the fix proposed

| # | Issue | Where | Proposed fix | Part |
| --- | --- | --- | --- | --- |
| 1 | Streaming reply path sends the raw body as `markdown_text`; the mrkdwn converter never runs on the path that ships | `delivery.ts:227-236`, `api.ts:226-238` | Model writes Markdown; stream path passes it through unchanged (that is what `markdown_text` is for) | 1 |
| 2 | Prompt mandates mrkdwn, converter expects Markdown, egress expects Markdown | `AGENT.md:140`, `slack.md:42-59`, `draft-judge.ts:68-77` | Drop the mrkdwn mandate from prompt and judge; one dialect | 1, 4 |
| 3 | Blocks fallback wraps the **raw** body in `section/mrkdwn` blocks; only `text` is converted, and Slack renders blocks over `text` | `delivery.ts:245`, `textSections` `:159`, `api.ts:140` | `postMessage` converts every `section.text.text`, not just `text` | 1 |
| 4 | Proposal-card `previewText` (model-authored) bypasses the converter | `proposal-render.ts:178` | Same — convert at the single egress | 1 |
| 5 | `capText` (3900) and `textSections` (2900) split on `\n`/space, format-unaware — a cut inside a fence leaves one ``` open and everything after renders as code | `delivery.ts:89, 159` | Split on blank lines; never inside an open fence or emphasis; close-and-reopen a fence across the cut; split **after** conversion | 1 |
| 6 | Converter gaps: inline code spans not protected, `~~strike~~`, multi-line `**`, `***both***`, fence language tag kept (renders as a literal first line), `![img]` leaves a stray `!`, table header row dropped, no `& < >` escaping anywhere | `mrkdwn.ts` | Fix each; add fixture test | 1, 5 |
| 7 | `mrkdwn.ts` is not in `tsconfig.test.json` — not even compiled by `npm test`; zero tests for it, `capText`, `textSections`, `renderDeliveredBody` | `tsconfig.test.json` | Add; `tests/mrkdwn.test.ts` from the probe cases; `tests/delivery-split.test.ts` | 5 |
| 8 | Notion bodies: no markup parsing — bullets, bold, links, headings all literal | `notion.ts:68-94, 1222-1235` | `markdownToNotionBlocks()`: `-` → `bulleted_list_item`, `1.` → `numbered_list_item`, `**`/`_`/`` ` `` → annotations, `[l](u)` → link, `#` → `heading_3`, `>` → quote | 2 |
| 9 | Notion 100-blocks-per-request limit unhandled; a long PRD 400s | `notion.ts:843-860, 1222-1235` | Chunk `children` into ≤100 and append in sequence | 2 |
| 10 | Email is `text/plain`; mrkdwn/Markdown reach the recipient verbatim; no convention says so | `gmail.ts:74-84`, `tool-definitions.json email_send.body` | `markdownToPlainText()` (bullets → `•`/`-`, links → `label (url)`, strip emphasis); document | 3 |
| 11 | Three different length rules in one prompt: ~1,500 / ~4,000 (`slack.md:78`), >3000 (`AGENT.md:137`), 3900 / 2900 (`delivery.ts`) | prompt + code | One constant, cited by name from both docs | 4 |
| 12 | `slack.md:47` "blocks take no language hint" vs `AGENT.md:137` "Code fenced with language tags" | prompt | Model always writes a language tag (Markdown); Slack converter strips it; one rule | 4 |
| 13 | `slack.md:59` says the Worker "posts plain `text` — Block Kit not wired" and the sanitizer is a backstop on every message; both false since 2026-08-06 | `slack.md:59` | Rewrite the section as the matrix row | 4 |
| 14 | Share-out template in `slack.md:20-27` (fidelity, round, questions, "NOT looking for", bundle links) is not what `share-for-feedback.ts:40-45` posts | doc vs tool | Make the doc match the tool; file a separate decision if the tool should grow fields | 4 |
| 15 | `notion.md:94-130` formatting guidance is inside `<!-- ide-only -->` — stripped from the bot bundle; the bot has zero guidance on what goes inside `notion_create.sections[].body` | `notion.md`, `bundle-harness.mjs:46-49` | Bot-facing contract in the new matrix; IDE/MCP mechanics stay ide-only | 4 |
| 16 | No per-destination content convention exists as one document; `writing-style.md:14` routes to three surfaces only; email, blueprint cell copy, UI copy, proposal preview have none | `docs/conventions/` | New `docs/conventions/content-surfaces.md` (bundled); `writing-style.md` is voice only and points here | 4 |
| 17 | `layer` still used where `lane` is meant — two citation formats in the bundle (`supabase.md:21` `layer × step` vs `blueprint-navigation.md:225` `lane × step`) | `terminology.md:66-67`, `supabase.md:7,13,21`, `AGENTS.md:15,154` | Sweep | 4 |
| 18 | Blueprint cell-copy convention exists in `uno-blueprint/docs/design/content-voice.md:69-140` and nothing in this repo points at it; it uses `Layer` and a `Planned — ` content prefix that `AGENT.md:96` says is retired | cross-repo | Pointer from `supabase.md` / `blueprint-navigation.md` (ide-only); reconcile in the other repo | 4 |
| 19 | UI-copy convention is `Status: DRAFT` since April, duplicated in `preferences.md:44-48`, absent from the progressive-loading table | `docs/context/design-system/foundations/content-voice.md` | Promote or retire; one decision | 4 |
| 20 | Escaping: `slack.md:57` says escape `& < >`; no code does it; only an *un*-escaper exists (`read-source.ts:40`) | prompt vs code | The Slack converter owns escaping outside code/links; the doc stops asking the model to | 1 |

---

## What it looks like when this is done

The model writes this, in a DM, after a blueprint lookup:

```markdown
**Three touchpoints** carry the reconfirmation, not one:

- **Tutor** · *Session prep* — sends the reminder 24h out
- **Ops** · *Day-of* — calls if unconfirmed by 10:00
- **System** · *Day-of* — auto-cancels at 14:00

Source: [Reconfirmation flow](https://…/blueprint?cell=…)
```

It streams to Slack as-is and renders with bold, real bullets, and a link —
because `markdown_text` is Markdown. If the stream fails, the same text goes
through `toSlackMrkdwn` once and posts as blocks, rendering the same.

The same prose, written into a Notion decision body, arrives as a bold run, a
bulleted list, and a link annotation — because `markdownToNotionBlocks` ran.
In an email it arrives as `• Tutor · Session prep — …` and
`Reconfirmation flow (https://…)` — because `markdownToPlainText` ran.

The model was never told about any of this. It wrote Markdown.

---

## Part 1 — Slack: one converter, at the egress, on every path

**Decision: the model writes standard Markdown.** The mrkdwn mandate goes from
`AGENT.md:140` and from the draft judge (`draft-judge.ts:68-77` stops failing
`**bold**` / `#` / `[l](u)` and stops rewriting them). `slack.md`'s mrkdwn
table moves into the converter's fixture test, where it is checked rather than
remembered.

**Why this direction and not mrkdwn → Markdown on the stream path.** Slack
built `markdown_text` for agents precisely so they could stop writing mrkdwn;
the model's native dialect is Markdown; the "bites hourly" line in `AGENT.md`
is the prompt admitting the mandate does not hold under load. Teaching the bot
to un-learn Markdown and then re-convert it back is two converters in opposite
directions for the privilege of fighting the model.

**Verification first, before any code moves (one live probe):** post a
threaded test reply via `chat.appendStream` containing `*single*`, `**double**`,
`- item`, `• item`, `<https://x|label>`, `[label](https://x)`, a fenced block
with a language tag, and `a < b && c > d`. Record which render. The plan
assumes the documented contract (`**double**` bold, `- item` list, `[l](u)`
link); if Slack's parser turns out lenient on `*single*` too, nothing changes
except the urgency.

### Changes

- `src/slack/api.ts` `postMessage`: convert **every** text field — `text` and
  each `blocks[].text.text` where `type === 'mrkdwn'` — through
  `toSlackMrkdwn`. Delete the stale "blocks are Worker-built and already
  valid" comment (`:135`). The stream path (`appendStream`) sends Markdown
  unchanged.
- `src/slack/delivery.ts`: `capText` and `textSections` become one
  fence-aware splitter in `src/slack/split.ts` — split on blank lines, never
  inside an open ``` fence or an open `**`; when a fence must be cut, close it
  at the cut and reopen it in the next chunk; run the splitter on the
  **converted** text for the blocks path (so the fence regex sees balanced
  input).
- `src/slack/mrkdwn.ts`: protect inline code spans, convert `~~x~~` → `~x~`,
  handle `**` across a line break and `***x***` → `*_x_*`, strip the fence
  language tag, drop the `!` on images (`![a](u)` → `<u|a>`), keep the table
  header row as a bold first bullet, escape `& < >` outside code spans and
  links (and `&` inside link URLs → `&amp;`), and tidy the citation-strip
  leading space.
- `src/slack/proposal-render.ts:178`: no change needed once `postMessage`
  converts every section.
- `AGENT.md`: line 140 becomes *"Write standard Markdown. The Worker converts
  for each destination — see `docs/conventions/content-surfaces.md`."* Line
  137's "code fenced with language tags" stays (it is Markdown); line 115's
  literal `•` instruction goes (write `- `; the converter makes the bullet).
- `draft-judge.ts`: remove the three mrkdwn rules; keep the substance rules.

---

## Part 2 — Notion: parse the Markdown into blocks

`src/integrations/notion.ts:68-94` splits on blank lines into `paragraph`
blocks. Replace with `markdownToNotionBlocks(md)` in
`src/integrations/notion-blocks.ts`:

| Markdown | Notion block / annotation |
| --- | --- |
| paragraph | `paragraph` with rich_text runs |
| `- ` / `* ` | `bulleted_list_item` (nested by indent, one level) |
| `1. ` | `numbered_list_item` |
| `# ` / `## ` / `### ` | `heading_3` (sections already own `heading_2`) |
| `> ` | `quote` |
| ``` fence | `code` with `language` |
| `**x**` / `_x_` / `` `x` `` / `~~x~~` | `bold` / `italic` / `code` / `strikethrough` annotations |
| `[l](u)` | rich_text with `href` |
| `- [ ]` / `- [x]` | `to_do` (already used for acceptance criteria — reuse) |

Keep `MAX_RICH_TEXT = 1900` per run. **Add the 100-block budget:** `notionCreate`
and `notionUpdate` chunk `children` into batches of ≤100 and append in
sequence (`PATCH /blocks/{id}/children` per batch). Section `body` in
`tool-definitions.json` gets one sentence: *"Markdown; bullets, bold, links and
headings render."*

---

## Part 3 — Email: strip to plain text, on purpose

`gmail.ts:74-84` sends `text/plain`. Keep that — plain text email is the
correct default for the recipients this bot writes to — and add
`markdownToPlainText(md)`: bullets → `• `, numbered lists kept, `**x**` → `x`,
`[l](u)` → `l (u)`, headings → the line in caps followed by a blank line,
fences → indented. `email_send.body` in `tool-definitions.json`: *"Markdown;
rendered as plain text — links become `label (url)`."*

---

## Part 4 — The convention: one matrix, bundled

New `docs/conventions/content-surfaces.md`, added to `SKILL_PATHS` in
`scripts/bundle-harness.mjs` (the coverage guard at `:74-92` fails the build
otherwise). It owns **shape**; `writing-style.md` keeps **voice** and its
line-14 router points here; `slack.md` and `notion.md` keep estate mechanics
(channel IDs, gates, DB schemas) and each gets a one-line pointer where the
formatting section used to be.

```
# Content surfaces — what the model writes, and what the code does to it

## 0 · The rule
Write standard Markdown. Every destination below converts it. Do not write
Slack mrkdwn, Notion block syntax, or HTML.

## 1 · The matrix
Destination                    | Converter (file)              | Cap        | Links        | Mentions
Slack reply — stream           | none (markdown_text)          | MAX_POST   | [l](u)       | <@U…>
Slack reply — blocks fallback  | toSlackMrkdwn (api.ts)        | SECTION    | [l](u)       | <@U…>
Slack proposal preview         | toSlackMrkdwn (api.ts)        | —          | [l](u)       | —
Slack share-out                | fixed template (share-for-feedback.ts) | — | bare url     | <@U…>
Notion body — bot tools        | markdownToNotionBlocks        | 1900/run, 100 blk/req | [l](u) | none
Notion page — IDE / MCP        | Notion enhanced markdown (ide-only) | —    | page mention | <mention-user>
Email                          | markdownToPlainText           | —          | l (u)        | plain name
Blueprint cell                 | writers/blueprint (ide-only)  | one sentence | links[]    | —
UI copy                        | (ide-only; content-voice.md)  | —          | —            | —

## 2 · Per destination — five lines each: what you write · what the reader sees · the cap · one example · three anti-patterns
## 3 · Length — one constant
## 4 · Mentions and escaping — who owns it (the converter), so the model never escapes by hand
```

Sweeps in the same change: `layer` → `lane` in `terminology.md:66-67`,
`supabase.md:7,13,21`, `AGENTS.md:15,154`; `slack.md:20-27` share-out template
rewritten to what `share-for-feedback.ts` posts; `slack.md:59` and
`AGENT.md:137` length rule replaced by a reference to `MAX_POST_CHARS`;
pointer to `uno-blueprint/docs/design/content-voice.md § Blueprint cell
content` from `blueprint-navigation.md` (ide-only); decision recorded on
`foundations/content-voice.md` (promote into the progressive-loading table, or
delete the DRAFT).

---

## Part 5 — Tests

- `tsconfig.test.json`: add `src/slack/mrkdwn.ts`, `src/slack/split.ts`,
  `src/integrations/notion-blocks.ts`, `src/integrations/plain-text.ts`.
- `tests/mrkdwn.test.ts`: the 24-row probe table from the audit as fixtures,
  including idempotence on already-valid mrkdwn.
- `tests/split.test.ts`: a fence straddling the cut; bold straddling the cut;
  a 9000-char body yields chunks that each parse as balanced.
- `tests/notion-blocks.test.ts`: each row of the Part 2 table; a 250-block body
  yields three batches.
- `tests/plain-text.test.ts`: links, bullets, emphasis.
- `tests/harness-bundle.test.ts` (exists as `check:harness-bundle`): asserts
  `content-surfaces.md` is in the bundle and `slack.md` no longer contains the
  mrkdwn table.

---

## Acceptance criteria

- [ ] A streamed reply containing `**bold**`, `- item`, `[l](u)` and a fenced
      block renders correctly in Slack (screenshot in the PR)
- [ ] The same reply, with streaming forced off, renders identically via blocks
- [ ] A proposal card whose preview contains `**` renders bold
- [ ] A 9000-char reply with a fence at char 3850 renders as two balanced chunks
- [ ] A Notion decision body with bullets, bold and a link renders as list
      items, a bold run and a link annotation
- [ ] A 250-block Notion create succeeds
- [ ] An email body with a `[l](u)` link arrives as `l (u)`
- [ ] `AGENT.md`, `draft-judge.ts` and `slack.md` contain no instruction to
      write mrkdwn
- [ ] One length constant, cited by name from `AGENT.md` and
      `content-surfaces.md`
- [ ] `grep -rn '\blayer\b' docs/conventions AGENTS.md` returns only the
      "pre-rename spelling" note
- [ ] `npm test` compiles and runs the five new test files

## Risks

| Risk | Mitigation |
| --- | --- |
| `markdown_text` renders differently from the docs (e.g. lenient on `*single*`) | The live probe is step one; the plan's direction survives either result |
| Old threads carry mrkdwn-era replies; nothing changes for them | They are already rendered; no rewrite |
| The Notion block parser mis-nests a list | One level of nesting only, by design; deeper indents flatten |
| Removing the judge's formatting rules lets a `#` heading through | It renders as a heading now — that is the point |
| The convention doc grows a style guide again | Section 2 is capped at five lines per destination; voice stays in `writing-style.md` |

## Sources

- Formatting audit, 2026-08-22 — probe script and 24-row table;
  `src/slack/{mrkdwn,delivery,api,proposal-render}.ts`; `wrangler.toml:53`
- Conventions audit, 2026-08-22 — inventory of `docs/conventions/` (12 files),
  `scripts/bundle-harness.mjs` loading mechanism, `src/generated/harness.ts`
  verification, `src/integrations/{notion,gmail}.ts`
- Slack: `chat.appendStream` and `chat.postMessage` references (`markdown_text`:
  "Accepts message text formatted in markdown"), "Formatting message text"
- `uno-blueprint/docs/design/content-voice.md:69-140` — the blueprint cell
  copy convention this repo never pointed at

---

## Closing the last two rows — 2026-08-22

**Row 16 — `content-surfaces.md`: decided NOT to create it.**

The audit proposed one canonical per-destination file. By the time the work
landed, the matrix it would have contained already existed in
`slack.md` § *The same Markdown goes everywhere else too* (what converts where,
and the one construct that differs), with the per-destination contracts beside
the surfaces they govern — `notion.md` § *Writing a body*, and the email row in
that same matrix.

Creating a fourth file would have duplicated all three and reproduced the exact
defect this plan has spent the day removing: **two artefacts describing one
thing, with nothing reading both.** The share-out template drifted from its tool
for months that way; `slack.md` claimed Block Kit was unwired for two weeks that
way; the manifest header sent me hunting a non-existent task that way.

What was genuinely missing was **discoverability**, not consolidation — the
router in `writing-style.md:14` named three surfaces and never mentioned the
dialect rule. Fixed in place: the router now names UI copy as a fourth surface
and states the one formatting rule, pointing at the matrix rather than
restating it.

**Row 19 — the UI-copy doc: promoted, not retired.**

`docs/context/design-system/foundations/content-voice.md` carried
*"Status: DRAFT — needs design leadership iteration before finalizing"* since
April, while `docs/knowledge/preferences.md` pointed at it for "full rules" on
capitalization. One doc told readers to rely on it; the file told them not to.
Both could not be right, and the version that had been true in practice for
four months is that people rely on it.

So the banner goes and the file says what it actually is: *descriptive*
rationale for product tone and UI copy, with `writing-style.md` normative and
winning on conflict — which its own header already said. It is now in AGENTS.md's
progressive-loading table, so it is reachable when someone is actually writing
a label or an error message.

This is a status correction, not a sign-off. If design leadership wants to
re-review the content, that is a separate act; what could not stand was a
banner that had been contradicted by usage since April.
