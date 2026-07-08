---
artifact: findings doc + PRD (+ paired blueprint write)
source: https://app.notion.com/p/396b7cca498281ff8a4ad0e63c621a4c
synced: 2026-07-07
applied_by: agents/reviewers/rubric-applier
scale: 1-5 per dimension; hard gates are pass/fail and override the score
dimensions:
  - id: faithfulness
    definition: 0 hallucinated findings — a single hallucination is an automatic fail
  - id: coverage
    definition: all key source inputs represented in the synthesis
  - id: template-conformance
    definition: PRD follows the Notion PRD template (Templates #, see docs/conventions/notion.md)
  - id: traceability
    definition: PRD claims trace to documented findings (target 100% of key claims)
hard_gates:
  - blueprint write is schema-valid (automated check once the Supabase schema lands)
  - PRD and blueprint update TOGETHER — a lone write to either fails (docs/conventions/supabase.md)
benchmark: >
  Fixed bundle of 3 sources (Slack thread + transcript + analytics pull) →
  findings doc + PRD; diff against a reference synthesis for coverage.
targets:
  prd_acceptance_rate: ">=80% enter Flow 2 without major rework"
  evidence_traceability: "100% of key claims"
---

# uno-synthesize rubric

Scores synthesis outputs. Faithfulness is the spine: one invented finding fails the run regardless of other scores. Golden scenarios: `docs/evals/scenarios/uno-synthesize.md`.

Canonical here (ADR-017): the Notion source is lineage, not law — a conflicting legacy page gets a superseded banner via uno-maintain, never a repo re-sync.
