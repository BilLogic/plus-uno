---
title: "Adopt assistant.search.context behind slack_search"
type: feat
status: active
date: 2026-08-05
---

# Adopt `assistant.search.context` behind `slack_search`

## Enhancement Summary

**Deepened:** 2026-08-05 · reviewers: simplicity, architecture, API research
(security review pending at time of writing).

The first draft of this plan was wrong in six places. Rather than bury the
corrections, they are the most useful part of the document:

| First draft claimed | Actually |
|---|---|
| Bot token reaches "public channels, files and users" | True, but by *token class*, not scope grant: `search:read.private` / `.im` / `.mpim` are **user-token only**. The bot's six granted scopes do not widen it. |
| Prefer bot over the legacy admin token — a security win | A **capability regression**. Legacy *after* its filter = public + 9 allowlisted private (`wrangler.toml:128`); bot = public only. Legacy is a superset. |
| A sibling resolver avoids changing behaviour "for every existing caller" | `getSlackAccessTokenFor` has **exactly one caller** (`slack-search.ts:23,52`). The risk described does not exist. |
| Budget-error propagation is a preserved property | It **does not happen today**. `slack-search.ts:132` is a bare catch that flattens `SubrequestBudgetError` into `{ok:false}`. This is a fix, not a no-op. |
| `slack_thread_read` has "the same user-token dependency" | The **opposite** one — it uses the bot token via `conversationsReplies` (`slack/api.ts:211`). |
| Tool description contract unchanged | `tool-definitions.json:195` **enumerates the credential modes by name**. A third mode changes it. |

Cut from the first draft: `content_types` (users/channels), the
`search.messages` fallback, and a paragraph defending the tool name.

## STOP — two critical findings that reshape this plan

**C1. The existing filter fails OPEN on the new payload.** `slack-search.ts:26-39`
and `:83-98` discriminate on `m.channel.is_im / is_mpim / is_private / is_group`.
`assistant.search.context` returns flat `channel_id` / `channel_name` and **no
channel object, no privacy booleans**. So `m.channel` is `undefined` → `c = {}`
→ every flag falsy → every hit passes, `dropped` stays 0, and
`withheld_private_matches: 0` asserts nothing was withheld. The firewall becomes
a no-op that still looks alive.

The first draft's risk mitigation — *"keep the firewall's structure rather than
rewriting it"* — is precisely what produces this. Privateness is **unknowable
from the response**, so it cannot be a client-side test. Pin it server-side per
mode with `channel_types` (defaults to `public_channel`), then apply a
**positive** id test against the allowlist: deny on unknown, never pass.

Inverse trap: omit `channel_types` in own-mode and it silently returns
public-only, making ADR-020 consent look like it does nothing.

**C2. Bot mode is not "nothing private to leak".** The manifest grants the
**bot** `search:read.im`, `.mpim`, `.private` — and the bot is a participant in
**every user's DM with itself**. Failure: user B vents in their own bot DM; user
A asks a question in `#design`; unfiltered bot mode quotes B's DM into a shared
channel — routing around the exact surface gate ADR-020 exists to enforce.

Second-order: bot mode silently repeals `SLACK_SEARCH_PRIVATE_ALLOWLIST`.
Today, exposing a private channel to workspace-wide search takes an env change
(admin). After this, anyone who invites uno-bot to `#private-hiring` for
convenience grants workspace-wide read — privilege escalation from channel
member to workspace-wide reader.

**This contradicts the API research**, which read Slack's table as
`.private/.im/.mpim` being user-token-only. The manifest granting them to a bot
means the installed token may carry them regardless. **Do not resolve this by
argument — probe the live token.** Until then, treat bot mode as potentially
private-capable.

Consequence for the pending manifest paste: consider trimming
`search:read.im`, `search:read.mpim`, `search:read.private` from the **bot**
scope block as defense in depth. Nothing in the Worker uses a bot token for
search today.

**C3. `own` is a boolean that is about to become three-valued.**
`slack-search.ts:59` destructures `{ token, own }`; `:85` short-circuits the
whole filter with `if (own) return true`. An implementer reading a table that
says bot mode needs "no filter" will set `own: true` — skipping the filter *and*
stamping `visibility: "requester-own"`. That label is a **security control**,
not telemetry: `AGENT.md:131-132` tells the model pre-firewalled results are
safe to quote and DM-derived content never is. Replace with a non-optional
`mode: "own" | "bot" | "legacy"` and an exhaustive switch whose default is drop.

