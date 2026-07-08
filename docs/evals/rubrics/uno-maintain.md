---
artifact: intake record · Tier-2 PR+PRD proposal · review post
source: https://app.notion.com/p/396b7cca498281ff8a4ad0e63c621a4c
synced: 2026-07-07
applied_by: agents/reviewers/rubric-applier
scale: 1-5 per dimension; hard gates are pass/fail and override the score
dimensions:
  - id: capture-quality
    definition: intake normalized into the routing taxonomy (correct target of 11, first time — >=90% on the seeded set)
  - id: pair-quality
    definition: PR+PRD pair carries rationale sufficient to decide without follow-up
  - id: self-sufficiency
    definition: reviewer follow-up questions before verdict — target median 0
hard_gates:
  - 0 Tier-2 changes applied without a Slack verdict (audit merge log vs #plus-design; the Tier-1 whitelist applies verdict-free by design, logged to the digest)
  - accepted changes ship as a PR+PRD PAIR, never one alone (100%)
benchmark: >
  Seeded issue set (one per taxonomy target, 10 total) → measure routing
  accuracy and proposal quality.
targets:
  intake_to_proposal: "<=1 day"
  proposal_acceptance: ">=70% of Flow-5 verdicts are Approve or Request-changes"
  regression_rate: "<5% of merged harness changes later reverted"
---

# uno-maintain rubric

Scores the maintenance pipeline end to end: intake routing, proposal quality, and the verdict gate. The Slack-verdict gate is absolute — an auto-applied Tier-2 change is a rubric fail and a forbidden-pattern violation. Golden scenarios: `docs/evals/scenarios/uno-maintain.md`.

Canonical here (ADR-017): the Notion source is lineage, not law — a conflicting legacy page gets a superseded banner via uno-maintain, never a repo re-sync.
