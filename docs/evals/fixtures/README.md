# evals/fixtures — golden inputs

Fixed inputs the benchmarks run against — same inputs, comparable outputs across skill revisions. A rubric benchmark that names no fixture is unmeasurable (found by the 2026-07-08 golden runs).

| Skill | Fixture | Answer key |
|---|---|---|
| uno-synthesize | `uno-synthesize-bundle/` — 3 sources (Slack thread · transcript · analytics) | `uno-synthesize-bundle/reference-findings.md` — diff coverage against it |
| uno-prototype | `uno-prototype-seeds/` — 3 deliberately incomplete PRDs spanning fidelities | each seed lists its planted gaps in a footer comment; 100% of gaps must fire the missing-context prompt |
| uno-review | `playground/home-redesign/src` (pre-existing defects as planted flaws) | the 2026-07-08 run: `docs/evals/runs/2026-07-08-golden-uno-review.jsonl` (9 defects vs AGENTS.md FP-1/2/6; full-procedure recall 100%, script-only 44%) |
| uno-maintain | seeded issue set defined inline in `docs/evals/scenarios/uno-maintain.md` S5 (11 targets + 1 cross-estate) | the taxonomy table in `skills/uno-maintain/references/method.md` |
| uno-bot | `docs/evals/scenarios/uno-bot.md` (12 seed prompts, binary outcomes) | expected column per scenario |

Fixtures are frozen: revise only when the thing they test changes, and note it in the fixture header — a moving fixture measures nothing.
