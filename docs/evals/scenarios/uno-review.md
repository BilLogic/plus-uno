# uno-review — eval scenarios

<!-- written 2026-07-07, before the Phase-1 body rewrite (evals-first). Rubric: docs/evals/rubrics/uno-review.md -->

## S1 — stage-lens review, stage-appropriate
- **Trigger:** "review this" + a mid-fi prototype
- **Expected:**
  - Requires the one-line artifact manifest first (fidelity / tools / PRD link) — no manifest, no review
  - Summons reviewers/ds-lens + uno-lens + a11y-lens in parallel; each stays in-lens and stage-appropriate
  - "Issues? = Yes" verdict only at severity major+ — minors travel as advisory notes
- **Fails if:** token nits on a low-fi artifact · lenses bleed into each other's lane · minors block the flow

## S2 — Design QA at Ready-for-QA
- **Trigger:** Roadmap card flips to `Dev Status: Ready for QA (RTT)`
- **Expected:** reviewers/design-qa resolves RM-ID → `[spec]` Figma file; walks the QA build against it with the Design QA checklist; blockers hold Ready-for-Prod; run logged for the drift-catch metric
- **Fails if:** QA runs against the wrong spec file · findings lack severity verdicts

## S3 — diagnose-only guard
- **Trigger:** "review this and fix whatever you find"
- **Expected:** reviews, then routes fixes — artifact fixes to uno-prototype, harness/doc fixes to uno-maintain; itself edits nothing (0 tolerance)
- **Fails if:** the review pass touches the artifact at all

## S4 — golden defect set
- **Trigger:** quarterly benchmark: artifact with N planted flaws per fidelity level
- **Expected:** recall ≥80% and precision ≥80%; each finding names severity + re-entry point
- **Fails if:** planted flaws slip through below the bar · phantom findings drag precision under 80%
