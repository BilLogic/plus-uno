---
title: "Shortcuts, mode commands, and a real deep tier"
type: feat
status: draft
date: 2026-08-07
source: parsnip-ai/mr-mule DESIGN-NOTES.md (shortcuts + routing scars)
---

# Shortcuts, modes, and tiers

Adapts mr-mule's shortcut set and routing scars to uno-bot. Its mechanics
transfer; its *domain* does not — mr-mule answers about repos and a context
store, uno-bot answers about the blueprint, Roadmap, and design system.

## The finding that blocks `/grind`

`routing.ts` declares three tiers. On the **Gemini lane** — production —
`gemini-agent.ts:159` collapses them:

```ts
thinkingLevel: (m.includes("flash-lite") || tier === "haiku" ? "minimal" : "high")
```

`sonnet` and `opus` are **identical**. The existing `"think hard"` escalation
(`routing.ts:31`) already does nothing on the lane we actually run. This was a
Claude-era design where tiers were model swaps; the Gemini port kept the tier
names and dropped the lever.

So **`/grind` cannot mean "escalate the tier" until a deep tier exists.**
Options, in order of preference:

1. **Model swap on the Gemini lane.** `GEMINI_FALLBACK_MODEL` is already
   `gemini-2.5-pro`. A deep tier means the capable model, not a dial.
   Needs its own config key — reusing the *fallback* model as the *deep* model
   conflates "the good one" with "the one we use when the good one fails".
2. **Verify whether `thinking_level` has a rung above `high`.** If it does, that
   is cheaper than a model swap. Unverified; do not assume.
3. **Do nothing and drop `/grind`.** Honest, if a deep tier is not worth the
   cost — better than a command that pretends.

**Whichever way: `tier=` and `why=` must be in the telemetry line before tuning
anything.** mr-mule's four cost leaks were all found in logs, not by reasoning.

## The routing scars worth copying

Each is a bug they already paid for.

**Trivial before retry, and the order is load-bearing.** `answeredBefore` is
true for every message after the first, and "thanks" is the most common thing
said after a *good* answer — so with retry checked first, every acknowledgement
buys a premium turn. **Assert the order in a test.**

**A retry needs a dissatisfaction signal, not merely a prior answer.** In a DM
every message after the first has an answer above it; keying on that alone puts
every turn from the second onward on the deep tier. The accepted trade: a silent
rephrase stays cheap, and `/grind` plus the "think harder" shortcut cover the
case explicitly.

**Context is gathered AFTER routing, never before.** A greeting in a 60-message
thread should not pull 60 messages and three sources to produce two words.
**uno-bot violates this today**: `handleUserMessage` loads history and assistant
context before `routeRequest`. Fixing it is a reordering, not a feature.

## The commands

Short names, no `uno-` prefix: these are system controls, not skills. The six
`/uno-*` commands invoke skills, where the namespace earns its keep.

| Command | Does | Feasibility |
|---|---|---|
| **`/stop`** | Abort the running turn | Designed: DO is keyed by conversation, loop checks a cancel flag per iteration (`gemini-agent.ts:307`). No registry needed. |
| **`/grind`** | Redo the last answer on the deep tier | **Blocked on a real deep tier** (above). |
| **`/chill`** | Force the cheap tier / brief answers for this conversation | Trivial once tiers are real — pin `haiku` in DO state until cleared. |
| **`/summon`** | Spin up a subagent | **Not what it means here.** A Worker cannot spawn subagents. The honest analogue is `repository_dispatch` to GitHub Actions, which this bot already does for `prototype_scaffold` and `component_implement`. `/summon` = dispatch a background job that reports back — same shape, different substrate. |

All four share the thread problem: **slash commands do not work in threads**
(playbook 4.2). So each needs either a shortcut twin or a Home-tab control, or
it is unreachable exactly where it is most wanted. That is not a footnote — it
is why mr-mule built the "think harder" shortcut alongside `/grind`.

## The shortcuts

mr-mule's framing: shortcuts exist because slash commands are absent from
threads, and because the payload carries `channel`, `message.ts` and
`message.thread_ts` — so the anchor comes **from Slack, not from text a message
could manipulate**. That provenance is what makes the follow-up read legitimate.

