# Slack Conventions

<!--
status: canonical — this file IS the convention (ADR-017)
distilled: 2026-07-07 from the Notion 🧭 Flow 3/5 docs + 🧩 Templates #4 (now superseded for conventions)
applied by: agents/uno-bot (the embodiment IS the Slack actor — no separate writer)
-->

## Channels

| Channel | ID | Use |
|---|---|---|
| #plus-design | `C03FC8AS69K` | review requests, design-team coordination |
| #plus-design-feedback | `C074QG2V7DJ` | share-out bundles + feedback threads |
| #uno-bot | `C0ARJ2A3A69` | Figma-sync notifications (docs saying "#figma-sync" mean this channel) |

Pillar → channel map (group announcements; **all private — uno-bot must be invited before posting/@here**):
`Universal` → #plus-universal `C072E8SFLKV` · `Admin` → #plus-admin `C089A3E9CCW` · `Toolkit` → #plus-toolkit `C08925VDFF1` · `Training` → #plus-training `C07L5RZV6DR` · `Marketing` → #plus-marketing `C052BG9NE86`. Tutoring + Help Center: unmapped — flag at retro.

## Share-out post (Flow 3 feedback rail — bundle completeness is a hard gate)

```
📣 [Project] — [artifact] · fidelity: [low/mid/high] · round N
What this is: 1–2 sentences. · What changed since last round (round 2+).
🎯 Feedback wanted on: 1… 2… (max 3, stage-specific — never "thoughts?")
NOT looking for feedback on: [out of scope this round]
🔗 Loom · Live preview · Figma replica (required for prototypes) · Decision log
cc @reviewers — by [date]
```

## Two gates — never conflate

1. **Proposal-confirmation gate** (uno-bot side-effect proposals): ⚠️ message → ✅/❌ reaction, requester-only, 15-min expiry.
2. **Reviewer-verdict gate** (Flow 5 maintenance review, routed reviewers in #plus-design): ✅ approve · 🔁 request changes · ❌ reject. Never auto-merge; 🔁 loops the proposal with changes.

Decisions reached in threads are written to the project's Decision Log **before** the thread is considered resolved.

## Message formatting — Slack mrkdwn (NOT CommonMark)

Every message renders as Slack **mrkdwn** (the Worker's `postMessage` defaults `mrkdwn: true`). It is *not* standard Markdown — these are the differences that actually bite:

| Write | Renders | Gotcha vs Markdown |
|---|---|---|
| `*text*` | **bold** | single `*` — `**text**` does NOT bold |
| `_text_` | _italic_ | underscore, not `*` |
| `~text~` | ~~strike~~ | single `~` |
| `` `code` `` / ```` ```block``` ```` | code | fine; blocks take no language hint |
| `> quote` | quote | `>` at line start |
| `<url\|label>` | link | **pipe syntax** — Markdown's square-bracket-then-parens link form renders literally |
| `<@U…>` | @person | encode the **user ID**, never `@handle` |
| `<#C…>` | #channel | channel **ID** in angle brackets |
| `<!here>` / `<!channel>` | broadcast | special tokens — use almost never |
| `:emoji:` / 🎯 | emoji | both work |
| `•` + `\n` | bullet | **no list syntax** — literal `•` + newline (no `-` / `1.`) |
| — | heading | **no `#` headings** — use a `*Bold label*` line |
| `&` `<` `>` | literal | escape to `&amp;` `&lt;` `&gt;` in body text |

**House rule: plain mrkdwn only.** The Worker (`agents/uno-bot/src/slack/api.ts`) posts plain `text` — Block Kit and `reply_broadcast` are not wired. Don't prescribe buttons, modals, or block layouts the code can't send. (If we ever adopt block-based gates, `api.ts` must first set a top-level `text` fallback — screen readers and notifications read `text`, not blocks.)

## Threading & mentions

- **Reply in-thread by default** (`thread_ts` = the *parent* message's ts). Keeps the channel clean.
- A fresh top-level post is only for cross-channel announcements (e.g. a review fan-out to #plus-design) — a real new message, not a reply.
- **Mention only who must act** (`<@U…>`). Never spray `<!here>` / `<!channel>` / `<!everyone>` — they need installer permission and read as noise. Batch related updates into one message, not five.

## Writing style (all Slack output)

Applies the house voice (`writing-style.md`) to chat; the bot's specific register lives in `agents/uno-bot/AGENT.md § Voice & tone`.

- **Lead with the answer / outcome** — no preamble, no restating the ask back.
- **Glanceable, not paragraphs.** `*Bold label*` lines + `•` bullets for structure; don't over-format.
- **Summarize, link the artifact** (`<url|label>`) — don't transcribe steps.
- **Human, contraction-y, low ceremony.** Brief and clear over formal; no jokes that don't serve the task.
- **Errors are actionable** — name 2–3 next steps (retry / adjust / escalate), never a bare "something went wrong."
- **Confirm before real-world side-effects** (the proposal gate) — but gate only genuinely risky ops; no confirmation fatigue.
- **On behalf of** — acting for a person, say so, and surface what was done + a link.
- Keep a message under ~4,000 chars; longer → summary + a Gist/PR link.

<!-- Grounded in Slack's own docs (fetched 2026-07-08): Formatting message text · Block Kit · chat.postMessage · Agent design · App design guidelines. -->

