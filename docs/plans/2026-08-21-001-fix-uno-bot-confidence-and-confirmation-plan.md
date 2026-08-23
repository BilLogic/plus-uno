---
title: "The confirmation gate, the clause that says what an answer rests on, and four things worse than both"
type: fix
status: implemented
superseded_criteria: "Four acceptance criteria below were deliberately reversed by later decisions (plans …-003 and …-22-001) and are marked SUPERSEDED inline. Read them as history, never as a checklist — run them today and they report a working system as broken." 
date: 2026-08-21
completed: 2026-08-21
repos: plus-uno (agents/uno-bot), uno-blueprint (docs/conventions consumer)
outcome: "All five phases shipped across four commits. The gate now resolves only what a reaction was placed on, exactly once; a factual reply is checked for its confidence clause on the body that actually ships; compound affirmations resolve without a model call while anything carrying content falls through; PRD creations ask once. Two gaps recorded rather than faked: source_read's cache records no receipt, and the four new seams sit in Worker/DO/Slack code the pure-module test harness cannot reach."
---

# The confirmation gate, the clause that says what an answer rests on, and four things worse than both

## Overview

Two defects were reported. Investigating them turned up four adjacent faults
that are more serious than either, in the same two code paths. This plan covers
all of them and sequences by severity, not by what was reported.

The reported pair, corrected:

- **The missing confidence clause is not a missing rule.** The rule is correct,
  it is in the shipped prompt, and `search_blueprint` hands the model everything
  a clause needs. It is an enforcement coverage gap: the only check lives inside
  a judge that refuses to run on short drafts, and almost every blueprint answer
  in Slack is short.
- **The double confirmation is not a broken matcher.** It is two gates owned by
  two layers, the first invisible to the Worker and the second unable to know
  the first happened. A real matcher bug sits behind it, but fixing it alone
  would not have prevented what the user saw.

What we found on the way, in severity order:

| # | Fault | Why it outranks the reported pair |
| --- | --- | --- |
| **F1** | A 👍 **reaction on any message in a thread** executes the pending irreversible write | `+1`/`thumbsup` are confirm reactions, and the fallback resolves the thread's active proposal from any reacted message. Meanwhile every substantive answer ships 👍/👎 and the bot's own copy says "give the thumbs up". |
| **F2** | The **react tier silently swallows approvals** | With no proposal pending, in a DM, after a bot message not ending in `?`, the words "ok" / "sounds good" / "perfect" make the bot add an emoji and return with no model call. The user believes they approved. Nothing happened. |
| **F3** | A reaction and a typed confirmation can **execute the same proposal twice** | Two handlers, one non-atomic delete, and `notion_create` is not idempotent. |
| **F4** | A reaction on a **superseded card fires the newer proposal** | You confirm the card you are looking at and get the action you are not. |

F1 and F4 are the same shape: a confirmation gesture resolving something other
than what the person gestured at. F2 and F3 are the same shape too: the
approval path having no single owner.

## Verified state

Everything below was read in the code. Where two investigations disagreed, the
disagreement is recorded and resolved rather than averaged.

