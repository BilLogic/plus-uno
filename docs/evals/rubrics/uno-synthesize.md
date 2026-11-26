---
artifact: findings doc + PRD (+ paired blueprint write)
status: canonical
applied_by: agents/reviewers/rubric-applier
scale: 1-5 per dimension; hard gates are pass/fail and override the score
dimensions:
  - id: faithfulness
    definition: 0 hallucinated findings — a single hallucination is an automatic fail
  - id: coverage
    definition: all key source inputs represented in the synthesis
  - id: template-conformance
    definition: PRD follows the Notion PRD template (Templates #, see docs/connectors/notion/page-writing.md)
  - id: traceability
    definition: PRD claims trace to documented findings (target 100% of key claims)
hard_gates:
  - blueprint write is schema-valid (automated check once the Supabase schema lands)
  - PRD and blueprint update TOGETHER — a lone write to either fails, UNLESS the blueprint half is flagged ⏳ pending per supabase.md's MCP-unavailable fallback with the intake filed
benchmark: >
  Fixed bundle of 3 sources (Slack thread + transcript + analytics pull) →
  findings doc + PRD; diff against a reference synthesis for coverage.
targets:
  prd_acceptance_rate: ">=80% enter Flow 2 without major rework"
  evidence_traceability: "100% of key claims"
summary: Scores synthesis outputs
---

# uno-synthesize rubric

Scores synthesis outputs. Faithfulness is the spine: one invented finding fails the run regardless of other scores. Golden scenarios: `docs/evals/scenarios/uno-synthesize.md`.