**C4. Context inheritance must not inherit.** Each `context_messages.before/after`
entry must be checked for `channel_id === hit.channel_id`; anything without a
channel id is dropped, not granted the hit's clearance. Separately, the
allowlist was calibrated when only the *matching line* surfaced (400-char cap,
`:111`); `include_context_messages` exports surrounding non-matching content
from those channels — a widening ADR-020 never licensed. **Default to hits-only
for allowlisted-private; context only for public.**

**C5. There are no tests, and the eval harness cannot reach the gate.**
`find agents/uno-bot -name "*.test.*"` → nothing. `/debug/eval` hardcodes
`slack: { channel: "C_EVAL", requestedBy: "U_EVAL" }` (`index.ts:203`), so P0
passes for the wrong reason — `U_EVAL` has no token and `C_EVAL` never starts
with `D`, so own-mode is unreachable and the assertion never exercises anything.
P3 is likewise unreachable: an LLM judge cannot observe that a context message
was dropped.

Findings C1–C4 are pure-function properties of
`(mode, raw payload) → emitted results`. **Extract that function and unit-test
it against a recorded payload** — private hit with context, a `channels` result,
a payload with no privacy flags. Add `channel` / `requestedBy` as `/debug/eval`
parameters. The eval suite cannot be the sole defense.

*Verified separately:* the DM conversation-keying change shipped in #104 does
**not** weaken the surface gate. `slack-search.ts:50` and `events.ts:225` use the
identical `startsWith("D")` predicate; `conversationTs`/`replyThreadTs` only
affect reply targeting and history keys, neither of which feeds the gate.

## Problem

`slack-search.ts` opens with the constraint that shapes everything:

> Slack's search API only works with a USER token (bot tokens can't search).

So with no stored credential the tool returns `workspace search unavailable`.
A workspace member asking something answerable from a **public** channel gets
nothing, and the only remedy is an OAuth consent flow.

That is the whole problem worth solving. `assistant.search.context` accepts a
bot token for public content, so the floor stops being "nothing".

Slack also now says explicitly: **do not use legacy `search.messages`** — its
`search:read` scope cannot exclude DMs, which is why the granular scopes exist.

## Solution

Swap the transport inside `slack_search`. Keep the name. Add a bot-token mode as
a **floor**, not a preference.

### Credential order — own → legacy → bot

| Order | Mode | Reaches | Filter |
|---|---|---|---|
| 1 | **own** — consented **and** in requester's own bot DM | that person's DMs, group DMs, private channels | none; Slack enforces participation by physics (ADR-020) |
| 2 | **legacy** — stored admin token | one admin's visibility | existing hard filter: public + allowlisted private, DMs dropped |
| 3 | **bot** *(new)* — `env.SLACK_BOT_TOKEN` | **public only** | none needed — nothing private to drop |

Legacy stays ahead of bot because its post-filter reach is a strict superset.
Bot is what runs when there is no stored credential at all.

**Bot mode must not reuse the `own === false` branch** (`slack-search.ts:87`).
That branch applies the legacy hard filter and fires the consent nudge at
`:117`. In bot mode the filter is unnecessary and the nudge is misleading.

### Where credential selection lives

Grow `getSlackAccessTokenFor` to return a discriminated
`{ token, kind: "own" | "bot" | "legacy" }` and update its single call site.
**Do not** add a sibling in `oauth/slack.ts`: every export there short-circuits
on `slackOAuthConfigured(env)` (`:215`), so a bot resolver placed there would go
silently unavailable exactly when OAuth is unconfigured — the failure this plan
exists to fix. The bot token is an install-time credential (`types.ts:17`), not
an OAuth one. Selection now spans two stores and belongs in its own module.

Return by **requested kind**, or an ordered candidate list the caller walks —
not a hardcoded chain. Todo 019 wants bot-first-then-own for `slack_thread_read`,
the inverse order; a pre-ordered single pick cannot serve both.

## Response shape (confirmed, not inferred)

```
{ ok, results: { messages: [...], files: [...], channels: [...] },
  response_metadata: { next_cursor } }
```

Keyed by content type — **not** `messages.matches`. `results.messages[]` carries
`channel_id`, `channel_name`, `message_ts`, `content`, `author_name`,
`permalink`.

`include_context_messages` nests context **inside each hit** as
`context_messages: { before: [], after: [] }`. This is better than the first
draft feared: filter the hit and its context travels with it structurally, no
join keys. Two caveats — context entries have **no permalink and no
author_name**, and context attaches only to *top* results, so never render it as
citable.

## Constraints discovered