| Claim | Status | How |
| --- | --- | --- |
| The confidence rule is well-formed | True | `AGENT.md:93` § Grounding — "EXACTLY ONE clause per factual reply", "Never end a reply with a standalone confidence label", "Pure acknowledgements need nothing" |
| The rule reaches the model | True | Present in `src/generated/harness.ts` (index 24490), bundled by `scripts/bundle-harness.mjs` |
| `search_blueprint` provenance is stripped | **False** | `src/tools/blueprint-search.ts` attaches `retrieval`, `cached`/`age_ms`, `thin`, `top_score`, per-row breadcrumbs |
| D9 is the only enforcement | True | `src/agent/draft-judge.ts:56` |
| D9 skips short drafts | True | `:34` `MIN_DRAFT_CHARS = 1500`; skip at `:188-191` |
| `draft-judge.ts` is tested | **False** | No test file; not in `tsconfig.test.json`'s include list |
| The trailing-label guard repairs a missing clause | **False** | `src/slack/delivery.ts:100-128` only deletes |
| …and it only strips a *high* rating | True | `:100-118` — a trailing "low — from memory" is deliberately kept as the only calibration signal present |
| Prompt wording controls the clause shape | **False, already known** | `delivery.ts:100-103`: the retired shape "still resurfaced while the R1 eval stayed green, so wording is not a reliable control here" |
| Whether a retrieval tool ran is knowable at judge time | True | `loop-shared.ts:326-330` `turnScope`, populated `:442`, passed to `reviewDraft` at `events.ts:829-836` |
| …and is used on non-correction turns | **False** | `draft-judge.ts:125` gates it on `ctx.correction` |
| `+1` and `thumbsup` confirm a proposal | **True** | `src/slack/gate.ts:22` `CONFIRM_REACTIONS = {white_check_mark, heavy_check_mark, +1, thumbsup}` |
| A reaction must land on the proposal card | **False** | `gate.ts:36-44` `findThreadProposal` resolves the reacted message's thread root and returns the thread's active proposal |
| The staged card renders the full draft content | **True, for `notion_create`** | The reported thread's card showed Title, Summary, Properties, and every Section heading and body. `renderParamsForHumans` renders the tool-call params, and for `notion_create` the params *are* the document. One investigation read this as "renders params, not content" — for this tool they are the same thing, and the transcript settles it. |
| The card is size-capped | **False** | `proposal-render.ts` posts plain mrkdwn `text`; no `.slice()` in the file; Slack's 3000-char section cap applies to blocks, not a text-only post |
| `bareResolution` needs whole-message equality | True | `loop-shared.ts:220-225`; `"sure go ahead"` is not an entry — only `"sure"` and `"go ahead"` separately |
| The 👍/👎 **buttons** execute a proposal | **False** | `delivery.ts:173-208` `feedbackControls`, action_ids `uno_feedback_up`/`uno_feedback_down` → `recordFeedback`. **But a 👍 *reaction* does** — a different Slack mechanism, the same gesture to a human. |
| Destructiveness tiering exists | **False** | Only `SIDE_EFFECT_TOOLS` (`types.ts:42-49`), seven tools gated identically |
| A stale harness ships to production | **False** | `deploy` = `… && bundle:harness && wrangler deploy` — it **regenerates** first |
| `check:harness-bundle` runs anywhere | **False** | Exists in `package.json:10`, invoked by no workflow, hook, or script |

### F1 — how a thumbs-up executes a write nobody pointed at

1. A proposal is staged. The card sits in the thread.
2. Anyone reacts 👍 — to the card, to the bot's earlier answer, to a
   *colleague's* message, anywhere in the thread.
3. `mapReaction` returns `confirm` (`gate.ts:22-26`).
4. The exact-ts lookup misses. `findThreadProposal` resolves the reacted
   message's thread root and returns the thread's freshest live proposal
   (`gate.ts:36-44`).
5. It executes.

The reaction did not have to be on the card, on a bot message, or from the
person who asked. And three different things now mean thumbs-up: a feedback
button on every substantive answer, the bot's own prose asking for "the thumbs
up", and an irreversible-write authorization. Only the third fires a write, and
it is the one a user is least likely to think they are performing.

### F2 — how an approval becomes an emoji and nothing else

The dispatch order in `handleUserMessage` includes a tier the reported analysis
missed entirely (`events.ts:526-552`): DM, no proposal pending, the bot has
spoken, and the bot's last message did **not** end in `?` → reply with an emoji,
no model call, turn ends.

Gate 1's draft ends *"Once you give the thumbs up, I'll stage the ticket
creation."* No question mark. Nothing is pending, because gate 1 is prompt-only.
So when the user says "ok" or "sounds good" or "perfect" — all in
`react-only.ts`'s `CLOSED_SET` — the bot adds a reaction and returns. The card
is never staged. The user believes they approved.

`react-only.ts:35-43` documents this hazard and says the caller guards it via
the pending-proposal check and the trailing-`?` check. Both guards assume the
only approval-shaped context is a Worker-staged proposal. **Gate 1 is a third
approval context neither guard knows about** — which is the structural cost of a
gate that exists only in the prompt.

### How one action got confirmed twice

