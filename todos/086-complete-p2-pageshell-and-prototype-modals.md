---
status: complete
priority: p2
issue_id: "086"
tags: [code-review, post-session, prototype]
dependencies: ["077"]
---

# Fix pageShell Save&Exit handlers + dedicated prototype submitted modal

## Problem Statement

1. `ReflectionPageShell` wires both ConfirmationPopUp primary and secondary to close-only — Save & Exit and Exit without saving do the same (discard). Affects leaf page stories and live-app single-step routes.
2. Dedicated `prototypes/post-session-reflection` passes `onSubmitted={() => navigate('/')}` which unmounts before the reflection-submitted modal can be seen.

## Findings

- `pageShell.jsx` ~97–103
- `prototypes/post-session-reflection/src/pages/ReflectionFormPage.jsx` ~19–28
- Live-app `/toolkit/post-session` OK (no immediate navigate on submit)

## Proposed Solutions

### Option 1: Wire shell callbacks; delay navigate (recommended)

**Approach:** pageShell: secondary = save path stub / close with saved flag; primary = discard. Dedicated prototype: navigate on modal primary (“Back to sessions”), not on `onSubmitted`.

**Effort:** Small–Medium

**Risk:** Low

## Recommended Action

## Acceptance Criteria

- [ ] Leaf stories distinguish Save & Exit vs Exit without saving actions
- [ ] Dedicated prototype shows Reflection submitted before navigating
- [ ] Live-app main flow unchanged or improved

## Work Log

- 2026-07-31: Flagged by prototype explore agent

- 2026-07-31: Implemented and verified in Post-Session PR #88 branch (tests green).