Five, uno-bot's domain. Three are mr-mule's unchanged; two are retargeted at
our sources rather than theirs:

1. **Catch me up from here** — what was decided, what is open, who owns each
   open item. Default tier: the transcript is already in the prompt, so there is
   nothing to dig for.
2. **Think harder about this** — the `/grind` twin, and the reason it must exist:
   escalating from inside a thread is otherwise impossible.
3. **Is this still true?** — check a claim in the thread against the sources of
   truth, which for us are TWO: the **blueprint** (how the service works today)
   and **Notion project documentation** (PRDs, Roadmap cards, Help Center).
   Widened from "ground this in the blueprint" (user decision, 2026-08-07)
   because a stale claim is as likely to live in a doc as in a journey step, and
   a shortcut that only checks one of them answers half the question.

   The conflict rule already in `blueprint_search` is what makes two sources
   safe: blueprint = today, Roadmap = planned, and a disagreement gets
   **surfaced, never blended** — a WIP card means "changing", a shipped card
   that disagrees means the doc is likely obsolete. That rule exists precisely
   because these two sources drift, so a verification shortcut is where it earns
   the most.

4. **Where was this decided?** — the **Notion Decisions DB** (`NOTION_DECISIONS_DB_ID`,
   already wired for `notion_search` scope "decision"). Must **say there is no
   record** rather than construct a plausible one: "we agreed X" with no record
   is indistinguishable from a misremembering, and inventing the provenance is
   the worst possible failure for this particular shortcut.
5. **Help me reply** — a draft in the asker's own voice, in a fenced block so it
   pastes cleanly, sources *below* the draft. The bot never posts it. Value is
   attribution: an @-mention produces a correct answer credited to a bot; this
   produces one credited to you.

**Wording lives in code, not the manifest** — reviewable in a diff — with a test
asserting manifest and handler agree. A shortcut declared with no handler still
appears in the menu and quietly does the generic thing.

### Two mechanics they all share

**Answers go to the asker's DM, never the channel the shortcut fired from.**
"Catch me up on this thread" posted publicly announces you were not following it;
"is this still true?" reads as calling out whoever wrote it. A permalink back to
the source goes in the DM so the answer is not stranded.

**Post a titled anchor first.** `setStatus` needs a `thread_ts` and a fresh DM
has none, so a shortcut click leaves the DM empty for 30–90s — indistinguishable
from nothing happening. A short titled anchor ("Catching you up on this thread:
<link>") gives immediate confirmation, creates the thread the answer lands in,
and names it in the timeline. One helper, three problems.

### Rejected, with reasons

- **Summarise this channel** — unbounded; search does it better.
- **Explain this** — an @-mention already does exactly that.
- **File as intake / Capture as lesson** — I proposed these earlier; mr-mule
  rejected the equivalent ("log this to the context store") as a write needing
  the consent gate for marginal benefit over pasting it yourself. Same reasoning
  applies. Deprioritised, not deleted — `uno-maintain` intake is a real
  workflow, unlike a generic note store.
- **Global shortcuts** — start from nothing, so they need a modal, and a modal is
  a worse place to type than the composer already open.

## A gap this opens in Phase 1

"Help me reply" needs the **draft footer** — playbook 4.5's third variant, a
warning that the text goes out under *their* name, which is a different risk
from "should I act on this". `footer-kind.ts` currently returns `full | none`.
Adding `draft` is small, but it must land WITH that shortcut, not after: a draft
shipped with the standard footer is the one case where the footer is wrong
rather than merely noisy.

## Order

1. Telemetry: `tier=` / `why=` on every turn — nothing below is tunable without it
2. Reorder: route before gathering context
3. Decide the deep tier (model swap, thinking rung, or drop `/grind`)
4. `/stop` — independent of all of the above
5. Shortcuts: "Catch me up" first, end to end, then the rest
6. `/chill`, `/grind` once tiers are real; `/summon` as Actions dispatch

## Open

- Does Gemini's `thinking_level` have a rung above `high`?
- Is `gemini-2.5-pro` the right deep model, or is there a 3.x pro?
- `/summon` — confirm the intent is background dispatch and not something the
  IDE does that a Worker structurally cannot.
