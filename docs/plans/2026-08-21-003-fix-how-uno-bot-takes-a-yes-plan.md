---
title: "How uno-bot takes a yes"
type: fix
status: implemented
remaining: "Proposal B (bounce notice) only"
date: 2026-08-21
supersedes: docs/plans/2026-08-21-002-fix-the-answer-footer-earns-its-place-plan.md
repos: plus-uno (agents/uno-bot)
---

# How uno-bot takes a yes

## Overview

One document for the whole confirmation surface, because it was decided across
a dozen messages and that is not a readable form.

**Status 2026-08-22 (pm): decided and implemented.** The user's call: *"our
reaction should be ✅ versus ⛔ … if one wants to approve, click the check mark;
if they disapprove, click the cancellation button and then articulate what
else to fix … if someone sends an emoji, fine, recognise the common mapped
ones … but if it's a text response, just go straight to the model route.
There are too many complications; I don't think it's worth it."* So: Proposal
A (buttons) shipped, Proposal C (retire the typed classifiers) shipped, ⛔ is
the cancel gesture, and the only deterministic text path left is a gate emoji
typed alone. Proposal B (bounce notice) remains open. Path 1 below is rewritten
to what runs now; the older prose is kept where it explains a decision.

**Correction 2026-08-22:** an earlier draft of this section said the live app's
interactivity `request_url` still pointed at the dead Netlify function and
needed a human to apply the manifest. That was wrong — read off a stale comment
in `slack-app-manifest.yaml`. `slack manifest diff --app A0APS0L8HJR` reports
*"Project manifest and app settings match"*, and the remote manifest's
`settings.interactivity.request_url` is the Worker route. Nothing was pending.

The organising question: **when the bot needs a person's approval before it
acts, what counts as approval, and what happens to it?**

Three things had been conflated under that question — a feedback vote, a
confirmation gesture, and a typed reply — and they shared a 👍.

---

## What it looks and feels like when this is done

The end state, written as what a person actually sees. Everything below is
already true except the two sections marked *proposed*.

### Asking for something that writes  ·  *shipped 2026-08-22*

> **Bryan:** `@uno-bot` file a maintenance ticket about the confidence level thing
>
> **uno-bot:**
> ⚠️ **About to create this card in Notion**
> • **Title:** uno-blueprint responses omitting confidence level
> • **Surface:** intake · **Suggested tier:** Tier 2
> • **Problem / Context:** Grounding rules require exactly one woven confidence clause…
> • **Proposed Fix:** Audit the confidence clause enforcement…
>
> ✅ to approve · ⛔ to cancel (then tell me what to change).
> **`[ ✅ Approve ]`  `[ ⛔ Cancel ]`**
>
> **Bryan:** sure go ahead
>
> **uno-bot:** Got it — kicking that off.
> 📝 Created on Roadmap (maintenance intake): *uno-blueprint responses omitting confidence level*

**One card. One confirmation.** The card carries the whole draft, so there is
nothing to approve twice — that is why the prose-draft round is gone.

**The card names ONE way; three still work.** Once buttons are on the card,
the copy stops advertising reactions — a card that lists three ways to say yes
reads as three decisions to make. But reacting ✅ or 👍, or typing "sure go
ahead", still resolves it, because someone who reaches for a reaction is not
wrong, they just did not use the obvious control. All three land on the same
claim, and only one can win: pressing the button *and* reacting cannot file two
cards.

### Saying something that isn't quite yes

> **Bryan:** go ahead but tag it Universal
>
> **uno-bot:** Updated — tagging it Universal. Same card otherwise:
> ⚠️ **About to create this card in Notion** …

The deterministic path deliberately does **not** fire here, because resolution
runs the staged input verbatim and would have filed the untagged version while
saying "Got it". Anything carrying an instruction goes to the model, which
reads it and re-stages.

Same for "no go ahead" and "ok cancel" — mixed signals are never guessed.

### Changing your mind, or walking away

> **Bryan:** actually cancel that
>
> **uno-bot:** Cancelled — nothing was filed. Want it re-staged with a different tier?