1. User asks for a ticket.
2. Model follows rule 4's PRD exception: posts the draft as **plain text**, asks
   for a thumbs up. No tool invoked, nothing pending. Being an ordinary text
   reply, it gets the standard footer — including 👍/👎.
3. User: *"sure go ahead"*.
4. `events.ts:494` loads pending: `null`. The deterministic branch at `:512-524`
   is skipped, so `bareResolution` is never consulted. Routes to the model.
5. The model reads it as gate-1 approval and **now** calls `notion_create`.
6. The Worker stages it and renders a card carrying the content the user just
   approved.
7. Only a ✅ resolves it.

Two gates, one action, no signal that a second was coming — and, per F2, the
user got lucky: three words further down the `CLOSED_SET` and step 5 would never
have happened.

## Problem statement

**P0 — a confirmation gesture can resolve something other than what it pointed
at** (F1, F4), **execute twice** (F3), or **silently do nothing** (F2). This is
the gate that guards every irreversible action the bot can take.

**P1 — a factual answer can ship with no statement of what it rests on**, and on
the most common reply shape nothing enforces the rule. One guard actively
removes the signal: on a short reply with a trailing label, `stripTrailingConfidence`
deletes it and nothing replaces it, converting "wrong shape" into "nothing".

**P2 — a *false* confidence clause is unenforced on every non-correction turn**,
though the Worker already holds the data to catch it. A clause claiming "just
now" over a cached hit is worse than a missing one, and has no guard at all.

**P3 — the bot asks twice for one action**, training users to click through
confirmations, which is exactly what a gate must not do.

**P4 — a natural confirmation does not resolve a pending proposal.**
`"sure go ahead"`, `"yes please"`, `"ok do it"` all miss the deterministic path.

## Proposed solution

### Phase 1 — make the gate resolve only what was pointed at

Highest severity, smallest surface, ships alone.

- **Remove `+1` and `thumbsup` from `CONFIRM_REACTIONS`** (`gate.ts:22`). ✅ and
  ✔️ remain. A gesture that appears on every answer as a feedback button must
  not also authorize an irreversible write. If thumbs-up must stay, then the
  feedback footer has to be suppressed on any thread with a live proposal — the
  two cannot coexist, and removing two strings is the cheaper half.
