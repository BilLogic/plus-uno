---
name: uno-maintain
description: >
  Keeps the harness itself current. Captures a flagged issue — improvement,
  inaccuracy, inconsistency, or bug — routes it across the four estates
  (codebase, Figma, Notion, Supabase/blueprint) to one of twelve targets, drafts the fix, and runs the
  tiered pipeline: Tier-1 trivial fixes (typos, links, dates only) apply
  directly with a weekly-digest line; Tier-2 changes ship as a PR + PRD pair
  through Slack review to a verdict. Also runs the standing sweeps (staleness,
  hygiene, shipped watchdog) and captures lessons into docs/knowledge/. Use when
  the user says "file an intake", "this doc is stale", "the spec and Storybook
  disagree", "the skill/persona is off", "fix this typo", "run the staleness
  sweep", "document this", "capture this lesson", or after a feature ships and
  the DS/harness need reconciling.
argument-hint: "[intake / sweep-name / lesson-to-capture]"
allowed-tools: Read, Grep, Glob, Edit, Write, Bash, Task, mcp__notion-plus__*
embodiment: ide
summary: Fix the harness, not project design work
---

# uno-maintain — IDE face

Fix the harness, not project design work. The shared procedure — taxonomy, tiers, gates — lives in **[`references/method.md`](references/method.md)**; load it first. This file adds in-IDE execution.

## Intake sources

| Source | Arrives as |
|---|---|
| Human spot | "this is wrong / stale / off" — any of the four trigger types |
| Auditor sweep | `reviewers/auditor` files intakes from a named registry checklist |
| Headless sweep queue | open GitHub issues labeled `harness-intake` (filed by the cron sweeps — method §1 headless surrogate). **Drain first on every maintain session**: `gh issue list --label harness-intake --state open`, triage each into the pipeline, close as incorporated |
| DS gap from prototyping | `uno-prototype` hits a missing/broken component or token |
| Legacy-source conflict | a legacy Notion/Figma page contradicts repo-canonical `docs/conventions/*` (method §6) |
| Post-ship reconciliation | a handoff shipped; DS + harness **+ blueprint** reconcile against built reality (ship-time is when the blueprint must be updated — the paired-write contract, `docs/connectors/supabase/overview.md`) |

## Workflow (execution over method.md)

1. **Normalize** (method §1): classify trigger type → estate → target; record the Roadmap intake card via `writers/notion`; name evidence + suggested tier. Cross-estate disagreement → flag it, don't improvise.
2. **Draft the fix** (method §2), fix-first judge-second:
   - Repo targets (context docs, skills, persona, DS source, bot) — edit files directly in a branch. DS-source and Figma↔DS reconcile targets: execution runbook [`references/ds-fix.md`](references/ds-fix.md) (who executes what · workflows · script inventory).
   - Notion writes → `writers/notion` · Figma writes → `writers/figma` · requirement changes → `writers/blueprint` (paired PRD+blueprint, never one alone) · blueprint-stale-vs-reality (no requirement doc) → `writers/blueprint` solo, PRD only when one exists for the flow.
3. **Human gate** (method §3): present the 3-line impact / effort / risk brief; the spotter answers. Never answer it yourself.
4. **Tier and apply** (method §4–5):
   - **Tier 1** (whitelist absolute): apply, then add the one-line row for the weekly digest.
   - **Tier 2**: open the PR (git), pair the PRD (`writers/notion`), post the review request, wait for the ✅/🔁/❌ verdict. On ✅: merge/apply and write the apply-log row. Never auto-merge.
5. **Capture** (method §7): file the lesson, update `docs/knowledge/INDEX.md`, changelog line on rule adoption. Template: [`examples/lesson-template.md`](examples/lesson-template.md).

## Sweeps & audits

Running or triaging a standing sweep, a scored audit, or a skill-quality audit
→ load [`references/sweeps.md`](references/sweeps.md). Ordinary intakes never
need it.

## Loads for Tier 2

- `docs/connectors/notion.md` — intake card + PRD mechanics
- `docs/connectors/slack.md` — the two gates; verdict convention is gate 2
- `docs/engineering/operations.md` — before touching anything a standing automation owns

## Quality bar

Rubric: `docs/evals/rubrics/uno-maintain.md` (applied by `reviewers/rubric-applier`) · golden scenarios: `docs/evals/scenarios/uno-maintain.md`. The hard gates are absolute: zero changes applied without a Slack verdict, and accepted changes ship as a PR+PRD pair — a failed gate fails the run regardless of scores.

## Agents it summons

`reviewers/auditor` · `reviewers/rubric-applier` · `researchers/source-miner` (intake evidence: did it happen, how often) · `writers/notion` · `writers/figma` · `writers/blueprint` — defined in `agents/` (see `agents/README.md`). Summoned by this skill, never by users.

## Constraints

- Never self-approve a substantive change; never answer the worth-incorporating gate; never auto-merge on silence.
- The Tier-1 whitelist is absolute — skills, persona, DS components, and requirements are always Tier 2.
- A lone PR or lone PRD never ships; every execution writes its apply-log row.
- Lessons go under `docs/knowledge/` — never `docs/solutions/` (reserved for other tools).
- Maintains the harness only — design-work fixes route back through `uno-prototype`; diagnosis-only reviews stay in `uno-review`.
