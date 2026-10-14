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

Populated 2026-07-07: 7 rubrics (six skills + bot-answer) rebuilt from the Notion 📊 Evals doc's metric targets, and scenario sets for the six skills, written evals-first.

**The uno-bot answer evals are retired.** The weekly judged run against the live Worker, the recorded replay on every pull request and the retrieval suite were removed on 2026-10-13: the judged run cost far more in bot spend than the bot's real use, several cases asserted rules nobody follows, and the bot is known to work. Their cases, recordings and runners remain in the repository's history. What stays here for uno-bot:

- `rubrics/bot-answer.md` — the D1–D9 rubric. The Worker's draft judge (`agents/uno-bot/src/agent/draft-judge.ts`) condenses it, and `agents/uno-bot/tests/draft-judge-rubric.test.ts` keeps the two in step.
- The detector fixtures in `fixtures/` (sweep, capture, Figma decisions, commitments, card to-dos, DMs), replayed through the real detectors by the Worker's unit tests. See `fixtures/README.md`.
- `runs/` — earlier results, kept as the record of what was measured.

Everything under `docs/evals/` is withheld from uno-bot by `agents/uno-bot/src/integrations/repo-read-guard.ts`, so an answer key can sit here in plain text.

The design-system baselines beside these folders (`*-baseline.json`, `focus-ring.json`, `icon-button-name.json` and the rest) are ratchets read by `npm run check:harness` and the Storybook gate. `runs/digest.jsonl` and `runs/apply-log.jsonl` are written by uno-maintain; the weekly direct-fix digest reads `digest.jsonl`.