- **Narrow `findThreadProposal`.** Resolve only when the reacted message *is*
  the live proposal card. When it is a superseded card, say so ("that one was
  replaced — here's the current proposal") rather than silently executing the
  newer one (F4). When it is any other message, do nothing.
- **Make resolution atomic** (F3). Today: execute, then `deletePendingProposal`.
  Two handlers can both read the same pending record and both execute. Claim the
  proposal with a compare-and-swap *before* `executeTool`, so the second
  resolver finds it already claimed. `notion_create` is not idempotent; nothing
  downstream will catch a double.
- **Post something when a reaction resolves nothing** — an orphaned card (F: the
  post-then-save window at `events.ts:1007-1024`) currently produces silence,
  which the codebase already learned reads as "the bot is broken".

### Phase 2 — one gate, not two

**Delete the Proposal-gate rule 4 exception for PRD-shaped creations.** The
model invokes `notion_create` directly with the full content; the Worker stages
it; the staged card is the single review-and-authorize step.

The card already carries what gate 1 showed — the reported thread proves it, and
`proposal-render.ts` posts uncapped plain text, so length is not the constraint
that would justify a separate draft.

This removes more than the annoyance:

- **F2 disappears.** With no gate-1 message, the react tier's hazardous window
  cannot open, because approval-shaped words now always arrive with a proposal
  pending.
- **The 👍 confusion loses its source** — the misleading "give the thumbs up"
  copy goes with the message that carried it.
- **The recent-cancel guard gets more reliable.** `justCancelled` scans the last
  three DO turns (`events.ts:445-449`); the two-gate flow burns three turns on
  one action and pushes a recent cancel out of the window.

**Open, and load-bearing: how does a user request an edit to the draft?** Under
two gates they said it in prose before anything was staged. Under one gate,
amendment handling stops being an edge case. Today `resolveProposal` executes
`pending.input` **verbatim**, so "go ahead but tag it Universal" risks a "Got
it" plus a card without the change. Phase 2 is not done until an amendment
either re-stages a new card or is refused explicitly.

#### Alternatives considered

**Keep both gates; have gate 1 announce the second.** The weakest option: it
addresses the surprise and none of F2, the concurrency hazards, or the
cancel-guard window, all of which follow from gate 1 existing rather than from
its wording. It also asks model-authored prose to reliably describe framework
behaviour — a class of control this codebase has twice concluded does not hold
(`delivery.ts:100-106`, `loop-shared.ts:245-251`).

**Carry gate-1 approval forward so the Worker auto-resolves gate 2.**
**Rejected, and worth naming because it is the tempting option.** The only
evidence of gate-1 approval is model-authored prose in DO history. Gate 2 is the
one thing a model cannot talk its way past — `AGENT.md` rule 1, *"the friction
is the feature"*. `loop-shared.ts:245-251` makes the argument for a different
feature: the bot's own prior claim "sits in history as authoritative prose with
no counter-evidence… a prompt rule has to beat that, and it fires exactly when
instruction-following is weakest." Record the rejection so it is not reproposed.

### Phase 3 — catch the false clause deterministically, then the missing one

**The cheapest high-value check in this plan needs no model call.** AGENT.md says
a freshness claim is only true of a fetch performed *this turn*. The Worker
computes `toolsUsedThisTurn` and `turnReceipt` already. So:

> If the delivered body contains freshness vocabulary ("just now", "current",
> "as of today") and no retrieval tool ran this turn — fail deterministically.

This already exists, scoped to corrections (`CORRECTION_GATE`,
`draft-judge.ts:96-103`). Apply it on every turn. The base rubric cannot do this
job: `JUDGE_SYSTEM` explicitly says not to fail a draft for facts it cannot
verify — and this is a fact the *Worker* can verify.

**Second-order, and it must be decided:** does a cached `search_blueprint` hit
count as "a fetch performed this turn"? The tool ran; the data is stale.
`turnReceipt` carries `cached`/`age_ms`, so the check can distinguish them — but
only if we say which it is. Treat a cache hit as **not** a live fetch; that is
what the rule means.

Then the missing-clause check:

```
needsConfidence = a retrieval tool ran this turn
                  AND the reply contains a declarative factual sentence
```

**Not** `footerKindFor(...) === "none"` as the exemption, which was the first
design and is wrong: *"Yep — and that card moved to In Review yesterday"* is 48
characters with no link and no list, so `footerKindFor` calls it an
acknowledgement and would exempt a factual claim.

| needsConfidence | shape | action |
| --- | --- | --- |
| false | any | deliver unchanged |
| true | woven clause present | deliver unchanged |
| true | trailing label | **repair** — do not silently strip |
| true | absent | **repair** |

Three ordering constraints the first draft of this plan got wrong:

1. **Check the delivered body, not the draft.** `capText` truncates at
   `MAX_POST_CHARS = 3900` *after* the judge passes, so a clause in a closing
   paragraph can be amputated from a message the telemetry records as
   `verdict=pass`.
2. **Re-validate after the strip.** A judge revision can itself end in a trailing
   label; today it is stripped with no re-check, and the escalation leaves the
   reply worse than it found it.
3. **Decide the fail-open.** The judge can time out at 25 s
   (`draft-judge.ts:36`) and ships the original unchanged. For a 200-char reply
   that is 25 seconds bought to deliver the same non-compliant text. Either
   accept it and count it, or append a minimal deterministic clause. Not
   deciding is how the check becomes theatre.

**And three delivery paths bypass this pipeline entirely** — they touch neither
the judge nor the stripper:

- `resolveProposal`'s narrative (`resolve-proposal.ts:27-35`, raw `postMessage`),
  which is model-authored and can carry factual claims
- interim progress lines (`events.ts:741-753`), which are literally the model's
  first raw output line gated only on length ≥ 15
- react-tier text

State explicitly whether the rule covers them. A pre-check scoped to the text
lane leaves all three open.

#### Alternatives considered

**Lower `MIN_DRAFT_CHARS`.** Rejected: the floor exists so cheap replies do not
each buy a judge call, and it would pay on every acknowledgement to catch a
subset.

**Insert a clause at the delivery layer.** Rejected on the rule's own terms —
AGENT.md requires words "that fit THIS answer — no house sentence to adapt". A
template is the retired shape wearing different words. The receipt goes to the
judge to *verify* rather than to the renderer to *fabricate*.

### Phase 4 — compound confirmations, tiered by consequence

Replace whole-message equality with an all-tokens-affirmative rule: normalize,
tokenize, and resolve **only** when every token is affirmative, no token is a
cancel token, and the message is under a stated token count.

`"sure go ahead"` resolves. `"go ahead and archive the old one too"` carries
content and falls through. **Mixed polarity always falls through** — state it as
a rule rather than relying on `every()` returning false by luck.

Two related gaps: an emoji-only *message* (typed 👍) while a proposal is pending
takes a different path from the same emoji as a *reaction* — one deterministic,
one not; and a typed confirmation after `PROPOSAL_TTL_MS` gets silence, while
the reaction path posts a helpful expiry notice (`gate.ts:60-72`) added after a
live incident. Make them symmetric.

**Tier by consequence.** This concept does not exist — `SIDE_EFFECT_TOOLS` gates
seven tools identically. `email_send` and `notion_archive` should require the ✅
that `AGENT.md:97` already names as the standard; a typed affirmation should not
be enough to send mail.

**Suppress the deterministic path when the bot's last message asked more than one
question.** "go ahead" against two open questions currently executes the staged
input and ignores both.

### Phase 5 — the drift already found

- **`docs/conventions/blueprint-navigation.md`** — rewrite every SQL example. It
  still names `service_lifecycles` / `service_lifecycle_id`,
  `service_scenario_id`, `layers` / `layer_id` / `row_position`, `cell_triggers`,
  `propositions`, `cells.description`, and Zoom/Pencil, while its own §4/§4a
  prose is already written against the new schema — the doc contradicts itself.
  Every example errors once the uno-blueprint branch deploys. It is both the
  retrieval guide and the eval context block, so its SQL must actually run.
- **Add `check:harness-bundle` to CI.** Accurate severity: `deploy` runs
  `bundle:harness`, which regenerates, so production has **never** shipped a
  stale harness. What drifts is the committed artifact, which local runs and
  tests read. Cheap, not urgent.

## System-wide impact

- **Interaction graph.** `events.ts:handleUserMessage` dispatches through
  `isUserTurn` → dedup/lease → context load → deterministic resolution (only if
  pending) → **react tier** → model turn → `reviewDraft` → `postTextVerified` →
  `stripTrailingConfidence` → `capText` → stream-or-post. The react tier is the
  step both original analyses missed and where F2 lives.
- **Error propagation.** A failed escalation must **deliver**, not block: a
  missing clause is a smaller harm than a dropped answer. Make the fail-open
  explicit in code rather than inherited from the judge.
- **State lifecycle.** Phase 2 removes a *model behaviour*, so no migration and
  no in-flight reconciliation. Phase 1's compare-and-swap does change DO
  semantics and needs care around the sweeper (`thread-state.ts:114-147`).
- **Concurrency.** The run lease is keyed per *message*
  (`events.ts:407` `msg:{channel}:{ts}`), not per thread, so a second user
  message mid-run runs concurrently and can stage a second card. Phase 1 should
  state whether a same-thread turn defers, queues, or rejects.
- **API surface parity.** The confidence rule applies to every factual reply, so
  keying on "a retrieval tool ran" covers `github_read` and Notion reads too.
  Confirm that is intended.

## Acceptance criteria

### The gate (P0)

- [~] **SUPERSEDED 2026-08-21 (plan …-003).** 👍 confirms again: it was never the gesture that was wrong, it was the gesture meaning two things, and retiring the footer's 👍/👎 buttons retired the collision instead. ~~A 👍 reaction does not execute a pending proposal~~ (or the feedback footer
      is suppressed wherever one is live — assert both cannot coexist)