A ✅ on a card that was already superseded says so instead of filing the newer
one. A ✅ ten minutes after the card expired gets the hourglass, not silence.

### Under an ordinary answer

> **uno-bot:** The reconfirm step sits under Standard Scheduling — I checked the
> blueprint just now. It's `status: proposed`, so it isn't live yet.
>
> *LLM-written · check before acting*

No buttons. Nothing to press, nothing asking for a rating. The one line that
remains is the honesty label, and it appears only on answers making checkable
claims — a short "Got it" carries nothing at all.

### When an approval goes missing  ·  *proposed*

> **Bryan:** go ahead
>
> **uno-bot:** *(answers something adjacent, never files the card)*
>
> **uno-bot:** I still have the maintenance card staged — did you mean to go
> ahead with it?

Today this is the silence in which an approval evaporates. Proposal B starts by
measuring how often it happens.

---

## How a confirmation is actually routed

Traced through the code, because "does the LLM see this?" has a different
answer on each path — and that is deliberate.

### Path 1 — typed  ·  the only path the LLM can reach  ·  *as shipped 2026-08-22*

```
Slack message
  └─ handleSlackEnvelope → dispatchInnerEvent  case "message"
       └─ enqueueAgentJob  (per-thread DO; the Worker's own invocation is
                            cancelled ~30s after the ack, so the run moves
                            to a DO alarm — live incident 2026-07-09)
            └─ handleUserMessage
                 ├─ loadPendingProposalByThread          ← is anything staged?
                 │
                 ├─ IF pending AND typedEmojiDecision(text):   the message IS
                 │     "confirm" / "cancel" → resolveProposal   one gate emoji,
                 │                              ✅ NO MODEL CALL  nothing else
                 │
                 └─ EVERYTHING ELSE: the MODEL reads the turn, with
                      <pending_proposal> in context
                      ├─ proposal_resolve(confirm|cancel)
                      │     └─ validateProposalResolve   ← Worker-side authorization
                      │     └─ resolveProposal
                      ├─ the SAME tool with the SAME input   ← the 2026-07-10 failure
                      │     └─ events.ts gate-idempotency (a):  shape. Was a bounce;
                      │        resolveProposal(confirm)        now it is the confirm
                      ├─ slack_react + no text   → emoji, no post (was the react tier)
                      └─ anything else           → ordinary reply; card stays pending
```

**This is the answer to "is it processed by the LLM?"** — on the typed path,
yes, for every message that is words. The phrase accelerator, the question-mark
guard and the react tier were deleted on 2026-08-22 (Proposal C); the only
thing the Worker resolves without the model is an emoji typed alone, which is
a reaction by other means. What keeps the model path safe is no longer a
vocabulary but the structural rule in the middle: a model that answers a yes
by reaching for the tool again has said yes, and the Worker executes it
through the same claim instead of bouncing.

### Path 2 — reaction  ·  deliberately never reaches the LLM

```
Slack reaction_added
  └─ dispatchInnerEvent  case "reaction_added"
       └─ enqueueAgentJob (keyed by the reacted message, so confirmations on
                           one proposal stay ordered)
            └─ handleReaction
                 ├─ mapReaction(name)        ✅ ✔️ 👍 → confirm · ❌ 🚫 ⛔ → cancel
                 ├─ getBotIdentity           the bot may never resolve its own
                 ├─ loadPendingProposalDetailed(reactedTs)
                 │     ├─ "expired" → the hourglass message, nothing runs
                 │     └─ miss      → point at the live card, RESOLVE NOTHING
                 └─ resolveProposal          ✅ NO MODEL CALL, EVER
```

A reaction is a direct instruction on a specific object. There is nothing to
interpret, so nothing interprets it — which also means it cannot be talked out
of, mis-parsed, or lost to a model error.

### Path 3 — button  ·  *shipped 2026-08-22*, and also bypasses the LLM

