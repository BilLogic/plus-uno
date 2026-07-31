---
status: completed
priority: p1
issue_id: "041"
tags: [code-review, quality, agent-native, post-session]
dependencies: []
---

# Save & Exit must persist (not equal Exit without saving)

## Problem Statement

In ReflectionFlow’s confirmation modal, both primary (“Exit without saving”) and secondary (“Save & Exit”) call `onExit`. The secondary action never saves. Humans and agents cannot perform the intended branch.

## Findings

- `ReflectionFlow.jsx` wires both `onPrimary` and `onSecondary` to the same exit handler (~396–408).
- Agent-native review: Save vs discard is not distinguishable.
- Copy says “Save & Exit” but behavior discards.

## Proposed Solutions

### Option 1: Wire secondary to save then exit (recommended)

**Approach:** `onSecondary` → persist in-memory snapshot (and any prototype callback) then navigate; `onPrimary` → discard then navigate.

**Pros:** Matches Figma copy and modal intent.
**Cons:** Need a real save hook in the prototype (can be in-memory).
**Effort:** Small
**Risk:** Low

### Option 2: Change copy to match current behavior

**Approach:** Rename secondary if save is out of scope for prototype.

**Pros:** Honest UX.
**Cons:** Diverges from Figma Confirmation Pop-up.
**Effort:** Small
**Risk:** Medium (spec fidelity)

## Recommended Action

**To be filled during triage.**

## Technical Details

**Affected files:**
- `Pages/ReflectionFlow/ReflectionFlow.jsx`
- `prototypes/post-session-reflection/src/pages/ReflectionFormPage.jsx`

## Acceptance Criteria

- [x] Save & Exit persists current step data (at least in-memory) before exit
- [x] Exit without saving discards unsaved changes
- [x] Storybook SaveAndExit story demonstrates both branches

## Work Log

### 2026-07-30 - Code review

**By:** CE review (PR #81)

## Resources

- **PR:** https://github.com/BilLogic/plus-uno/pull/81
