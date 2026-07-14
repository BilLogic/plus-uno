---
name: uno-review
description: >
  Diagnose-only design review with three scenarios: (1) stage-lens review of any
  artifact exiting prototyping — DS, product-intent (UNO), and accessibility
  lenses in parallel at stage-appropriate depth; (2) the handoff gate (DS / UNO /
  a11y) before a package publishes; (3) Design QA — Figma spec vs the QA build
  when a Roadmap card hits Ready for QA. Use when the user says "review this",
  "critique", "check against the design system", "poke holes", "run design QA",
  when an artifact exits uno-prototype, before uno-publish hands off, or when
  Dev Status flips to Ready for QA (RTT). Mandatory input: a one-line artifact
  manifest (fidelity / tools / PRD link). It never fixes what it finds — fixes
  route to uno-prototype (artifact) or uno-maintain (harness/docs).
user-invocable: true
argument-hint: [artifact + manifest (fidelity / tools / PRD link)]
allowed-tools: Read, Grep, Glob, Bash, Task
---

# Quality Review

## Agents it summons

reviewers/ds-lens · reviewers/uno-lens · reviewers/a11y-lens · reviewers/design-qa · reviewers/rubric-applier — defined in `agents/` (see `agents/README.md`). Per the interaction contract, these are summoned by this skill, never by users.

Poke holes in a design with a stage-aware lens. **Diagnose only — this skill never edits the artifact.** The full procedure (intake, scenarios, lens depth, severity, verdict) is `references/method.md` — normative for both faces; this file adds only IDE execution.

## When it fires

1. **Stage-lens review** — an artifact exits any `uno-prototype` path (including hand-crafted work), or the user asks for a review/critique.
2. **Handoff gate** — a handoff package is about to publish via `uno-publish`: after rails propagation, before sign-off.
3. **Design QA** — auto-triggered when the Roadmap card hits `Dev Status: Ready for QA (RTT)`; also on request ("run design QA on X").

Suggest proactively when the user says "done", "ready to share", or is about to invoke `uno-publish` — once per work session, don't repeat if declined.

## Workflow

1. **Collect the manifest** — fidelity (low / mid / high / coded) · tools · PRD link. Missing → ask for it; no manifest, no review (method.md § Intake).
2. **Load `references/method.md`** and identify the scenario (method.md § Three scenarios).
3. **Dispatch the lenses:**
   - Stage-lens / handoff gate → summon **reviewers/ds-lens + reviewers/uno-lens + reviewers/a11y-lens in parallel**, each with the artifact + manifest. Each stays in-lane at the manifest's depth — no token nits on low-fi work.
   - Design QA → summon **reviewers/design-qa** with the Roadmap card; it resolves RM-ID → `[spec]` Figma file and walks the QA build against it with the Design QA checklist.
4. **Coded artifacts:** run `bash skills/uno-review/scripts/run-review-checks.sh <dir>` and hand the hits to ds-lens as evidence (patterns: `references/catch-patterns.md`).
4b. **Figma write-back artifacts:** run `npm run validate:figma-writeback` + `npm run audit:figma-writeback` on the playground manifest; fail the review if either fails.
5. **Merge findings** — dedupe cross-lens overlaps, keep each finding's severity · lens · evidence · reference · re-entry point (method.md § Findings & severity).
6. **Verdict** per method.md § Verdict & re-entry: `Issues? = Yes` only at severity major+; minors travel as advisory; Design QA blockers hold `Ready for Prod`.
7. **Log the run** — summon **reviewers/rubric-applier** with `docs/evals/rubrics/uno-review.md`; it scores the dimensions and appends the eval-run entry. Golden scenarios this skill must pass: `docs/evals/scenarios/uno-review.md`.

## Tier-2 loads

| Trigger | Load |
|---|---|
| always | `references/method.md` |
| coded artifact | `references/catch-patterns.md` (+ the script above) · sample report shape: `examples/review-output-example.md` |
| artifact touches Storybook stories/MDX | `references/storybook.md` · `references/storybook-component-docs.md` |
| posting verdicts / sign-offs to Slack | `docs/conventions/slack.md` |

Lens rule docs (DS agent-views, `foundations/accessibility.md`, `figma-workspace.md`) are loaded by the summoned agents, not here.

## Quality bar

Scored by `docs/evals/rubrics/uno-review.md`: recall ≥80% and precision ≥80% on the golden defect set, 0 out-of-lens findings, diagnose-only hard gate. Golden scenarios: `docs/evals/scenarios/uno-review.md`.

## Constraints

- **Never edits the artifact, never offers to fix** — 0 tolerance. Fixes are explicit, separate asks: artifact → `uno-prototype`, harness/DS/docs → `uno-maintain`.
- One artifact per review; product-direction questions ("should this exist?") escalate to Bill.
- Skill-definition quality audits are **not** this skill — that path lives in `uno-maintain` (`skills/uno-maintain/references/skill-quality/`).

## Re-entry

- `Issues? = Yes` → back to the fidelity decision in `uno-prototype`; each finding names its suggested re-entry point.
- Clean handoff gate → sign-off, then `uno-publish` proceeds.
- Design QA findings → annotated issues to dev before `Ready for Prod`.
- Lesson worth keeping surfaced by the review → `uno-maintain` knowledge capture.
