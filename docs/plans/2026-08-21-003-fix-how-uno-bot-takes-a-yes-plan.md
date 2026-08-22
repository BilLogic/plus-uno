---
title: "How uno-bot takes a yes"
type: fix
status: active
date: 2026-08-21
supersedes: docs/plans/2026-08-21-002-fix-the-answer-footer-earns-its-place-plan.md
repos: plus-uno (agents/uno-bot)
---

# How uno-bot takes a yes

## Overview

One document for the whole confirmation surface, because it was decided across
a dozen messages and that is not a readable form. Most of it has **already
shipped**; the rest is two proposals and one rejection.

The organising question: **when the bot needs a person's approval before it
acts, what counts as approval, and what happens to it?**

Three things had been conflated under that question — a feedback vote, a
confirmation gesture, and a typed reply — and they shared a 👍.

---

## Part 1 — Shipped

Seven commits, all on `refactor/one-name-search-blueprint`, none deployed.
Listed so nothing here has to be re-litigated.

### The gate

| # | What | Commit |
| --- | --- | --- |
| 1 | **A reaction resolves only the card it sits on.** `findThreadProposal` became a *pointer*, not an executor: a reaction elsewhere in the thread now explains and resolves nothing, and one on a superseded card no longer fires the newer proposal. Previously a ✅ on the card in front of you could execute a different action. | `7f51dd39` |
| 2 | **Resolution is atomic.** The Durable Object's `DELETE` reports whether it removed the record, which makes it a claim — a DO handles one request at a time, so of two racing resolvers exactly one proceeds. A reaction landing beside a typed "go ahead" could otherwise both reach `executeTool`, and `notion_create` is not idempotent. Fails **closed**, unlike `claimEventRun` next to it, because the actions here are the irreversible ones. | `7f51dd39` |
| 3 | **`email_send` and `notion_archive` require a reaction.** A typed word is not enough for an action that cannot be recalled. A consequence tier this codebase did not previously have — `SIDE_EFFECT_TOOLS` gated all seven identically. | `80b3d357` |

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

### Proposal A — ✅ / ❌ buttons on the proposal card

Today the card ends with:

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

### Removing the phrase accelerator entirely

Covered in Part 2. It cannot block the model, and deleting it reintroduces a
production failure on the highest-cost interaction.

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

- [ ] The proposal card carries ✅ / ❌ buttons
- [ ] Reaction and typed paths still resolve the same card, through the same claim
- [ ] A block-render failure on the card is **visible**, not a silent downgrade
- [ ] The card has been eyeballed once on a real answer before becoming default
- [ ] A turn that leaves a pending proposal unresolved and unaddressed is logged
- [ ] That log carries the pending tool and the user's text, so it has a rate
- [ ] `npm run typecheck` clean, `npm test` passing
- [ ] Any new pure logic is in a testable module and added to `tsconfig.test.json`

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