```
Slack block_actions        (a DIFFERENT endpoint from events — interactive.ts)
  └─ dispatchAction(action_id)
       ├─ "uno_stop_run"         → stopRun
       ├─ "uno_delete_answer"    → deleteAnswer
       └─ "uno_proposal_confirm" / "uno_proposal_cancel"  → resolveFromButton
              ├─ loadPendingProposalDetailed(message.ts)   the card the button is ON
              │     ├─ expired / gone → ephemeral "already expired / resolved"
              └─ resolveProposal           ✅ NO MODEL CALL
                    └─ won the claim → re-render the card via response_url:
                       buttons off, "✅ Approved by @who" or
                       "⛔ Cancelled by @who — tell me what to change"
```

Buttons arrive on Slack's interactivity endpoint, not the events one. The live
app's `request_url` must point at the Worker for any of this to fire — see the
status note in the Overview.

### Where all three converge

```
resolveProposal(pending, decision)
  │
  ├─ claimPendingProposal(proposalTs)      ← the DELETE *is* the claim.
  │     └─ false → stand down silently        A DO handles one request at a
  │                                            time, so of two racing resolvers
  │                                            exactly one continues. Fails
  │                                            CLOSED: notion_create is not
  │                                            idempotent.
  ├─ postMessage(narrative)
  ├─ addReaction(:handshake:) on the ORIGINAL request
  ├─ executeTool(toolName, input)          ← the actual Notion / email write
  └─ appendHistory(outcome + any URL)      ← so later turns know what was done
```

**One claim, three doors.** Whichever path a person uses, the same record is
claimed, and the loser of a race does nothing at all — pressing a button and
reacting cannot file two cards.

### The honest summary

| | Reaches the LLM? | Why |
| --- | --- | --- |
| Typed, a gate emoji alone (✅ 👍 ⛔ ❌) | No | It is the reaction, typed; nothing to interpret |
| Typed, any words at all | **Yes** | The model reads it and decides — this is the general case, and since 2026-08-22 the only case |
| Reaction | No | A direct instruction on a specific object; nothing to interpret |
| Button | No | Same — the control names the decision exactly |

The design principle holds, and is now literally true: **no fixed list decides
what a person meant.** The only list left recognises emoji, where there is
nothing to decide.


## Part 1 — Shipped

Seven commits, all on `refactor/one-name-search-blueprint`, none deployed.
Listed so nothing here has to be re-litigated.

### The gate

| # | What | Commit |
| --- | --- | --- |
| 1 | **A reaction resolves only the card it sits on.** `findThreadProposal` became a *pointer*, not an executor: a reaction elsewhere in the thread now explains and resolves nothing, and one on a superseded card no longer fires the newer proposal. Previously a ✅ on the card in front of you could execute a different action. | `7f51dd39` |
| 2 | **Resolution is atomic.** The Durable Object's `DELETE` reports whether it removed the record, which makes it a claim — a DO handles one request at a time, so of two racing resolvers exactly one proceeds. A reaction landing beside a typed "go ahead" could otherwise both reach `executeTool`, and `notion_create` is not idempotent. Fails **closed**, unlike `claimEventRun` next to it, because the actions here are the irreversible ones. | `7f51dd39` |
| 3 | **No consequence tier.** `email_send` and `notion_archive` briefly required a reaction; that was reverted the same day. A staged proposal has already been reviewed and the person answering is the person who asked — demanding the same decision in a different medium adds friction without adding a check, and splits the mental model. If an action ever needs a second pair of eyes, that is a second REVIEWER, not a second gesture from the same one. | `80b3d357`, `041d5fa4` |

### Taking a yes

