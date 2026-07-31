---
status: complete
priority: p1
issue_id: "090"
tags: [code-review, post-session, prototype]
dependencies: ["080"]
---

# Fix SideNav Submit `canSubmit` deadlock when Form Feedback is on

## Problem Statement

`canSubmit` requires `completedSections['form-feedback']`, but that flag is only set inside `handleSubmit`. SideNav Submit therefore never enables for the normal happy path when `showFormFeedback` is true — Submit is deadlocked until after submit has already happened via the form footer.

## Findings

- [Prototype flow](03b2e60b-3bd8-4adf-8f03-a6317032ec56): P1
- `ReflectionFlow.jsx` ~64–72, 199–209, 327–331
- Distinct from `080` (cancellation double-submit); this is the opposite bug — Submit never enables

## Proposed Solutions

### Option 1: canSubmit = prerequisites minus form-feedback (recommended)

**Approach:** Enable SideNav Submit when Session Info + students + Session (+ Self if shown) are complete. Form Feedback completion is the act of submitting (footer or SideNav), not a prerequisite. When `showFormFeedback`, SideNav Submit should either navigate to form-feedback if incomplete fields, or call the same submit path as the footer once that step’s local validation passes.

**Effort:** Small–Medium

**Risk:** Low

### Option 2: Mark form-feedback “ready” when user reaches the step with valid fields

**Approach:** FormFeedbackForm reports validity upward; `canSubmit` uses that signal.

**Effort:** Medium

**Risk:** Low

## Recommended Action

## Acceptance Criteria

- [ ] With Form Feedback on, after completing prior steps, SideNav Submit can be enabled without having already submitted
- [ ] Submit still blocked when Session Info / students / Session / Self incomplete
- [ ] Cancellation path still covered by `080`

## Work Log

- 2026-07-31: Added from Prototype flow requirements agent after `/ce:review`

## Resources

- `ReflectionFlow.jsx`
