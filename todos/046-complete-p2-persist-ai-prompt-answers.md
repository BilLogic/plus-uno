---
status: completed
priority: p2
issue_id: "046"
tags: [code-review, quality, agent-native, post-session]
dependencies: []
---

# Persist AI prompted question answers in the flow

## Problem Statement

When `aiState === 'ready'`, `AiPromptedQuestionBox` is mounted without `value`/`onChange`, so answers never enter the student reflection snapshot / `onNext`. Agents and humans cannot complete that field meaningfully.

## Findings

- `StudentReflectionFormV2.jsx` (~92–93) renders AI box without controlled binding.
- Agent-native review: AI answer is dead in the flow.

## Proposed Solutions

### Option 1: Controlled field on form state (recommended)

**Approach:** Store `aiAnswer` on student form state; pass value/onChange; include in snapshot.

**Pros:** Real parity with Figma default state.
**Cons:** Small form-state shape change.
**Effort:** Small
**Risk:** Low

### Option 2: Hide AI box until wired

**Approach:** Don’t show ready state until persistence exists.

**Pros:** Avoids fake UX.
**Cons:** Catalog/demo loses AI interaction.
**Effort:** Small
**Risk:** Low

## Recommended Action

**To be filled during triage.**

## Technical Details

**Affected files:**
- `Sections/StudentReflectionForm/StudentReflectionFormV2.jsx`
- `Pages/ReflectionFlow/ReflectionFlow.jsx` (if snapshot shape lives there)

## Acceptance Criteria

- [x] Typing in AI box updates form state
- [x] Answer survives Next / student switch rules as designed
- [x] Empty/loading/ready states still work

## Work Log

### 2026-07-30 - Code review

**By:** CE review (PR #81)

## Resources

- **PR:** https://github.com/BilLogic/plus-uno/pull/81