- [ ] A confirm reaction on a message that is not the live card does not execute
- [ ] A confirm reaction on a superseded card explains, and never executes the
      newer proposal
- [ ] A reaction plus a typed confirmation execute `executeTool` **exactly once**
- [ ] A reaction resolving nothing produces a visible message, not silence
- [ ] A second message on a thread with a run in flight cannot stage a second card
- [ ] With no gate-1 message, no `CLOSED_SET` word can consume an approval

### The clause (P1, P2)

- [ ] A freshness claim with no live retrieval this turn fails deterministically,
      on every turn, with no model call
- [ ] A cached retrieval is treated as not-a-live-fetch
- [ ] A grounded factual reply of any length lacking a clause is repaired —
      asserted on the **post-strip, post-`capText`** body
- [ ] A short factual reply that reads as an acknowledgement is still covered
- [ ] A judge revision ending in a trailing label does not ship with zero signal
- [ ] Escalation failure has a stated, implemented behaviour
- [ ] Whether the rule covers resolution narratives and interim lines is decided
      and enforced
- [ ] Telemetry records the verdict against the delivered body, plus pre-check
      trigger and escalation-failure rates

### One gate, and confirmations (P3, P4)

- [ ] A PRD-shaped creation asks exactly **once**
- [ ] An amendment either re-stages or is refused — never a silent verbatim execute
- [~] **SUPERSEDED 2026-08-22 (Proposal C).** It resolves — but through the MODEL, not a phrase list. The accelerator and its four sibling vocabularies were deleted; every incident in this area came from the lists. ~~`"sure go ahead"` resolves … with no model call~~
- [x] Mixed-polarity and extra-content messages fall through — now trivially, since **everything** typed falls through to the model
- [~] **SUPERSEDED 2026-08-21.** The consequence tier is gone (Bill: *"the heavier actions don't make any sense"*) — the gate is the gate, and demanding the same decision in a second medium added friction without adding a check. ~~A typed affirmation cannot resolve `email_send` or `notion_archive`~~
- [ ] A typed confirmation after TTL gets the same expiry notice a reaction gets
- [ ] A typed 👍 behaves as the reaction does
- [~] **SUPERSEDED 2026-08-22.** `fastPathAllowed` is deleted along with the fast path it guarded. ~~More than one `?` in the bot's last message suppresses the fast path~~

