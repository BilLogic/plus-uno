---
summary: Rubrics, golden scenarios and frozen fixtures — what "good" means, and the inputs it is judged on
---

# evals/ — rubrics, scenarios, fixtures

What "good" means for each artifact, the scenarios a skill must pass, and the frozen inputs they are judged on.

| Dir | Holds | Read by |
|---|---|---|
| `rubrics/` | what "good" means, one rubric per artifact type (the six skills, bot-answer D1–D9) — YAML criteria + prose rationale | `reviewers/rubric-applier`, summoned from each skill's quality bar; the Worker's draft judge for `bot-answer.md` |
| `scenarios/` | `<skill>.md` — ≥3 scenarios (query + expected behavior) per skill, **written before the skill body**: baseline without the skill, then write the minimal skill that passes | each skill's quality bar |
| `fixtures/` | frozen golden inputs + answer keys (see `fixtures/README.md`) | the rubric benchmarks; the Worker's detector unit tests |

A rubric review returns its scored verdict to the skill that asked for it; nothing is logged here. The results measured before that — the 2026-07-08 golden runs, the retrieval baselines, the Cursor acceptance runs — are in `docs/knowledge/archive/eval-runs/`.

**The uno-bot answer evals are retired** (2026-10-13): the judged run cost far more in bot spend than the bot's real use, several cases asserted rules nobody follows, and the bot is known to work. Their cases, recordings and runners remain in the repository's history; ADR-027's addendum names what measures the bot now. What stays here for uno-bot:

- `rubrics/bot-answer.md` — the D1–D9 rubric. The Worker's draft judge (`agents/uno-bot/src/agent/draft-judge.ts`) condenses it, and `agents/uno-bot/tests/draft-judge-rubric.test.ts` keeps the two in step.
- The detector fixtures in `fixtures/` (sweep, capture, Figma decisions, commitments, card to-dos, DMs), replayed through the real detectors by the Worker's unit tests.

Everything under `docs/evals/` is withheld from uno-bot by `agents/uno-bot/src/integrations/repo-read-guard.ts`, so an answer key can sit here in plain text.

The design-system ratchet baselines live in `scripts/baselines/`, beside the checks that read them.
