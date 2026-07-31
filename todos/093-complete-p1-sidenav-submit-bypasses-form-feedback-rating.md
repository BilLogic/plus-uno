---
status: complete
priority: p1
issue_id: "093"
tags: [code-review, post-session, prototype, quality]
dependencies: ["090", "091"]
---

# SideNav Submit bypasses Form Feedback rating gate

## Problem Statement

`canSubmit` only checks prior-step prerequisites, not Form Feedback `rating >= 1`. Footer Submit on Form Feedback is gated by the form; SideNav `onSubmit={() => handleSubmit()}` with no payload submits while already on `form-feedback` without validating rating.

## Findings

- [kieran-typescript-reviewer](e2581c19-4c7b-4a77-b2f6-00e4e6a2ec0b): `ReflectionFlow.jsx` ~265–280, ~442; `FormFeedbackForm.jsx` ~86–87
- Prior 090 fixed canSubmit deadlock by *removing* form-feedback from prerequisites — left nav Submit ungated on rating

## Proposed Solutions

### Option 1: Require rating when Form Feedback shown (recommended)

**Approach:** In `handleSubmit`, if `showFormFeedback`, require `(data || formFeedback).rating >= 1` (or navigate to form-feedback and no-op). Optionally disable SideNav Submit until rating set when on that step.

**Effort:** Small

**Risk:** Low

### Option 2: SideNav Submit only navigates; form owns submit

**Approach:** Nav Submit always `setActiveTab('form-feedback')` when cadence on; only form `onSubmit(data)` finalizes.

**Effort:** Small–Medium

**Risk:** Low

## Recommended Action

## Acceptance Criteria

- [ ] Cannot finalize submit with empty Form Feedback rating when cadence sections are shown
- [ ] SideNav and footer Submit stay consistent
- [ ] Cadence-off path (no Form Feedback) still submits after Session Reflection

## Work Log

- 2026-07-31: Flagged in second-pass `/ce:review` of PR #88

## Resources

- PR: https://github.com/BilLogic/plus-uno/pull/88