| # | What | Commit |
| --- | --- | --- |
| 4 | **Compound affirmations resolve.** `bareResolution` accepts a message when *every* token is affirmative, no cancel token is present, and it is at most four tokens. So "sure go ahead" works — it did not before, because the matcher wanted whole-message equality against a list holding "sure" and "go ahead" only as separate entries. | `80b3d357`, `cf4497cf` |
| 5 | **Anything carrying content falls through to the model.** "go ahead but tag it Universal" deliberately does **not** auto-resolve: resolution executes `pending.input` verbatim, so it would file the unamended version and report success. Mixed polarity ("no go ahead", "ok cancel") always falls through — never guessed. | `80b3d357` |
| 6 | **A decision can no longer be answered with an emoji.** The react tier replies with a reaction and *no model call* when, in a DM, nothing is staged and the bot's last message did not end in "?". Its closed set of pleasantries contains "ok", "sounds good", "perfect" — every one of which is also how a person says yes. The guard tried to tell them apart from the *bot's* side; it now reads the *user's*. | `965107b2` |
| 7 | **One confirmation, not two.** `AGENT.md` rule 4 no longer has PRD-shaped creations draft in prose first — the model stages the card directly and the card is the draft review. The prose round asked for the same approval twice and, worse, staged nothing, which is what opened the window in #6. | `80b3d357` |

### The footer