### Quality gates

- [ ] `npm test` green; `draft-judge.ts` and the new pure modules added to
      `tsconfig.test.json`'s include list
- [ ] `npm run typecheck` clean
- [ ] `check:harness-bundle` clean and running in CI
- [ ] Rejection cases tested, not only accepting ones — that is where the safety is
- [ ] Every SQL example in `blueprint-navigation.md` runs

## Testing note

Current coverage is `node --test` over compiled pure modules — **no Worker
runtime, no Durable Object, no Slack**. Most of P0 is invisible to that setup:
dispatch precedence (F2) is the interaction of four booleans over a real thread;
double-execution (F3) needs two handlers racing on one DO key; TTL and orphan
reconciliation need real storage and alarms; the reaction fallback needs real
thread shapes. These need `@cloudflare/vitest-pool-workers` or Miniflare plus a
Slack fake, and that is a prerequisite for trusting Phase 1, not a follow-up.

One specific trap: `delivery.ts:107-117` records that `TRAILING_CONFIDENCE` once
backtracked badly enough to blow the 10 ms Worker CPU limit and post nothing.
Any new confidence-detection regex needs an adversarial-input test **under
workerd** — in Node it just runs slower and passes.

### What shipped, and what is still uncovered (2026-08-21)

Pure logic went into three testable modules — `agent/confidence.ts`,
`agent/resolution.ts`, `slack/gate-reactions.ts` — with 40 new assertions, all
in `tsconfig.test.json`'s include list. The refusal cases carry the weight:
`bareResolution` rejecting `"go ahead but tag it Universal"`, `mapReaction`
rejecting every spelling of 👍, `assertsSomething` refusing to exempt
*"Yep — and that card moved to In Review yesterday"*.

**Still uncovered, deliberately.** These live in Worker/DO/Slack code that the
pure-module harness cannot reach, and mocking them would prove only that the
mocks agree with each other:

