---
artifact: review report (stage-lens review or Design QA)
source: https://app.notion.com/p/396b7cca498281ff8a4ad0e63c621a4c
synced: 2026-07-07
applied_by: agents/reviewers/rubric-applier
scale: recall/precision measured on the golden defect set; other dimensions 1-5; hard gates pass/fail
dimensions:
  - id: recall
    definition: "% of planted flaws found on the golden defect set — target >=80%"
  - id: precision
    definition: "% of reported issues that are real — target >=80%"
  - id: stage-appropriateness
    definition: 0 out-of-lens findings (e.g. token nits on a paper wireframe)
  - id: actionability
    definition: each finding names severity + suggested re-entry point
hard_gates:
  - diagnose-only — the skill NEVER edits the artifact (0 tolerance)
benchmark: >
  Golden defect set — artifacts with N planted flaws per fidelity level;
  measure recall and precision per lens (DS / UNO / a11y / Design QA).
targets:
  design_qa_drift_catch: ">=80% of spec-vs-implementation issues caught at Ready-for-QA rather than post-ship (baseline first)"
---

# uno-review rubric

The core eval is the golden defect set: recall says the lenses see enough, precision says they don't cry wolf, stage-appropriateness says each lens stays in its lane. Golden scenarios: `docs/evals/scenarios/uno-review.md`.

If a live read of the source page contradicts this file, prefer the source and file a uno-maintain intake.