| # | What | Commit |
| --- | --- | --- |
| 8 | **👍/👎 removed.** The vote could only ever be `console.log`ged — Slack's data policy forbids retaining retrieved workspace content — so nothing counted it and nothing could query it. The acknowledgement claimed to replace the buttons "so a second vote is not invited" while sending `replace_original: false`, so one person could vote endlessly. The honesty line, `LLM-written · check before acting`, stays: that was the footer's actual job. | `965107b2` |
| 9 | **Delete dropped with it, deliberately.** `buildThreadHistory` rebuilds every turn by re-reading the raw Slack thread, so deleting a bot message deletes the bot's own memory of having said it — `priorAssistantText`, which the correction gate compares a corrected reply against — and punches a hole in the transcripts the team analyses. A wrong answer with its correction underneath beats a gap. | `965107b2` |
| 10 | **👍 confirms again.** Removed in the morning, restored in the afternoon. The gesture was never the problem; the gesture *meaning two things* was. With the footer no longer using it (#8) and reactions resolving only their own card (#1), the collision is gone, and making someone hunt for ✅ is friction with nothing left to protect. It now means the same thing reacted as typed. | `0a16ad19` |

### Adjacent, same session

`ae6c9cbe` added the confidence pre-check; `a79bae08` lowered `MIN_DRAFT_CHARS`
1500 → 1000. Both are in plan `2026-08-21-001` and are not re-argued here.

**Standing invariant from #10:** *a confirmation gesture may have exactly one
meaning in the product.* If 👍 is ever given a second job, it leaves
`CONFIRM_REACTIONS` the same day. Pinned by a test that also keeps 👎 out —
cancelling is ❌.

---

## Part 2 — The design principle, and where it already holds

> **"I want to make sure we don't have a fixed list of confirmation or
> rejection but rather the bot would be using the LLM to interpret the user's
> response to decide next step."**

**This is already the architecture, and it is worth being precise about why.**

`bareResolution` is a **zero-model-call accelerator, not a gate**. The flow:

```
message arrives, a proposal is pending
        │
        ├── bareResolution matches ──> resolve deterministically, no model call
        │
        └── no match (the common case) ──> the MODEL reads the turn,
                                            with <pending_proposal> in context,
                                            and may call proposal_resolve
```

The list can only ever **skip a round trip**. It can never stop the model from
interpreting a reply, because everything it does not match goes to the model by
definition. Phrasing it has never seen, another language, a reply that argues
with the proposal — all of that is the model's, already.

### The counter-evidence, recorded honestly

The deterministic path is not there because someone distrusted the model in the
abstract. It is scar tissue from a live incident, cited in `slack/events.ts`:

> **2026-07-10 (gemini):** "go ahead" made the model re-stage an identical
> proposal and hit the duplicate guard instead of resolving — **the user's
> approval bounced.**

So the LLM path has a known failure mode on exactly this interaction: the one
where being wrong costs the most, and where the person believes they have
already said yes. Removing the accelerator would reintroduce it for the most
common phrasings.

**Recommendation: keep the accelerator, and add the missing safety net.**
Nothing today detects the 2026-07-10 failure — a turn where a proposal was
pending and the model neither resolved it nor addressed it. That is Proposal B.

---

## Part 3 — Proposed

### Proposal A — ✅ / ⛔ buttons on the proposal card  ·  *shipped 2026-08-22*

Shipped as `proposalActionBlocks()` in `proposal-render.ts`, `resolveFromButton`
in `interactive.ts`, and the ⛔ (`no_entry`) cancel gesture in
`gate-reactions.ts`. The card footer now reads *"✅ to approve · ⛔ to cancel
(then tell me what to change)"* and nothing else. The block-path risk below was
handled the way it says: a text-only retry keeps the gate working (reactions
and typed emoji) if Slack rejects the blocks, and the first real card still
wants one eyeball.

Before 2026-08-22 the card ended with:

> `React :white_check_mark: / :x: — or just say "go ahead" / "cancel".`

It asks the reader to perform a *reaction on a message*, which is a discoverable
gesture only if you already know it. A button is the obvious control, it is
attached to the object being approved, and it keeps one mechanism in one place.

This is the honest version of the "quick yes/no" idea — see the rejection
below for why the footer is the wrong home for it.

**The real risk, which the design must handle.** `proposal-render.ts` posts
plain mrkdwn `text` for every tool except `prototype_scaffold`. Adding Block Kit
buttons moves the card onto the **block path**, where `postTextVerified`
degrades to plain text on a block error — silently. An invalid block would drop
the card's controls while everything still looked fine. This is precisely what
the retired `SLACK_NATIVE_FEEDBACK` flag was hedging, and the lesson survives
the flag: **ship it behind one real-answer eyeball before it becomes default.**

Keep the reaction and typed paths working alongside it. Three ways in is not
three mechanisms — they all resolve the same claim.

### Proposal B — notice when an approval bounces

When a proposal is pending and the model's turn ends without either resolving
it or mentioning it, the Worker should say so rather than leaving the person to
notice nothing happened.

This is the 2026-07-10 failure, and it is currently invisible: the model
re-stages or answers something adjacent, the duplicate guard fires, and the
approval evaporates. The Worker already knows both facts it needs — a proposal
was pending at turn start, and `proposal_resolve` was not among the tools that
ran.

Smallest useful version: log it, with the pending tool name and the user's text,
so the failure has a rate before anyone designs a response to it. A visible
"I still have X staged — did you mean to go ahead?" is the obvious next step,
but it should be built on a measured rate rather than a guess.

### Proposal C — retire the typed classifiers  ·  *decided and shipped 2026-08-22; reverses Part 4's second rejection*

The user asked: *"is the separation on fast path vs. letting the model think
through really necessary? … most tasks still need the model to execute the rest
anyway, adding this tiny overhead seems like nothing, and instead we can
streamline the system a lot."*

One correction to the premise, then agreement with the conclusion.

**The correction:** for a bare confirmation the fast path does skip the model
entirely — `resolveProposal` executes the staged tool input directly, so "yes"
costs zero model tokens today and one `chill`-tier call under C. The saving is
a whole (cheap) call, not a tiny overhead.

**The agreement:** it is still not worth what it costs. An inventory of what
the dispatch keeps in hand-maintained vocabularies:

| List | File | Job |
| --- | --- | --- |
| `CONFIRM_PHRASES` / `CANCEL_PHRASES` → `looksLikeResolution` | `loop-shared.ts:210-244` | route to the cheap tier |
| `AFFIRM_STRONG` / `NEUTRAL` / `NEGATE_STRONG` + `AFFIRM_EMOJI` / `CANCEL_EMOJI` | `resolution.ts` | execute with no model |
| `fastPathAllowed` (count `?` in the bot's last turn) | `resolution.ts:137` | suppress the above |
| `reactOnlyEmoji` closed set + seven guards incl. `readsAsDecision` | `react-only.ts`, `events.ts:555-600` | 👍 with no model |
| `CORRECTION_PATTERNS` | `loop-shared.ts:260` | force a re-retrieval |

"ok" sits in three of them. ~350 lines, 35 tests, and **every incident in this
area came from the lists, not the model**: 2026-07-12 the two lists disagreed
(`lgtm` resolved but would not route; `nope` the reverse); 2026-08-21 Bryan
(whole-message equality missed "sure go ahead", and the react tier could have
swallowed "sounds good" with no model call and nothing filed); the same day,
`wait`/`hold` as cancel tokens destroying proposals; and the consequence tier,
removed for adding friction without a check. Each fix added a guard; each guard
is another place the next phrasing can fall between.

**What the fast path was actually protecting against.** Part 2 cites the
2026-07-10 Gemini incident: "go ahead" made the model re-stage the identical
proposal and hit the duplicate guard instead of calling `proposal_resolve`. That
is a *model* failure, and a vocabulary is the wrong shape of fix for it — it
covers the phrasings someone thought of. The structural fix covers all of them:

> **Pending proposal + the model re-invokes the same tool with the same input
> = confirm.** The Worker already intercepts the call (`claude-agent.ts:191`,
> `gemini-agent.ts:385`) and already compares against the pending proposal
> (`validateProposalResolve`). Treating an identical re-stage as the resolution
> it obviously is removes the 07-10 failure for every phrasing at once, with no
> list.

### The shape after C

```
typed message ─────────────────────────────────────► model
                                                       │ <pending_proposal> in context
                                                       ├─ proposal_resolve(confirm|cancel)
                                                       ├─ same tool, same input  ──► treated as confirm
                                                       ├─ react({emoji})         ──► emoji, no post
                                                       └─ anything else          ──► ordinary reply
reaction on the card ──────────────────────────────► resolveProposal   (no model; structural input)
button on the card   ──────────────────────────────► resolveProposal   (no model; Proposal A)
```

- **Delete:** `resolution.ts`, `fastPathAllowed`, `readsAsDecision`, the react
  tier and `react-only.ts`, `looksLikeResolution` and the two phrase lists,
  the `bareResolution` branch in `events.ts:516-540`, and their tests
  (`resolution.test.ts`, `react-only.test.ts`, the accelerator rows of
  `confirmation-paths.test.ts`). Net roughly −350 lines.
- **Keep:** the reaction gate and the button gate — structural inputs with
  exactly one meaning and no parsing. `CORRECTION_PATTERNS` stays for now; it
  drives retrieval, not an irreversible write, and a false positive costs one
  search.
- **Keep, simplified:** `routeRequest` picks `chill` when a proposal is pending
  and the message is ≤ 6 tokens — a cost heuristic only; a wrong answer costs a
  slightly more expensive model, never a wrong action.
- **Add:** a `react` tool (`{ emoji }`) so the model can answer "thanks" with
  🙏 and no post. The judgment the react tier's seven guards approximated
  becomes the model's, which can see the whole thread. ~15 lines.
- **Add:** the same-tool-same-input = confirm rule in the tool-call
  interception, both lanes. ~20 lines, one test each lane.

**Cost of C:** a bare "yes" pays one `chill` call (~1–3s, cents). A "thanks"
pays one `chill` call and may still produce only an emoji. Nothing else changes
for the user; the look-and-feel transcript at the top of this plan is
unchanged.

**What C does not cover, stated:** the model may still call neither
`proposal_resolve` nor the same tool on a clear yes. That is Proposal B's job
(notice when an approval bounces), and B becomes more important, not less,
once the accelerator is gone — ship B with C or before it.

---

## Part 4 — Rejected, with reasons

### Repurposing footer 👍/👎 as "proceed / don't proceed"

> *"i do wonder if we should keep the thumb up / down under footer as means for
> quick user reaction to whether they give yes or no to proceed on an idea"*

The instinct is right — quick yes/no is genuinely useful. The footer is the
wrong place for it, for two reasons:

1. **The trigger is wrong.** `footerKindFor` fires on any answer with a link, a
   list, or over 220 characters. Most of those propose nothing. A 👍 under a
   factual answer about the reconfirm step means *what?* That is the ambiguity
   we just removed, reintroduced in a new costume.
2. **It would create two approve mechanisms** — the card's and the footer's —
   with no rule for which applies when. The whole point of Part 1 was
   collapsing that.

Proposal A is where this instinct lands correctly: the same quick yes/no, on the
object that actually needs approving.

### Removing the phrase accelerator entirely  ·  *rejection withdrawn 2026-08-22*

Was: "It cannot block the model, and deleting it reintroduces a production
failure on the highest-cost interaction." The first half is true; the second
assumed the only fix for the 2026-07-10 failure was a vocabulary. It is not —
see Proposal C, which replaces the accelerator with a structural rule (same
tool, same input = confirm) that covers every phrasing. Kept here so the
reasoning that held for a day is visible, not erased.

---

## Open edges

**Retired buttons on old answers.** Answers already in Slack still carry 👍/👎.
Pressing one now reaches a `console.warn` and does nothing visible — where it
previously posted "Noted — thanks." They scroll away, and a shim for a
temporary condition seemed worse than the edge. Reversible if it grates.

**Testing reality.** `npm test` compiles pure modules only — no Worker runtime,
no Durable Object, no Slack. So these are pinned by unit tests: the reaction
vocabulary, the resolution matcher, the consequence tier, the confidence
predicates. These are **not**, and cannot be without Miniflare plus a Slack
fake:

- the claim actually serialising two racing resolvers
- the reaction fallback pointing rather than executing
- the card's block rendering, and its silent degradation path
- `cached` surviving the DO round trip

Proposal A lands squarely in the untested band, which is why the eyeball step is
a requirement and not a nicety.

---

## Acceptance criteria

Shipped work is verified; these cover what is proposed.

- [x] The proposal card carries ✅ Approve / ⛔ Cancel buttons
- [x] Reaction, button and typed-emoji paths resolve the same card, through the same claim
- [x] A block-render failure on the card degrades to a text card that reactions still resolve, and is logged
- [x] The card has been eyeballed once on a real answer — live DM test 2026-08-22. The manifest note was wrong: interactivity already pointed at the Worker (`slack manifest diff` reports a match), so nothing was pending there.
- [x] No typed words resolve a proposal without the model (`resolution.ts`, `react-only.ts`, the phrase lists: deleted)
- [x] An identical re-stage while pending executes as a confirm instead of bouncing
- [x] A pure acknowledgement can end as a reaction with no reply (model-chosen via `slack_react`)
- [ ] A turn that leaves a pending proposal unresolved and unaddressed is logged (Proposal B — open)
- [x] `npm run typecheck` clean, `npm test` passing (167)
- [x] New pure logic (`typedEmojiDecision`, `GATE_RESERVED`) lives in `gate-reactions.ts`, already in `tsconfig.test.json`

## Risks

| Risk | Mitigation |
| --- | --- |
| Card buttons silently vanish on a block error | The eyeball gate; and prefer failing loudly over degrading quietly |
| Three ways to confirm reads as three mechanisms | They resolve one claim; the card names one primary way and the others keep working |
| The bounce notice becomes noise | Log first, measure the rate, design the message second |
| 👍 acquires a second meaning again | The standing invariant, with a test |

## Sources

- Supersedes: [2026-08-21-002](./2026-08-21-002-fix-the-answer-footer-earns-its-place-plan.md) — which recommended keeping delete and treating the votes as the only question. Both changed: delete is out (#9), and the footer turned out to be three things, not one.
- Related: [2026-08-21-001](./2026-08-21-001-fix-uno-bot-confidence-and-confirmation-plan.md) — the confidence clause and the gate's severity ordering
- `src/slack/gate.ts`, `gate-reactions.ts` — the reaction path and its vocabulary
- `src/agent/resolution.ts` — the matcher, the consequence tier, the question guard
- `src/agent/resolve-proposal.ts`, `src/thread-state-client.ts` — the claim
- `src/slack/events.ts` — the react tier, the deterministic branch, the 2026-07-10 note
- `src/slack/delivery.ts`, `interactive.ts` — the footer, and why the votes went
- `src/slack/proposal-render.ts` — the card, and the text-vs-blocks path
