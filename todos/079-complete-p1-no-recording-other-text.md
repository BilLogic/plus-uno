---
status: complete
priority: p1
issue_id: "079"
tags: [code-review, post-session, figma, prototype]
dependencies: []
---

# No Recording Reason: Other requires short text input

## Problem Statement

Figma Upload / No Recording Reason annotations: selecting Other reveals a short text input; path-2 completion requires that detail. `NoRecordingReason` is select-only; `SessionInfo` accepts reason `"Other"` with no detail.

## Findings

- Figma `10925:11334` + Upload `7486:93070`
- `NoRecordingReason.jsx`: Select only; options include `'Other'`
- `SessionInfo` `recordingOk` does not require Other detail text

## Proposed Solutions

### Option 1: Compose OtherTextInput when Other selected (recommended)

**Approach:** When value === Other, show short text field; gate Next/Save until non-empty. Mirror MultiSelect Other pattern.

**Effort:** Small–Medium

**Risk:** Low

### Option 2: Inline TextField inside NoRecordingReason

**Approach:** Self-contained organism with `otherDetail` prop.

**Effort:** Medium

**Risk:** Low

## Recommended Action

## Acceptance Criteria

- [ ] Other reveals short text input
- [ ] Session Info cannot proceed on Other without detail
- [ ] Story covers Other + detail state

## Work Log

- 2026-07-31: Flagged in `/ce:review` Figma fidelity agent

## Resources

- Figma `10925:11334`, `7486:93070`
