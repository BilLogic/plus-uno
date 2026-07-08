<!-- Shared procedure — loaded by both faces (SKILL.md in the IDE, bot.md in the Worker). Runtime-neutral: no tool calls, no surface formatting. -->

# uno-review — method

Poke holes in a design at the right depth for its stage. **Diagnose only — this skill never edits the artifact** (rubric hard gate, 0 tolerance). Fixes are separate asks the designer makes explicitly: artifact fixes route to `skills/uno-prototype`, harness/DS/doc fixes to `skills/uno-maintain`.

## Intake — the artifact manifest (mandatory)

Every review starts from a one-line manifest: **fidelity (low / mid / high / coded) · tools used · PRD link**. Every prototyping path exit produces one; for hand-crafted work the designer supplies it. No manifest → ask for it before reviewing — the manifest is what makes the review stage-appropriate. One artifact per review; no side-by-side comparisons.

## Three scenarios

| Scenario | Fires when | Lenses |
|---|---|---|
| **Stage-lens review** (Flow 2, step 4) | an artifact exits any prototyping path — including hand-crafted work — or the user asks for a review/critique | ds-lens + uno-lens + a11y-lens, in parallel |
| **Handoff gate** (Flow 3, H4) | a handoff package is about to publish — after rails propagation, before sign-off | same three lenses in parallel; uno-lens additionally checks the spec against what was just propagated to uno-storybook / uno-blueprint |
| **Design QA** (Flow 3, H7) | the Roadmap card hits `Dev Status: Ready for QA (RTT)` — auto-triggered | design-qa solo: resolve RM-ID → `[spec]` Figma file, walk the QA build against it with the Design QA checklist |

## Lens dispatch — parallel, in-lane, stage-appropriate

Lenses run **in parallel** and stay in-lane — no lens comments outside its own scope. Each lens confirms the manifest's fidelity tier first and reviews at that depth:

| Fidelity | In scope | Exempt |
|---|---|---|
| low (FigJam flows, sketches, paper) | flow logic, structure, product intent, structural a11y (reading order, labeled steps) | tokens, components, visual polish |
| mid (interactive drafts) | the above + layout patterns, interaction behavior, terminology, content voice | token-level fidelity, prop correctness |
| high / coded | everything: tokens vs hardcoded values, real DS components with verified props, computed contrast, focus behavior, forbidden patterns | — |

What each lens applies (the rules live in the docs, not here):

- `reviewers/ds-lens` — components / tokens / layout vs the DS cheat-sheets and AGENTS.md forbidden patterns. Coded artifacts: also the catch-pattern greps (`references/catch-patterns.md`, automated by `scripts/run-review-checks.sh`).
- `reviewers/uno-lens` — artifact vs PRD + uno-blueprint constraints, queried live at review time.
- `reviewers/a11y-lens` — `docs/context/design-system/foundations/accessibility.md`: WCAG AA contrast, 44×44 targets, keyboard reach, focus order + visibility, semantic HTML / screen readers, color-not-alone, reduced motion.
- `reviewers/design-qa` — the `[spec]` frames' Dev Mode annotations (`docs/conventions/figma-workspace.md`) + the Design QA checklist (Notion 🧩 Templates): components, tokens, spacing, typography, states, interaction behavior.

## Findings & severity

Every finding carries **severity · lens · evidence (what's in the artifact) · reference (the doc/rule it violates) · suggested re-entry point**. No evidence, no finding; low-confidence findings are omitted, not hedged — 3 strong findings beat 7 mushy ones. "What's working" is mandatory: 1–3 specific strengths with citations, so designers know what to keep. Zero findings is a valid result.

| Severity | Meaning | Effect |
|---|---|---|
| **blocker** | forbidden pattern, WCAG AA break, non-existent component or prop, spec contradiction | flips the gate; in Design QA, holds `Ready for Prod` |
| **major** | unjustified divergence from PRD / DS patterns, hierarchy skipping, missing required state | flips the gate |
| **minor** | terminology drift, copy-case, polish | advisory — travels with the artifact, never blocks |

## Verdict & re-entry

- **Stage-lens:** `Issues? = Yes` **only when at least one finding is major or above.** Yes → re-enter at the fidelity decision — a failed review can invalidate the approach, not just the artifact; each finding's re-entry point says which (re-choose fidelity vs. content fix). No → "Ready to share?" stays the designer's call; review passing is necessary, not sufficient.
- **Handoff gate:** any major+ finding holds the publish; clean or minors-only → proceed to dev / PM / stakeholder sign-off.
- **Design QA:** findings go to dev as annotated issues *before* `Ready for Prod`; blockers hold it. The run is logged for the drift-catch metric.
- Verdicts and sign-offs posted in Slack follow `docs/conventions/slack.md` (channels + the two gates — never conflate them).
- Pushback on a finding → re-read the cited doc; concede or stand by it with reasoning. Never dig in on thin evidence.

## Quality bar

`reviewers/rubric-applier` scores each run against `docs/evals/rubrics/uno-review.md` and appends it to the eval log: recall ≥80% and precision ≥80% on the golden defect set, 0 out-of-lens findings, diagnose-only hard gate. Design QA target: ≥80% of spec-vs-implementation drift caught at Ready-for-QA rather than post-ship.