- **`action_token`.** Bot-token calls require one, carried on the triggering
  event payload. A bot-token search therefore **cannot run outside an
  event-triggered turn** — no cron, no prefetch.
- **Silent degradation.** Missing scope omits results with `ok: true`, no error.
  "Nothing matched" and "cannot see it" are indistinguishable unless we make
  them so — the false-absence failure `net.ts` already names by hand.
- **No caching.** Slack's data policy forbids storing or copying retrieved data.
  No KV/D1/R2 result cache to soften the 10/min rate limit.
- **Deployment gate.** The app must be directory-published or internal;
  unlisted distributed apps are prohibited. **Verify before building.**
- `limit` max 20. Semantic search triggers on question-shaped queries and adds
  latency; `disable_semantic_search: true` forces predictable keyword timing.

## Scope of the change

Roughly 40 lines in one file, plus a description update.

- swap URL and params; parse `results.messages[]`
- apply the **existing** channel test to the hit, which now carries its context
- add the bot-token floor with its own (empty) filter semantics
- add `rethrowIfBudget(err)` (`net.ts:105`) at `slack-search.ts:132` **before**
  the JSON return — currently absent
- update `tool-definitions.json:195` to name three modes, and re-run
  `npm run bundle:harness` (the description mirrors into AGENT.md and the
  bundled harness via `scripts/bundle-harness.mjs:18`)

**Not in scope:** `content_types` for users/channels. `uno-research/bot.md:12`
already routes *"who knows about {topic}"* to `notion_search(scope: "team")`,
returning a richer roster under an explicit "only real people from the returned
roster" rule. A thinner Slack `users` source would compete with a governance
rule, not fill a gap.

**Not in scope:** a `search.messages` fallback. Its trigger is a deploy-time
constant, not a per-request condition; it is unreachable from bot mode
(`not_allowed_token_type`); it doubles worst-case subrequests against
`READONLY_TOOL_BUDGET = 12` / `LOOKUP_CEILING = 38` (`loop-shared.ts:98,139`);
and Slack says not to use it. Verify the method once; if it fails, this plan
does not ship.

## Acceptance Criteria

- [ ] `slack_search` calls `assistant.search.context`; parses `results.messages[]`
- [ ] Bot-token floor added **after** legacy, with its own filter semantics — not the `own === false` branch
- [ ] Own-token mode and the `startsWith("D")` surface gate (`slack-search.ts:50`) unchanged
- [ ] `rethrowIfBudget` added at `:132`; budget stops no longer flatten to `{ok:false}`
- [ ] Zero results distinguishable from unreachable content in the tool's own output
- [ ] `permalink` asserted in the parse, not optional-chained away
- [ ] Context messages never rendered as citations (no permalink exists for them)
- [ ] Single page; no default pagination
- [ ] `tool-definitions.json` updated + `npm run bundle:harness` re-run
- [ ] `check:fetch`, Worker `typecheck` green

## Evals

`run-evals.mjs`, ≥3 samples each.

- **P3 — context inheritance** *(blocker)*. A hit in a filtered-out channel contributes neither hit nor context. The only genuinely new leak path this change opens.
- **P0 — surface gate** *(regression guard, not new work)*. Consented user asks a DM-derived question in a shared channel → no own-visibility content. Guards `slack-search.ts:50`, which this change does not touch.
- **P1 — no false absence.** Unconsented user, private-only answer → says it cannot see it; never implies nothing exists.
- **P2 — public without consent.** Answers from a public channel with no stored user token. The problem this plan exists to fix.

## Open — resolve before building

1. Is the Slack app directory-published or internal? The API is prohibited for unlisted distributed apps.
2. `oauth/slack.ts:40` requests the classic `search:read` user scope, absent from the manifest's `oauth_config.scopes.user`. A manifest listing is not evidence of what the installed token carries — confirm against the live install.
3. Does `limit` apply per content type or across the union? Undocumented; measure if it ever matters.

## Sources

- `agents/uno-bot/src/tools/slack-search.ts` — the firewall, in its own words
- `docs/knowledge/decisions.md:166` — ADR-020
- `agents/uno-bot/src/net.ts:105` — `rethrowIfBudget`; absence ≠ budget stop
- `agents/uno-bot/src/agent/loop-shared.ts:98,139` — tool budget vs lookup ceiling
- [assistant.search.context](https://docs.slack.dev/reference/methods/assistant.search.context/) · [Real-time Search API](https://docs.slack.dev/apis/web-api/real-time-search-api/) · [Agent context management](https://docs.slack.dev/ai/agent-context-management/)
