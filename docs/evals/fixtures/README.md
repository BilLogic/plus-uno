# evals/fixtures — golden inputs

Fixed inputs the benchmarks run against — same inputs, comparable outputs across skill revisions. A rubric benchmark that names no fixture is unmeasurable (found by the 2026-07-08 golden runs).

| Skill | Fixture | Answer key |
|---|---|---|
| uno-synthesize | `uno-synthesize-bundle/` — 3 sources (Slack thread · transcript · analytics) | `uno-synthesize-bundle/answer-key/reference-findings.md` — diff coverage against it |
| uno-prototype | `uno-prototype-seeds/` — 3 deliberately incomplete PRDs spanning fidelities | adjacent `*.answers.md` files — plain text, withheld from the bot by the read guard |
| uno-review | `prototypes/home-redesign/src` (pre-existing defects as planted flaws) | the 2026-07-08 run: `docs/evals/runs/2026-07-08-golden-uno-review.jsonl` (9 defects vs AGENTS.md FP-1/2/6; full-procedure recall 100%, script-only 44%) |
| uno-maintain | seeded issue set defined inline in `docs/evals/scenarios/uno-maintain.md` S5 (11 targets + 1 cross-estate) | the taxonomy table in `skills/uno-maintain/references/method.md` |
| uno-bot | `uno-bot-cases.json` — prompts, deterministic checks, and each case's `judgeNote` | the `judgeNote` beside each case — plain text, withheld from the bot by the read guard |

Fixtures are frozen: revise only when the thing they test changes, and note it in the fixture header — a moving fixture measures nothing.

## Why the answer keys are in plain text

Everything under `docs/evals/` is refused to uno-bot. `github_read` and `source_read` are its only two routes into this repository, and both consult `agents/uno-bot/src/integrations/repo-read-guard.ts` before fetching; a search that would return one of these paths drops it from the results. **Anything added to this directory is protected by being here** — no key, no ceremony.

This replaced an encrypted answer key, and the reasons are worth keeping because both mistakes are easy to repeat.

**Encryption never removed the exposure.** Every `judgeNote` is still in plain text in public git history at `02776be3^`, and `githubReadPath` takes a `ref`. Sealing the tip closed a door the bot could walk around one commit earlier. The guard is about the fetch rather than the file, so it holds at every ref, history included.

**And the key went to a write-only place.** It was stored only as a GitHub Actions secret, which cannot be read back. Within a day nobody could open the rubric — not the author, not a reviewer, not the person deciding whether a case asserted the right thing. Two cases' assertions were lost outright and had to be rewritten. An eval suite whose assertions cannot be read cannot be maintained.

This is not a security boundary and does not pretend to be one: this repository is public and anyone with a browser can read these files. It governs one client on purpose. It is the eval equivalent of not handing a student the marking scheme — the point is the measurement's validity, not secrecy.

**Adding a case:** write its `judgeNote` beside it. `scripts/eval-fixture.test.mjs` fails a case with no rubric, and `tests/repo-read-guard.test.ts` fails if the guard ever stops covering this directory — that one goes red *before* the rubric becomes readable to the thing being graded.
