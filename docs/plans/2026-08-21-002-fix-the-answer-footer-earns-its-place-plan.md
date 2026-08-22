---
title: "The answer footer: keep the label, drop the vote, decide about delete"
type: fix
status: draft
date: 2026-08-21
repos: plus-uno (agents/uno-bot)
---

# The answer footer: keep the label, drop the vote, decide about delete

## Overview

Bill asked what the 👍/👎 under every answer are for, said he analyses
performance from transcripts rather than reactions, and asked to check when
they appear and why they were built before removing anything.

Checking turned up something narrower and clearer than "are votes useful": the
footer is **three separate things welded into one block**, and only one of them
is a vote. Two of the three earn their place. The vote does not, and it costs
more than nothing — it is the gesture the confirmation gate was accidentally
sharing.

## Verified state

| Question | Answer | How |
| --- | --- | --- |
| Where does a vote go? | **`console.log` and nowhere else** | `src/slack/interactive.ts:163` — `[feedback] ${verdict} user=… channel=… ts=…`. Grep for `[feedback]` returns that one line. No DO write, no store, no counter. |
| Can it be analysed later? | **No** | A Worker log is visible in `wrangler tail` while someone watches, then gone. Nothing aggregates it, nothing queries it. |
| When does the footer appear? | On most substantive answers | `footerKindFor` (`slack/footer-kind.ts:36-50`) returns `"none"` only for short acknowledgements — no link, no list, ≤220 chars. Any link, any list, or anything longer gets `"full"`. |
| Which rendering ships? | The hand-rolled buttons | `wrangler.toml:70` — `SLACK_NATIVE_FEEDBACK = "off"`. The native `context_actions` variant is written but not enabled. |
| Is a second vote prevented? | **No — and the comment says it is** | `interactive.ts:145-147` says "The acknowledgement replaces the buttons so a second vote is not invited", but the POST sends `replace_original: false, response_type: "ephemeral"` (`:177`). The buttons stay. The same person can vote repeatedly. |
| What else is in the footer? | A context note | `footerNoteFor` — `_LLM-written · check before acting_` on a normal answer, `_Draft — sends under your name, so read it first_` on a draft relay. |
| What is in the native variant only? | A **delete** control | `delivery.ts` `icon_button` / `uno_delete_answer`, with the argument: *"A wrong answer sitting in a channel is a wrong answer people quote later; letting the asker remove it is cheaper than any correction we could post."* |

### The three things, separated

1. **The honesty label** — `_LLM-written · check before acting_`. This is the
   footer's real job. It is on every answer that makes checkable claims, which
   is exactly the right trigger, and the draft variant names a sharper risk
   ("sends under your name"). **Keep, unchanged.**
2. **The vote** — two buttons whose output is one unstructured log line. **This
   is the thing to remove.**
3. **Delete** — currently unreachable, because it only exists in the variant the
   flag has switched off. **A separate decision, and worth making deliberately
   rather than losing by accident.**

They are welded together: `footerBlocks` spreads `feedbackControls(env)` and
then the note, and `feedbackControls` returns the votes and (in native mode)
delete as one block. So "remove the votes" naively takes delete with it and
leaves the label — which is why this is a plan and not a one-line deletion.

### Why the vote is not merely useless

**👍 is the gesture the confirmation gate was sharing.** Until 2026-08-21,
`+1` and `thumbsup` were in `CONFIRM_REACTIONS`, and a 👍 *reaction* anywhere in
a thread with a staged proposal executed the write. That is fixed
(`7f51dd39`) — but the footer is the thing that taught the reflex. Every
substantive answer puts a 👍 in front of the reader and asks them to press it.
Removing it removes the last place the product says "thumbs-up is how you
approve of what the bot did."

**And a control that does nothing is worse than no control.** A person who
presses 👎 has told us something and reasonably expects it to land somewhere.
It lands in a log line that rolls. Offering feedback we do not collect is a
small dishonesty, and it is on every answer.

## Problem statement

The footer asks for input the system cannot use, on nearly every answer,
through the one gesture the product needed to stop overloading — while the two
parts that do earn their place (the honesty label, and a delete control that is
currently switched off) are bundled with it.

## Proposed solution

### Decision 1 — remove the vote. Recommended.

Delete the two buttons, the `uno_feedback*` action ids, and `recordFeedback`.
Keep `footerNoteFor` exactly as it is.

This is not "remove feedback" — it is **remove the pretence of collecting it**.
The signal Bill actually uses is the transcript, and the transcript is already
complete: `buildThreadHistory` rebuilds every thread from Slack, and the DO
keeps its own turn record. A 👎 with no attached words was never going to say
*what* was wrong, which is the only part that would change an answer.

