# evals/ — the quality loop (L4)

Criteria, tests, results — one folder, one loop.

| Dir | Holds | Rule |
|---|---|---|
| `rubrics/` | what "good" means, one rubric per artifact type (PRD, prototype, share-out, lesson, skill, agent-spec, bot-answer D1–D8) | YAML criteria + prose rationale; applied by `reviewers/rubric-applier` |
| `scenarios/` | `<skill>.md` — ≥3 scenarios (query + expected behavior) per skill | **written BEFORE the skill body** (evals-first); baseline without the skill, then write the minimal skill that passes |
| `runs/` | `*.jsonl` — one line per scored run, plus `apply-log.jsonl` (one row per executed Flow-5 verdict: target · verdict link · timestamp) | interim store until the Notion Eval Runs DB exists; written at flow exits |

Populated 2026-07-07: 7 rubrics (six skills + bot-answer) rebuilt from the Notion 📊 Evals doc's metric targets, and 7 scenario sets (six skills, evals-first, + the 12 bot regression prompts migrated from `agents/uno-bot/REGRESSION.md`). bot-answer dimensions D1/D4 were never recorded anywhere recoverable; their definitions are reconstructed as inferred-and-canonical in the rubric (2026-07-08).
