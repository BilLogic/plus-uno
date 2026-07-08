---
artifact: research output (study guide + preliminary analysis + SME identification)
source: https://app.notion.com/p/396b7cca498281ff8a4ad0e63c621a4c
synced: 2026-07-07
applied_by: agents/reviewers/rubric-applier
scale: 1-5 per dimension; hard gates are pass/fail and override the score
dimensions:
  - id: study-guide-quality
    definition: clear objectives, unbiased questions, right participant criteria
  - id: analysis-scoping
    definition: analysis stays "preliminary" and answers the go/no-go question — no over-scoped deep dives
  - id: sme-precision
    definition: the right knowledge-holder identified first try
hard_gates:
  - study guide exists in Notion BEFORE any SME conversation (sequencing check)
benchmark: >
  Seeded fuzzy hunch ("tutors seem to churn after month 2?") → produce a study
  guide + data-analysis plan; score against the dimensions above.
---

# uno-research rubric

Scores the research skill's outputs. Scored 1–5 per dimension by one human reviewer (two at the annual calibration run); results land in `docs/evals/runs/` until the Notion Eval Runs DB exists. Golden scenarios: `docs/evals/scenarios/uno-research.md`.

Canonical here (ADR-017): the Notion source is lineage, not law — a conflicting legacy page gets a superseded banner via uno-maintain, never a repo re-sync.
