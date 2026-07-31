---
status: complete
priority: p1
issue_id: "080"
tags: [code-review, post-session, prototype]
dependencies: []
---

# Block SideNav Submit after cancellation double-submit

## Problem Statement

Session-did-not-happen already submits via `handleSessionInfoNext` (sets `submitted`, calls `onSubmitted`). `canSubmit` remains true for `completedSections.cancellation`, so SideNav Submit can fire `handleSubmit()` again and mark form-feedback complete with the wrong payload.

## Findings

- `ReflectionFlow.jsx` ~64–72, 137–143, 199–209, 331
- TypeScript reviewer: P1

## Proposed Solutions

### Option 1: Disable/hide Submit when cancelled or already submitted (recommended)

**Approach:** `canSubmit = !cancelled && !submitted && …`; SideNav respects it.

**Effort:** Small

**Risk:** Low

### Option 2: Separate cancellation completion UI

**Approach:** After cancel path, skip nav submit entirely and only show reflection-submitted modal.

**Effort:** Small

**Risk:** Low

## Recommended Action

## Acceptance Criteria

- [ ] After “session did not happen” path, SideNav Submit cannot fire a second submit
- [ ] Reflection submitted modal still shows once

## Work Log

- 2026-07-31: Flagged in `/ce:review` TS reviewer
