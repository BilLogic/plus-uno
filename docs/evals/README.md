---
summary: Criteria, tests, fixtures, results — one folder, one loop
---

# evals/ — the quality loop (L4)

Criteria, tests, fixtures, results — one folder, one loop.

| Dir | Holds | Rule |
|---|---|---|
| `rubrics/` | what "good" means, one rubric per artifact type (PRD, prototype, share-out, lesson, skill, agent-spec, bot-answer D1–D9) | YAML criteria + prose rationale; applied by `reviewers/rubric-applier` |
| `scenarios/` | `<skill>.md` — ≥3 scenarios (query + expected behavior) per skill | **written BEFORE the skill body** (evals-first); baseline without the skill, then write the minimal skill that passes |
| `fixtures/` | frozen golden inputs + answer keys per skill (see fixtures/README.md) | benchmarks run against these — a moving fixture measures nothing |
| `runs/` | `*.jsonl` — one line per scored run, plus `apply-log.jsonl` (one row per executed Flow-5 verdict: target · verdict link · timestamp) | interim store until the Notion Eval Runs DB exists; written at flow exits |

Populated 2026-07-07: 7 rubrics (six skills + bot-answer) rebuilt from the Notion 📊 Evals doc's metric targets, and 7 scenario sets (six skills, evals-first, + the bot regression prompts R1–R12, migrated from the former `agents/uno-bot/REGRESSION.md`, since removed). NOTE: `fixtures/uno-bot-cases.json` — what the `uno-bot — evals` Action actually runs — carries **21 cases**, all executed by `agents/uno-bot/scripts/run-evals.mjs`: R1–R12 plus R20 (13 R-cases), P1–P5 (prototype-method regression guards; P2/P5 rotate the provenance coverage added 2026-08-31) and S1–S3. Its LLM-judge answers live only in the encrypted sibling fixture and are loaded with an Actions secret, so the bot under test cannot retrieve its own grading instructions through `github_read`. This line read "16 total" until 2026-08-27; R20 and S1–S3 were added without it, which is how a count in prose drifts from a count in a file (#249). bot-answer dimensions D1/D4 were never recorded anywhere recoverable; their definitions are reconstructed as inferred-and-canonical in the rubric (2026-07-08).
