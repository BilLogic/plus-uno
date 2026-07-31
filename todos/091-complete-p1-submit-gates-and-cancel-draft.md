---
status: complete
priority: p1
issue_id: "091"
tags: [code-review, post-session, prototype, figma]
dependencies: ["077", "081"]
---

# Enforce submit gates + persist draft from Cancel → Save & Exit

## Problem Statement

1. Form Feedback footer `onSubmit={handleSubmit}` does not check orchestrator `canSubmit` / prior-step completion. With ungated SideNav tabs (`081`), users can jump to Form Feedback and submit without Session Info / Students / Session / Self.
2. Cancel opens the exit modal via `openSaveExit()` with **no** draft snapshot; choosing “Save & Exit” calls `handleSaveAndExitConfirm` which only persists when `draftSnapshot` is set — so Cancel → Save & Exit discards in-progress form data.

## Findings

- [Prototype flow](03b2e60b-3bd8-4adf-8f03-a6317032ec56): P1s #2–#3
- `ReflectionFlow.jsx` ~228–230, 103–120, 277–285
- Related: `077` (Saved modal type), `082` (dirty Cancel), `081` (tab gating)

## Proposed Solutions

### Option 1: Gate handleSubmit + snapshot on Cancel (recommended)

**Approach:**
- `handleSubmit` early-returns unless prerequisites complete (same rules as fixed `canSubmit` from `090`, excluding form-feedback chicken-egg).
- On Cancel, either pass current step snapshot into `openSaveExit(snapshot)` (forms expose getSnapshot / Cancel receives data), or lift dirty field state so Save & Exit from the discard modal can persist.

**Effort:** Medium

**Risk:** Medium (needs form Cancel API change)

### Option 2: Remove Save & Exit from discard modal

**Approach:** Discard modal only exits without saving; Save & Exit only via NavigationButtons (already passes snapshot). Matches a stricter reading of Figma button roles.

**Pros:** Simpler

**Cons:** Figma discard modal still has “Save & Exit” secondary

**Effort:** Small

**Risk:** Medium (product)

## Recommended Action

## Acceptance Criteria

- [ ] Form Feedback Submit cannot complete the flow if prior required steps are incomplete
- [ ] Cancel → “Save & Exit” persists the current step’s in-progress answers (or product-approved alternative)
- [ ] Covered by a Reflection Flow story or unit test

## Work Log

- 2026-07-31: Added from Prototype flow requirements agent after `/ce:review`

## Resources

- `ReflectionFlow.jsx`, form `onCancel` / `onSaveAndExit` contracts
