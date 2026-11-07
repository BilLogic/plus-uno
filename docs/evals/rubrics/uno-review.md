---
artifact: review report (stage-lens review or Design QA)
status: canonical
distilled: 2026-07-07 — from the Notion 📊 Evals doc (https://app.notion.com/p/396b7cca498281ff8a4ad0e63c621a4c), superseded per ADR-017
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
  grounding_fidelity: "0 violations of a known blueprint constraint reach review exit (Flow 2)"
  design_qa_drift_catch: ">=80% of spec-vs-implementation issues caught at Ready-for-QA rather than post-ship (baseline first)"
summary: The core eval is the golden defect set: recall says the lenses see enough, precision says they don't cry wolf, stage-appropriateness says each lens stays in its lane
---

# uno-review rubric

The core eval is the golden defect set: recall says the lenses see enough, precision says they don't cry wolf, stage-appropriateness says each lens stays in its lane. Golden scenarios: `docs/evals/scenarios/uno-review.md`.

Canonical here (ADR-017): the Notion source is lineage, not law — a conflicting legacy page gets a superseded banner via uno-maintain, never a repo re-sync.

**Since check:ds-usage (2026-11-07, ADR-039).** The mechanical share of ds-lens findings now comes from one checker, reported by rule ID, instead of the greps the 2026-07-08 golden run measured (`fixtures/uno-review-golden-run.jsonl`, S4). That run's two precision gaps, `var(--token, #hex)` fallbacks and greps read as verdicts, are rules the checker already passes or decides. Its recall layering (script, then greps, then the lenses) describes the old pipeline; the next S4 run measures the new one.
