---
title: "Gemini tiers, scope keywords, and the routing scars"
type: feat
status: draft
date: 2026-08-07
source: parsnip-ai/mr-mule docs/routing.md + docs/lessons.md §A
---

# Gemini tiers and routing

Answers the open questions from `2026-08-07-005` with verified facts rather than
assumptions, and adapts mr-mule's routing model to a Gemini deployment.

## Verified

**Per-call model switching already works.** `geminiGenerate(env, { model })` —
`src/gemini/client.ts:149` falls back to `GEMINI_MODEL` only when the caller
passes nothing. The agent has simply never passed one. The grind tier is
plumbing, not a new capability.

**`thinking_level` is `minimal | low | medium | high`. There is no rung above
`high`** (ai.google.dev/gemini-api/docs/thinking). Option 2 from the previous
plan is dead — a grind tier must be a MODEL change.

**Model lineup and defaults:**

| Model | Default level | Supports |
|---|---|---|
| `gemini-3.5-flash-lite` | minimal | minimal…high |
| `gemini-3.6-flash` (ours) | **medium** | minimal…high |
| `gemini-3.1-pro-preview` | high | low…high |
| `gemini-2.5-pro` (our fallback) | on | low…high |

**Gemini has no built-in subagent/fan-out primitive.** Multi-agent orchestration
is an application concern. Confirms `/summon` cannot mean what it means in an
IDE.

## Two findings worth acting on

**1. Our tier names are a lie.** `ModelTier = "haiku" | "sonnet" | "opus"` —
Claude model names, on a deployment that runs Gemini. mr-mule's rule is exactly
this: *"Tier is how hard to think — named for effort rather than for a model.
Swapping models must never turn a command name into a lie."* We already made
that swap and kept the names.

Rename to effort: **`react` | `chill` | `default` | `grind`**. `grind` rather
than `deep` so the tier and the command that reaches it share a name.

**2. We force `high` on every non-trivial turn.** `gemini-agent.ts:159` sets
`high` for anything that is not `haiku`, while `gemini-3.6-flash`'s own default
is **`medium`**. Nobody chose that — it arrived when the Claude tiers were
mapped onto a single dial. Every ordinary question has been paying the top
thinking rung of the flash model.

## Proposed tiers

| Tier | Model | Level | Reached by |
|---|---|---|---|
| `react` | *(no model call)* | — | closed set of acknowledgements — answer with an emoji reaction |
| `chill` | `gemini-3.5-flash-lite` | medium | greetings, proposal resolutions, `/chill` |
| `default` | `gemini-3.6-flash` | medium | anything unmatched |
| `grind` | `gemini-3.1-pro-preview` | medium | decision/contradiction-shaped questions, a real complaint, `/grind`, the "think harder" shortcut |

**One dial, held constant: `medium` everywhere. The MODEL is the tier.**
(User decision, 2026-08-07.) Two interacting variables — model and level — make
a cost regression hard to attribute: an answer that got worse could be either.
Pinning the level means a tier change is a single-variable change, and the model
lineup already spans the range the dial was being used to fake.

It also lands `default` on `gemini-3.6-flash`'s own default level, which is the
overspend fix: nothing pays the top rung because a Claude tier map said so.

Notes that matter:

- **`grind` is a 3.x pro, not `gemini-2.5-pro`.** Our current fallback is a
  generation behind, and `gemini-agent.ts:162` gates `thinking_level` on
  `/^gemini-3/`, so a 2.5 grind tier would silently lose the dial as well.
- **Keep the grind model in its own config key.** `GEMINI_FALLBACK_MODEL` means
  "what we use when the primary fails"; conflating that with "the good one"
  makes a failure path silently expensive.
- `gemini-3.1-pro-preview` is a **preview** model. Ship it behind a key so it
  can be swapped without a deploy when it graduates or is withdrawn.

## The `react` tier — answering without a model

For a closed set of acknowledgements ("thanks", "got it", "nice", 👍), the
cheapest correct answer is **an emoji reaction and no model call at all**.
A reaction is one Slack subrequest against zero tokens, and it is what a person
would do.

This is the honest end of mr-mule's A1 scar: they stopped "thanks" buying a
*premium* turn; the further question is why it buys a turn at all.

Constraints, so this does not become a bot that ignores people:
- **A closed set, not a classifier.** An exact-match list, no model, no fuzzy
  intent. A false positive here is the bot reacting 👍 to a real question, which
  is worse than a cheap answer.
