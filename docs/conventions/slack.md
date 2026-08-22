# Slack Conventions

<!-- canonical per ADR-017 (docs/knowledge/decisions.md); supersedes the Notion 🧭 Flow 3/5 docs + 🧩 Templates #4 for conventions. Distilled 2026-07-07 · applied by agents/uno-bot. -->

## Channels

| Channel | ID | Use |
|---|---|---|
| #plus-design | `C03FC8AS69K` | review requests, design-team coordination |
| #plus-design-feedback | `C074QG2V7DJ` | share-out bundles + feedback threads |
| #uno-bot | `C0ARJ2A3A69` | Figma-sync notifications (docs saying "#figma-sync" mean this channel) |

Pillar → channel map (group announcements; **all private — uno-bot must be invited before posting/@here**):
`Universal` → #plus-universal `C072E8SFLKV` · `Admin` → #plus-admin `C089A3E9CCW` · `Toolkit` → #plus-toolkit `C08925VDFF1` · `Training` → #plus-training `C07L5RZV6DR` · `Marketing` → #plus-marketing `C052BG9NE86`. Tutoring + Help Center: unmapped — flag at retro.

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

1. **Proposal-confirmation gate** (uno-bot side-effect proposals): ⚠️ card with ✅ Approve / ⛔ Cancel buttons; a ✅ (or 👍) / ⛔ (or ❌) reaction on the card, or that emoji typed alone, does the same; a typed reply in words goes to the model, which reads it in context. Anyone in the thread may confirm or cancel (the requester lock was removed 2026-07-14), 60-min expiry (`PROPOSAL_TTL_MS` in `agents/uno-bot/src/thread-state.ts` is the source of truth).
2. **Reviewer-verdict gate** (Flow 5 maintenance review, routed reviewers in #plus-design): ✅ approve · 🔁 request changes · ❌ reject. Never auto-merge; 🔁 loops the proposal with changes.

Decisions reached in threads are written to **Decisions DB** (row with **Roadmap Card** = the project + **Evidence** = Slack permalink) **before** the thread is considered resolved. Do not append to obsolete Decision Log subpages.

**Reactions outside the gates are free-form — and they're the bot's wit channel.** uno-bot may react with any workspace emoji — standard or custom — to acknowledge, celebrate, or signal state (e.g. 🛠 working, 🎉 shipped, or a fitting custom emoji; 👀/⏳/✅/⚠️ are the Worker's automatic signals — the bot doesn't duplicate them). Replies are word-budgeted; reactions aren't — content-matched and specific beats a reflexive 👍 (register details: `agents/uno-bot/AGENT.md § Slack etiquette`). Only the gate semantics above are reserved: ✅ (and 👍) and ⛔ (and ❌) carry meaning on proposal cards, and ✅/🔁/❌ on review verdicts, so the bot never reacts with those on a pending proposal itself.

## Message formatting — write standard Markdown

**Write standard Markdown.** `**bold**`, `_italic_`, `- bullets`, `1. numbered`, `[label](url)`, `> quote`, `` `code` ``, fenced blocks with a language tag. Slack's agent message field (`markdown_text`) renders it directly, and the Worker converts on the paths that need a different form. *(Rule changed 2026-08-22 — see the note at the end of this section.)*

**Two things Markdown cannot express, and one it can't render:**

| Thing | Write | Why |
|---|---|---|
| A person | `<@U01ABCDEF>` | the **user ID**, never `@handle` — a handle is plain text and pings nobody |
| A channel | `<#C0ARJ2A3A69>` | the channel **ID** in angle brackets |
| A broadcast | `<!here>` / `<!channel>` | needs installer permission, reads as noise — use almost never |
| **A table** | **don't** | see below |

### No tables. Ever. In any format.

**Slack renders no table** — not in mrkdwn, not in Block Kit, not in `markdown_text`. A `| a | b |` table ships to the reader as literal pipes and dashes, and it is the single most visible way a reply comes out wrong.

Write one of these instead:

```
- Tutor · Session prep — sends the reminder 24h out
- Ops · Day-of — calls if unconfirmed by 10:00
```

or, when each row needs more than a line, a short `**Bold label**` paragraph per row. Three nets enforce this, because it keeps happening: the rule above, a hard gate in the draft judge, and `stripMarkdownTables` in the Worker's renderer, which turns any surviving table into `•` lines before the message ships.

**The tables in this file are not a counter-example.** Convention docs are reference material for you to read; a Slack message is output for a person to read. Format your replies by the rule, not by the document.

### What the Worker does on each path

| Path | What is sent | Converted by |
|---|---|---|
| Streamed reply (every ordinary answer) | `markdown_text` — your Markdown, as written | nothing; tables already stripped in `renderDeliveredBody` |
| Blocks fallback (stream failed) | `section` blocks, which are mrkdwn-only | `toSlackMrkdwn` in `textSections` |
| `chat.postMessage` `text` | mrkdwn | `toSlackMrkdwn` in `postMessage` |
| Proposal card | mrkdwn sections + ✅/⛔ buttons | `toSlackMrkdwn` via `textSections` |

Conversion covers `**bold**` → `*bold*`, `- item` → `• item`, `## Heading` → `*Heading*`, `[label](url)` → `<url|label>`, tables → `•` lines, and strips the fence language tag (mrkdwn code blocks take no info string).

**Don't hand-escape `&` `<` `>`.** Nothing escapes them and nothing should: on the Markdown path an `&amp;` would render as literal `&amp;`. Raw angle brackets in prose are fine. The one case to watch is text that *looks* like a Slack token — `<@`, `<#`, `<http` — which Slack will try to resolve; put that in backticks.

Block Kit **is** wired (`delivery.ts` posts `section` blocks with a `text` fallback; proposal cards carry buttons via `interactive.ts`) — the claim that it wasn't stood in this file until 2026-08-22. `reply_broadcast` exists on `PostMessageInput` but is used only by a test route.

### The same Markdown goes everywhere else too

One dialect, three destinations — you write Markdown, the Worker renders it per surface:

| Destination | Renderer | Notes |
|---|---|---|
| Slack | `slack/mrkdwn.ts` | this file — **no tables** |
| Notion (`notion_create`, `notion_update`) | `integrations/notion-blocks.ts` | real blocks + annotations — `notion.md` § Writing a body |
| Email (`email_send`) | `integrations/email-render.ts` | sent as plain text **and** HTML |

**The no-tables rule is global, not a Slack quirk.** Notion's API takes no Markdown table and an email body renders one as literal pipes, so all three renderers degrade a table the same way: one bullet per row, `**Column:** value · **Column:** value`. Useful as a net; still worse than writing the bullets yourself.

<details>
<summary>Why this changed on 2026-08-22</summary>

Until then this file mandated Slack **mrkdwn** (`*single*` bold, literal `•`, `<url|label>`), the Worker's converter assumed Markdown *in* and mrkdwn *out*, and the live streaming path sent the body to Slack's `markdown_text` field — which is standard Markdown. Three layers, three assumed formats. A model that obeyed the prompt perfectly rendered *worst* (in Markdown, `*bold*` is italic and `<url|label>` is nothing); a model that "slipped" into `**bold**` rendered correctly. The bot was fighting its own instructions. Fixed by picking the dialect the model writes best and Slack's agent field takes natively, and converting in code wherever something else is needed.
</details>

## Threading & mentions

- **Reply in-thread by default** (`thread_ts` = the *parent* message's ts). Keeps the channel clean.
- A fresh top-level post is only for cross-channel announcements (e.g. a review fan-out to #plus-design) — a real new message, not a reply.
- **Mention only who must act** (`<@U…>`). Never spray `<!here>` / `<!channel>` / `<!everyone>` — they need installer permission and read as noise. Batch related updates into one message, not five.

## Writing style (all Slack output)

Applies the house voice (`writing-style.md`) to chat; the bot's specific register lives in `agents/uno-bot/AGENT.md § Identity & voice`.

- **Lead with the answer / outcome** — no preamble, no restating the ask back.
- **Glanceable, not paragraphs.** `**Bold label**` lines + `-` bullets for structure; don't over-format.
- **Summarize, link the artifact** (`[label](url)`) — don't transcribe steps.
- **Human, contraction-y, low ceremony.** Brief and clear over formal; no jokes that don't serve the task.
- **Errors are actionable** — name 2–3 next steps (retry / adjust / escalate), never a bare "something went wrong."
- **Confirm before real-world side-effects** (the proposal gate) — but gate only genuinely risky ops; no confirmation fatigue.
- **On behalf of** — acting for a person, say so, and surface what was done + a link.
- **One length rule, and it lives here.** Past ~1,500 chars of prose (lists are exempt — they stay scannable at any length), lead with a 2–3 bullet summary and put the detail after it. The hard ceiling is **3,900 characters** — `MAX_POST_CHARS` in `agents/uno-bot/src/slack/delivery.ts`, which truncates with a note past it. Beyond that, thread the detail or append it to the relevant Notion card and link it. There is no Gist tool. *(Every other number that used to float around — "~4,000" here, ">3000" in `AGENT.md` — now points at this one.)*

<!-- Grounded in Slack's own docs (fetched 2026-07-08): Formatting message text · Block Kit · chat.postMessage · Agent design · App design guidelines. -->

