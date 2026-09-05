---
embodiment: ide
summary: On the Gemini lane a tier is one named configuration of model PLUS thinking level — chill low, default medium, grind high — reversing the 2026-08-07 call to pin one dial; attribution comes from changing one tier at a time (2026-09-04)
status: active
verified: 2026-09-04 (#421)
---

# ADR-028: A tier is model plus thinking level, moving together (2026-09-04)

**Decision.** Each of uno-bot's three tiers on the Gemini lane is one named
configuration: a model *and* a thinking level, changed together and never
apart.

| Tier | Model | Level | Model's own default |
|---|---|---|---|
| `chill` | `gemini-3.5-flash-lite` | **low** | minimal |
| `default` | `gemini-3.6-flash` (→ `gemini-3.8-flash` with #416) | **medium** | medium |
| `grind` | `gemini-3.1-pro-preview` | **high** | high |

The level is a property of the tier and lives in code
(`agents/uno-bot/src/agent/gemini-tiers.ts`); only the model is overridable
from config, per tier. A mid-turn fallback swaps the model underneath the tier
and re-derives the dials against the new model — the level carries onto a
backup model that takes the dial, and drops to none on a 2.x model that does
not. The attribution rule is **change one tier at a time**: a regression after
a tier change is attributed to that tier's configuration as a whole.

This reverses the 2026-08-07 decision (`docs/plans/2026-08-07-006-feat-gemini-tiers-and-routing-plan.md`)
to hold the dial constant at `medium` on every tier so that the model was the
only variable. — Bill, Sep 2026 (#417)

**Why.** Pinning one dial bought clean attribution and paid for it twice, in
the two directions a user can push the bot:

*"Think harder" ran the pro model below its own default.* `gemini-3.1-pro-preview`
defaults to `high`; the grind tier sent `medium`. Asking for depth delivered a
bigger model thinking less than it would have unprompted.

*A six-word reply ran the lite model above its own.* `gemini-3.5-flash-lite`
defaults to `minimal`; the chill tier sent `medium`. An acknowledgement to a
proposal paid for reasoning it did not need.

Holding the level constant assumed the three models share a default. They do
not, and a "constant" that lands on three different points of three different
scales is not a controlled variable — it is three uncontrolled ones with one
name. The attribution the pin promised was never quite real.

*Why chill is `low` and not the model's own `minimal`.* A chill turn is the one
that resolves a gated proposal: "yes please" against a staged `notion_create`.
A misread there costs more than a rung of thinking, so chill sits one rung above
flash-lite's default rather than on it. Two facts verified 2026-09-04 at
ai.google.dev/gemini-api/docs/thinking hold the choice in place: flash and pro
accept `low|medium|high` and *error* on `minimal`, and a fallback carries the
tier's level onto the backup model — so `minimal` on any tier would be a latent
400 the first time flash-lite was unavailable.

*Why the level is in code, not config.* If config could move the level without
the model, the two-variable problem the 2026-08-07 pin was solving would be
back through a different door. One key per tier for the model is enough: it is
the only part that has ever needed swapping without a deploy (the 2026-07-16
quota bridge, the pro preview's availability).

**Considered and rejected.** *Keep the pin and move it to each model's own
default* — that is still three levels, chosen by Google rather than by us, and
it puts chill on `minimal` for the exact turn where a misread is dearest.
*Make the level a fourth routing signal* (escalate the level before the model)
— `thinking_level` tops out at `high` with no rung above it, so the escalation
tier still has to be a model change, and a second axis inside the tier is the
attribution problem restated.

**Consequences.**

The `[uno-bot] request done` log line carries `level=` beside `tier=` and
`model=`, and the headless eval route (`/debug/eval`) reports the same three as
`dials`, so a scenario can assert the level a turn was *sent* with rather than
inferring it from the model. Two blocker cases do so: T1 (a short reply to a
pending proposal → `chill` at `low`) and T2 ("think harder" → `grind` at
`high`). T2 failing with `level=none` means the pro preview was unavailable to
the project and the turn fell back — a real finding, not noise.

The Vertex-Claude lane is untouched: its tiers carry a thinking *budget* in
tokens, not a level, and it reports `level: null`.

`docs/plans/2026-08-07-006` stays as written; it is the record of the decision
this one reverses, and the "one dial, held constant" reasoning in it is the
reasoning this ADR answers.
