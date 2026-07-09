---
artifact: uno-bot Slack answer / proposal (one scored conversation turn)
source: reconstructed 2026-07-07 from commit archaeology (d892346f, 0864cb54, c48e1c30) — the original external rubric doc is not in the repo
synced: 2026-07-07
applied_by: agents/reviewers/rubric-applier
scale: 1-5 per dimension; hard gates are pass/fail and override the score
dimensions:
  - id: D1
    definition: "grounded answer quality — correct, complete, scoped to what was asked (INFERRED 2026-07-08: the bot's baseline Q&A duty, already satisfied before d892346f closed the other gaps)"
  - id: D2
    definition: "model-tier routing — message intent maps to the right haiku/sonnet/opus tier (pickModel)"
  - id: D3
    definition: "clarify-vs-act — asks when required inputs are missing (preflight on implement_design / marketplace_add / create_prd) instead of acting on guesses"
  - id: D4
    definition: "proposal-gate discipline — side-effect actions stage a confirmation card; nothing irreversible without the requester's ✅ (INFERRED 2026-07-08: gate.ts pre-dated d892346f, so this dimension was already covered)"
  - id: D5
    definition: "communication routing — reviewable artifacts fan out to the right channel; people get @-mentioned via Team-DB Slack ids"
  - id: D6
    definition: "connector use — gated external connectors (send_email) fire only behind the proposal gate"
  - id: D7
    definition: "efficiency & safety — one telemetry line per request (tier, model, iterations, tokens, latency); read-only tool budget respected; safety contract held"
  - id: D8
    definition: "grounding — product claims answered via read-only blueprint_search with citations; anti-fabrication discipline"
  - id: D9
    definition: "confidence self-rating — answer ends with an honest high/medium/low confidence line"
hard_gates:
  - never claim an unfired action — future/conditional tense until the Worker confirms
  - delivery integrity — ✅ only after a confirmed post; empty/truncated bodies get an honest placeholder or note
  - gate idempotency — identical pending proposal points to the existing card; a just-cancelled action is never silently re-staged
---

# bot-answer rubric (D1–D9)

Reconstructed from the three eval-round commits so the repo finally records what "good" means for a bot answer — previously this lived only in commit messages (plan 2026-07-07-001 §5). D1 and D4 were never written down anywhere recoverable (they pre-dated the gap-closing commit), so their definitions here are **inferred and now canonical** (ADR-017 spirit: the repo is the record). If a future find contradicts them, revise via uno-maintain.

Golden prompts: `docs/evals/scenarios/uno-bot.md` (migrated from `agents/uno-bot/REGRESSION.md`).
