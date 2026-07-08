---
artifact: share-out bundle (feedback rail) · handoff package (handoff rail) · marketplace entry
source: https://app.notion.com/p/396b7cca498281ff8a4ad0e63c621a4c
synced: 2026-07-07
applied_by: agents/reviewers/rubric-applier
scale: 1-5 per dimension; hard gates are pass/fail and override the score
dimensions:
  - id: bundle-completeness
    definition: all required pieces present — Loom + preview + feedback prompt; replica required when the artifact is a prototype (target 100%)
  - id: replica-fidelity
    definition: visual diff of the Figma replica vs the prototype
  - id: shareout-clarity
    definition: reviewer can act without asking a clarifying question (<=3 feedback questions + NOT-looking-for line, per docs/conventions/slack.md)
  - id: handoff-spec-completeness
    definition: every component has tokens, states, behaviors enumerated
hard_gates:
  - rails propagation happened and matches the spec (storybook + blueprint updated before marketplace publish)
  - marketplace entry validates against the DB schema
benchmark: >
  Fixed prototype → full feedback-rail bundle + full handoff-rail package; audit both.
targets:
  handoff_first_pass: ">=70% pass DS / UNO / a11y first try"
  handoff_rework: "trend to <=2 dev clarification requests per handoff"
  design_efficacy: "each shipped handoff names a user-behavior hypothesis and checks it in Clarity/Metabase ~30 days post-ship"
---

# uno-publish rubric

Scores both rails. Bundle completeness is a hard gate in the skill itself — an incomplete bundle never posts; this rubric audits that the gate held. Golden scenarios: `docs/evals/scenarios/uno-publish.md`.

Canonical here (ADR-017): the Notion source is lineage, not law — a conflicting legacy page gets a superseded banner via uno-maintain, never a repo re-sync.
