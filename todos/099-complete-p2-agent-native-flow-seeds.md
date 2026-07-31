---
status: complete
priority: p2
issue_id: "099"
tags: [code-review, post-session, storybook, agent-native]
dependencies: ["089", "095"]
---

# ReflectionFlow seeds: filled-low, cadence-off submit-ready, Controls honesty

## Problem Statement

Agents still need long UI walks for: Other+escalate in Flow, cadence-off submit-ready, and Saved modal (after 095). Named page stories ignore meta `formState` Controls. `initialTab` + cadence-off can blank the canvas.

## Findings

- [agent-native-reviewer](0e4b514e-5625-41f5-8af3-c027cdc64929)
- Student page has `filledLow`; Flow does not
- `WithoutCadenceSections` starts empty

## Proposed Solutions

### Option 1: Dedicated Flow stories + fix Controls scope (recommended)

**Approach:** Add `FilledLowStudent` and cadence-off submit-ready seeds; Saved-on-mount after 095; wire Overview-only `formState` or hide Controls on named stories; clamp `initialTab` when cadence flags off.

**Effort:** Medium

**Risk:** Low

## Recommended Action

## Acceptance Criteria

- [ ] Flow story can open filled-low student state without chip walk
- [ ] Cadence-off story can reach Submit-ready without filling every step
- [ ] Named page stories do not show dead formState Controls (or they work)
- [ ] Cadence off + Self/Form tab does not render blank body

## Work Log

- 2026-07-31: Flagged in second-pass `/ce:review` of PR #88

## Resources

- PR: https://github.com/BilLogic/plus-uno/pull/88
