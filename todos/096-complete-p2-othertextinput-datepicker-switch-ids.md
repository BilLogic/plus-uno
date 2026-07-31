---
status: complete
priority: p2
issue_id: "096"
tags: [code-review, post-session, security, a11y, foundations]
dependencies: ["088"]
---

# Unique IDs: OtherTextInput, DatePicker, Switch type lock

## Problem Statement

Multiple Other fields share default `id='other-text-input'`. DatePicker falls back to `date-picker` / `date-picker-calendar` without `useId`. Foundations Switch spreads `{...props}` after `type="switch"` so callers can clobber type; no `useId` fallback.

## Findings

- [security-sentinel](609d51af-378e-4d15-a82e-ce0a467ec9dc): OtherTextInput / MultiSelect / NoRecordingReason; DatePicker ~284; Switch ~56–70

## Proposed Solutions

### Option 1: useId + lock Switch type (recommended)

**Approach:** `useId` in OtherTextInput/DatePicker/Switch; MultiSelect passes `${questionId}-other`; Switch destructures/forbids `type` and spreads props before explicit attrs.

**Effort:** Small–Medium

**Risk:** Low

## Recommended Action

## Acceptance Criteria

- [ ] ≥2 Other fields on Student Reflection produce unique DOM ids
- [ ] Two DatePickers without id do not share `aria-controls`
- [ ] `<Switch type="checkbox" />` cannot override switch type

## Work Log

- 2026-07-31: Flagged in second-pass `/ce:review` of PR #88

## Resources

- PR: https://github.com/BilLogic/plus-uno/pull/88