If a lightweight signal is wanted later, the honest version is a **written**
one — "say what was off and I'll use it", which the current 👎 acknowledgement
already asks for and then has nowhere to put. That is a real feature, and it is
not this one.

### Decision 2 — delete: enable it, on its own. Recommended, but Bill's call.

The delete control's argument stands on its own merits and has nothing to do
with votes: a wrong answer quoted three weeks later is a real cost, and the
asker removing it is cheaper than any correction. It is also the one part of
the footer that acts rather than records.

Two ways to keep it:

**(a) Split `feedbackControls` into `deleteControl`, and drop the flag.** The
`SLACK_NATIVE_FEEDBACK` flag exists to hedge one specific risk — an invalid
`context_actions` block does not fail loudly, because delivery degrades to
plain text on a block error and would silently drop the footer from *every*
answer. That risk is real and survives the vote's removal, so whatever ships
must be eyeballed once on a real answer before it becomes the default.

**(b) Drop delete too, and keep the footer to prose only.** Defensible: nobody
has used it, because it has never been on. Cheapest, and reversible.

Recommend (a): the control is written, the reasoning is sound, and losing it as
a side effect of removing votes would be an accident rather than a decision.

### Decision 3 — fix the comment/code contradiction either way

`interactive.ts:145` claims the buttons are replaced so a second vote is not
invited; `:177` sends `replace_original: false`. If the votes go, this
disappears with them. If Bill wants to keep votes after all, the contradiction
has to be resolved in one direction or the other — and it is worth knowing that
today's behaviour permits unlimited repeat votes from one person, which would
make any future aggregation meaningless before it started.

## Technical approach

Small, and mostly deletion.

| Step | Files |
| --- | --- |
| Remove the vote buttons from both renderings | `src/slack/delivery.ts` — `feedbackControls` |
| Remove the handler and its action ids | `src/slack/interactive.ts` — `recordFeedback`, `FEEDBACK_ACTIONS`, its dispatch case |
| Keep the note; simplify `footerBlocks` to note-only (or note + delete) | `src/slack/delivery.ts` — `footerBlocks` |
| If keeping delete: extract `deleteControl`, verify `uno_delete_answer`'s handler exists and works | `delivery.ts`, `interactive.ts` |
| If dropping the flag: remove `SLACK_NATIVE_FEEDBACK` | `wrangler.toml:70`, `src/types.ts:149` |
| Check nothing else reads the ids | grep `uno_feedback`, `uno_delete_answer` |

`footerKindFor` is untouched — it decides whether a footer appears at all, and
its rule (link, list, or >220 chars) is right for the honesty label, which is
what remains.

**Testing.** `footer-kind.ts` is already a pure module with tests
(`tests/footer-kind.test.ts`), so the trigger rule stays covered. The block
assembly in `delivery.ts` is not import-clean for the test build (it pulls
`./api` and `../types`), so the shape of the emitted blocks is verified by
eyeballing one real answer in Slack — which the flag's own rationale says is
required anyway.

## Acceptance criteria

- [ ] No answer carries 👍/👎
- [ ] Every answer that made checkable claims still carries `_LLM-written · check before acting_`
- [ ] A draft relay still carries the "sends under your name" note
- [ ] A short acknowledgement still carries no footer at all
- [ ] No dead handler: `uno_feedback*` appears nowhere
- [ ] Delete is either working and on, or gone — not written-but-unreachable
- [ ] If the native block ships, it has been eyeballed once on a real answer (it fails silently)
- [ ] `npm run typecheck` clean, `npm test` passing

## Risks

| Risk | Mitigation |
| --- | --- |
| Someone was reading `[feedback]` lines in `wrangler tail` | Ask before deleting. If yes, that is an argument for a real store, not for keeping the log. |
| Removing delete by accident | It is Decision 2, made explicitly — that is why this is a plan |
| The native block fails silently and drops the whole footer | Do not enable it and walk away; eyeball one real answer. The flag exists for exactly this |

## Open question for Bill

Delete: **(a)** enable it on its own, or **(b)** drop it and keep the footer to
prose only? Everything else in this plan is a straightforward removal.

## Sources

- `src/slack/delivery.ts` — `feedbackControls`, `footerBlocks`, the native-block rationale
- `src/slack/interactive.ts:145-180` — `recordFeedback`, the comment/code contradiction
- `src/slack/footer-kind.ts:36-60` — when a footer appears, and what the note says
- `wrangler.toml:70` — `SLACK_NATIVE_FEEDBACK = "off"`
- `docs/plans/2026-08-21-001-…-plan.md` — the confirmation gate, and why 👍 stopped confirming
