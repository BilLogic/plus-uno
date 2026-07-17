---
status: complete
priority: p2
issue_id: 020
tags: [code-review, harness, validation-loop]
dependencies: []
created: 2026-07-16
source: ce-review round 2026-07-16 (loop-engineering change set — architecture + agent-native reviewers)
---

# Give the headless codegen adapters the method §6 validation loop

## Problem
`skills/uno-prototype/references/method.md` §6 now defines a bounded validation loop ("the contract for every other runtime"), but the two live headless faces that produce coded artifacts — `scripts/prompts/uno-implement/SKILL.md` and `scripts/prompts/uno-implement-design/SKILL.md` (dispatched by `figma-implement*.yml`) — name no check set and run zero machine checks before opening their draft PRs. A human-driven prototype gets a 3-attempt loop; autonomous PRs get nothing. §6 currently carries an explicit "known exemption" note pointing at this todo-shaped gap.

## Proposed solution
Name each adapter's check set with the same 3-attempt cap: `validate-prototype.sh` for uno-implement-design; a build/story-test pass for uno-implement (or run the checks as a deterministic workflow post-step and put failures in the PR description). Then delete the exemption sentence from method §6.

## Acceptance
- [ ] Both implement adapters (or their workflows) run named machine checks before the PR opens, with a 3-attempt cap
- [ ] method §6's "known exemption" note removed
- [ ] `figma-implement.yml` dry-run (workflow_dispatch) produces a PR whose description records check results