| Behaviour | Why a unit test cannot see it |
| --- | --- |
| The claim (`claimPendingProposal`) actually serialising two resolvers | Needs two handlers racing on one real DO key |
| The reaction fallback pointing rather than executing | Needs real `conversations.replies` thread shapes |
| `forceReason` reaching a live judge call | Needs the model lane |
| `cached` surviving the DO round-trip | Needs real storage |
| `renderDeliveredBody` | Pure in shape, but `delivery.ts` imports `./api` and `../types`, so it is not free to add to the test build |

**A gap found during implementation, not in the plan.** `servedFromCache` is
blueprint-only: `recordRetrieval` has one call site (`search_blueprint`), while
`source_read` keeps its own per-isolate cache in `integrations/notion.ts` and
records no receipt at all. So a cached document read still reads as a live
fetch to the freshness check. Closing it means adding receipt recording to the
Notion read path and deciding what the receipt's last-write-wins semantics
should be when a turn reads several sources — a bigger change than this pass.

## Risks

| Risk | Mitigation |
| --- | --- |
| Removing 👍 breaks a habit people rely on | ✅ stays, and the card footer already names it. Confusion here currently costs an unintended write. |
| Compare-and-swap introduces a stuck "claimed" state | Claim carries the TTL; the sweeper already clears expired records |
| A loosened `bareResolution` auto-approves something ambiguous | All-tokens-affirmative, token cap, mixed polarity always falls through, destructive tools excluded entirely |
| Collapsing gates removes a review round someone wanted | The card carries the same content; if a conversational round is genuinely needed, take the documented fallback — but then F2 must be fixed directly |
| The lexical clause check is English-only | Known limitation; measure the escalation rate before extending |
| `blueprint-navigation.md` and the uno-blueprint migrations land out of order | Both cross-repo, one window — see plan `2026-08-20-007` |

## Future considerations

- `draft-judge.ts` having zero tests is why a rubric dimension could stop running
  on the common case unnoticed. Coverage there is worth more than either
  reported fix.
- The general shape is worth a sweep: **a rule with one enforcement point, gated
  on a condition unrelated to the rule, is unenforced wherever that condition is
  false.** Any other dimension behind `MIN_DRAFT_CHARS` has the same exposure.
- Three delivery paths bypassing the delivery pipeline suggests the pipeline is a
  convention rather than a chokepoint. Making it the only way text reaches Slack
  would close a class.

## Documentation

- `AGENT.md` — Proposal gate rule 4; regenerate the harness after any edit
- `docs/conventions/blueprint-navigation.md` — full SQL rewrite (Phase 5)
- `docs/knowledge/lessons/` — two worth recording: the enforcement-point lesson
  above, and that **a gesture used for feedback must never also be an
  authorization**

## Sources and references

### Internal

- `AGENT.md:93` § Grounding; `:97` `SIDE_EFFECT_TOOLS` as prose; `:104` rule 4's PRD exception
- `src/slack/gate.ts:22,36-44,60-72` — confirm reactions, the thread fallback, the expiry notice
- `src/agent/draft-judge.ts:34,36,56,96-103,125,188-191` — floor, timeout, D9, correction gate, tool list, skip
- `src/slack/delivery.ts:100-128,161-171,173-208,232-236` — the strip, silent block degradation, the footer, the pipeline order
- `src/slack/events.ts:404-413,445-449,493-524,526-552,741-753,829-840,1007-1024` — lease, cancel guard, resolution path, react tier, interim, judge call, post-then-save
- `src/agent/loop-shared.ts:209-234,245-251,326-330,442` — phrases, `bareResolution`, the prose-in-history argument, `turnScope`
- `src/agent/resolve-proposal.ts:27-39` — the narrative post, the acknowledgement reaction
- `src/slack/react-only.ts:35-43,52-73` — the documented hazard and `CLOSED_SET`
- `src/slack/proposal-render.ts:15-16,35` — `CONFIRM_FOOTER`, the card
- `src/agent/types.ts:42-49` — `SIDE_EFFECT_TOOLS`
- `tests/antecedent.test.ts` — the template for new pure-function tests

### Evidence

- Notion: *uno-blueprint responses omitting confidence level* — `3c3b7cca4982818e8bdbf98bfe3ae85a`
- Slack: `devoli` `C0ARJ2A3A69` `p1787296549114929` — the double-confirmation thread
