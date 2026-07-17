---
name: uno-maintain
description: >
  Keeps the harness itself current. Captures a flagged issue — improvement,
  inaccuracy, inconsistency, or bug — routes it across the three estates
  (codebase, Figma, Notion) to one of eleven targets, drafts the fix, and runs the
  tiered pipeline: Tier-1 trivial fixes (typos, links, dates only) apply
  directly with a weekly-digest line; Tier-2 changes ship as a PR + PRD pair
  through Slack review to a verdict. Also runs the standing sweeps (staleness,
  hygiene, shipped watchdog) and captures lessons into docs/knowledge/. Use when
  the user says "file an intake", "this doc is stale", "the spec and Storybook
  disagree", "the skill/persona is off", "fix this typo", "run the staleness
  sweep", "document this", "capture this lesson", or after a feature ships and
  the DS/harness need reconciling.
user-invocable: true
argument-hint: [intake / sweep-name / lesson-to-capture]
allowed-tools: Read, Grep, Glob, Edit, Write, Bash, Task, mcp__notion-plus__*
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
| Post-ship reconciliation | a handoff shipped; DS + harness reconcile against built reality |

## Workflow (execution over method.md)

1. **Normalize** (method §1): classify trigger type → estate → target; record the Roadmap intake card via `writers/notion`; name evidence + suggested tier. Cross-estate disagreement → flag it, don't improvise.
2. **Draft the fix** (method §2), fix-first judge-second:
   - Repo targets (context docs, skills, persona, DS source, bot) — edit files directly in a branch. DS-source and Figma↔DS reconcile targets: execution runbook [`references/ds-fix.md`](references/ds-fix.md) (who executes what · workflows · script inventory).
   - Notion writes → `writers/notion` · Figma writes → `writers/figma` · requirement changes → `writers/blueprint` (paired PRD+blueprint, never one alone).
3. **Human gate** (method §3): present the 3-line impact / effort / risk brief; the spotter answers. Never answer it yourself.
4. **Tier and apply** (method §4–5):
   - **Tier 1** (whitelist absolute): apply, then add the one-line row for the weekly digest.
   - **Tier 2**: open the PR (git), pair the PRD (`writers/notion`), post the review request, wait for the ✅/🔁/❌ verdict. On ✅: merge/apply and write the apply-log row. Never auto-merge.
5. **Capture** (method §7): file the lesson, update `docs/knowledge/INDEX.md`, changelog line on rule adoption. Template: [`examples/lesson-template.md`](examples/lesson-template.md).

## Sweeps & audits

- Summon `reviewers/auditor` with a named checklist from the registry — `docs/conventions/automations.md` owns the sweep names (shipped watchdog · weekly Tier-1 digest · Figma hygiene · conventions integrity · comment sweep). The auditor inspects and files intakes; writers fix.
- The integrity sweep, Tier-1 digest, and shipped watchdog also run **headlessly on cron** — adapters in `scripts/prompts/uno-*/`, registry rows in `docs/conventions/automations.md`. Spot-run one with `gh workflow run <workflow-file>`; outcomes land in the Actions job summary (`gh run view`). Their findings arrive via the headless sweep queue above, so don't re-run a sweep whose issues are still undrained.
- Integrity sweep checklist: [`references/staleness-sweep.md`](references/staleness-sweep.md) (canonicality headers + agents↔docs cross-references + path integrity).
- Scored audits (rubric against an artifact) → summon `reviewers/rubric-applier`.
- Skill-quality audit (a skill is the target artifact): run [`references/skill-quality/audit-workflow.md`](references/skill-quality/audit-workflow.md) with [`references/skill-quality/checklist.md`](references/skill-quality/checklist.md) as criteria; report per `output-template.md`.

## Loads for Tier 2

- `docs/conventions/notion.md` — intake card + PRD mechanics
- `docs/conventions/slack.md` — the two gates; verdict convention is gate 2
- `docs/conventions/writing-style.md` — any human-facing text
- `docs/conventions/automations.md` — before touching anything a standing automation owns

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