- **Only when there is a prior answer to acknowledge.** "Thanks" as an opening
  message is a person being polite before asking something.
- **Never in place of a gated action.** ✅ on a proposal is already the
  confirmation path and must keep running the tool.

Deliberately last in the sequence: it is the only tier that can make the bot
look broken, and it needs the `why=trivial` telemetry to show how often it would
actually fire before it is allowed to.

## Two axes, kept apart

mr-mule separates them, and the separation is the useful part:

- **Tier** = *how hard to think*. A cost decision: explicit, visible, named for
  effort.
- **Scope** = *where to look*. An optimisation: a leading keyword the relay
  parses, so adding a source is a one-line change with no manifest edit and no
  reinstall.

Scope keywords for uno-bot's sources:

| Prefix | Restricts to |
|---|---|
| `blueprint:` | uno-blueprint only |
| `ds:` | design system / Storybook only |
| `notion:` | Notion only (Roadmap, PRDs, Decisions) |
| `slack:` | Slack search only, as the asker |
| `github:` | repo reads only |

**Leading only.** A question that merely mentions the blueprint is not scoped to
it — treating it as such would hide the Roadmap half of a "is this planned or
shipped?" answer, which is the exact conflict case this bot exists to surface.

## Precedence

```
explicit command  >  trivial  >  retry  >  pattern  >  default
```

An explicit command always wins: someone who typed `/chill` on a hard question
has said they want it cheap, and overriding that makes the command untrustworthy.

## The four cost leaks, checked against our code

From `docs/lessons.md` §A — *"a signal that looked like 'they need more help'
but really meant 'the conversation continued.'"*

| | Their leak | Us |
|---|---|---|
| **A1** | "thanks" bought a premium turn | **Not exposed** — we have no `answeredBefore` rule at all. We would introduce this the moment we add retry detection. Assert the order in a test *when* we add it. |
| **A2** | every follow-up escalated | **Not exposed**, same reason. The rule to adopt pre-emptively: a retry needs a *dissatisfaction signal* (`are you sure`, `that's not right`, `you missed`), never the mere existence of a prior answer. |
| **A3** | same thread fetched twice | **Possible.** `events.ts:336` and `thread-transcript.ts:77` both call `conversationsReplies`. Different paths, but worth confirming they cannot both fire in one turn. `Promise.all` hides duplication — concurrency makes waste invisible, not absent. |
| **A4** | context gathered before routing | **Confirmed, we do this.** `loadHistory` (:332), `loadAssistantContext` (:482) and `collectVisionInputs` (:487) all run before `routeRequest` (:491). A "thanks" in a long thread pays for history, context and vision to produce two words. |

A4 is a reordering, and it is the one with a measurable payoff today.

## Observability first

One line per turn, no message content:

```
tier=grind   why=decision  model=gemini-3.1-pro-preview scope=blueprint thread=12msg connected=true
tier=chill   why=trivial   model=gemini-3.5-flash-lite  ctx=skipped
```

`why` is the point — it answers "why was this expensive" without guessing, and
it is the only honest input to tuning. **This ships before any tier change**, or
the change cannot be evaluated.

## `/summon` — dropped

Gemini has no fan-out primitive and a Worker cannot spawn subagents, so the
command could only ever have been `repository_dispatch` wearing a borrowed name.
**Cut** (user decision, 2026-08-07). `prototype_scaffold` and
`component_implement` already dispatch to Actions under names that say what they
do; a generic `/summon` would add a surface without adding a capability.

mr-mule's `/breed` stays theirs: their platform has subagents, ours does not.

## Order

1. **Telemetry** (`tier=`, `why=`, `model=`) — nothing below is measurable without it
2. **Reorder**: route before gathering context (A4)
3. **Rename tiers** to `chill | default | grind`, no behaviour change
4. **Wire models per tier**, including dropping `default` from `high` to `medium`
5. Measure, then `/chill` and `/grind`
6. Scope keywords
7. `react` tier, once `why=trivial` shows how often it would fire

Steps 3 and 4 are separable on purpose: a mechanical rename reviewable by grep,
then a behaviour change that can be judged on its own.

## Open

- Is `gemini-3.1-pro-preview` available to our Vertex project, or AI-Studio only?
- Does dropping `default` to `medium` change eval outcomes? Judged evals before
  and after, compared **case by case**.
