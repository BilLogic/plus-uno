---
artifact: prototype (any fidelity tier) + its prompt-spec
source: https://app.notion.com/p/396b7cca498281ff8a4ad0e63c621a4c
synced: 2026-07-07
applied_by: agents/reviewers/rubric-applier
scale: 1-5 per dimension; hard gates are pass/fail and override the score
dimensions:
  - id: grounding-completeness
    definition: blueprint constraints reflected; 0 violations of a known blueprint constraint
  - id: prompt-spec-quality
    definition: external-tool generation usable with <=1 regeneration
  - id: ds-compliance
    definition: components/tokens sourced from BS4 / uno-storybook, >=95%; never invented
  - id: fidelity-appropriateness
    definition: didn't gold-plate a low-fi ask (or under-build a hi-fi one)
hard_gates:
  - missing-context prompts fire on deliberately incomplete requests (100% catch on the seeded set)
  - gap protocol fires when a needed BS4 component doesn't exist — 0 silent inventions
benchmark: >
  Fixed PRD → one low-fi, one mid-fi, one hi-fi artifact; score each tier separately.
targets:
  first_pass_review_rate: "40-70% band — near-100% means the review lens is too lax, near-0% means prototyping is misfiring"
  iterations_to_ready: "<=3"
---

# uno-prototype rubric

Scores prototypes per fidelity tier. The two gates are the skill's reason to exist: ask when context is missing, escalate when the design system has a gap — never silently invent. Golden scenarios: `docs/evals/scenarios/uno-prototype.md`.

If a live read of the source page contradicts this file, prefer the source and file a uno-maintain intake.
