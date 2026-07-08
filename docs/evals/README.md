# evals/ — the quality loop (L4)

Criteria, tests, results — one folder, one loop.

| Dir | Holds | Rule |
|---|---|---|
| `rubrics/` | what "good" means, one rubric per artifact type (PRD, prototype, share-out, lesson, skill, agent-spec, bot-answer D1–D8) | YAML criteria + prose rationale; applied by `reviewers/rubric-applier` |
| `scenarios/` | `<skill>.md` — ≥3 scenarios (query + expected behavior) per skill | **written BEFORE the skill body** (evals-first); baseline without the skill, then write the minimal skill that passes |
| `runs/` | `*.jsonl` — one line per scored run | interim store until the Notion Eval Runs DB exists; written at flow exits |

Seed material: `agents/uno-bot/REGRESSION.md` (12 bot regression prompts) belongs to this loop — migrate into `scenarios/` when the bot faces are next touched. Rubrics to rebuild from scratch (decision 2026-07-07): start from the metric targets in the Notion 📊 Evals doc, not the old broken-linked starters.
