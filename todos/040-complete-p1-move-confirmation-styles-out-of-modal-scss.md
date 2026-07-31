---
status: completed
priority: p1
issue_id: "040"
tags: [code-review, architecture, design-system, post-session]
dependencies: []
---

# Move Confirmation Pop-up styles out of core Modal.scss

## Problem Statement

Post-Session confirmation chrome (`.plus-modal--confirmation-popup`) lives in Foundations `Modal.scss`, hardcodes `border-radius: 6px`, and duplicates props already set via `radiusSize` / `paddingSize`. Specs must not own styles in core components.

## Findings

- `ConfirmationPopUp.jsx` passes `radiusSize="sm"`, `paddingSize="sm"`, `gapSize="sm"`, plus className.
- `Modal.scss` adds Post-Session Figma node comments and hardcoded 6px / 24px / 64px.
- Layering violation: Foundations knows a Toolkit organism.

## Proposed Solutions

### Option 1: Spec-scoped SCSS module (recommended)

**Approach:** Move modifier next to ConfirmationPopUp; import from the organism. Rely on Modal props for radius/pad; keep only surface-container-high deltas that props cannot express.

**Pros:** Correct layering; easy to delete with organism.
**Cons:** Spec CSS import pattern must match Storybook bundling.
**Effort:** Small
**Risk:** Low

### Option 2: Generic Modal surface API

**Approach:** Add `surface="container-high"` (or similar) to Modal props; delete Post-Session class.

**Pros:** Reusable across specs.
**Cons:** API change to Foundations.
**Effort:** Medium
**Risk:** Medium

## Recommended Action

**To be filled during triage.**

## Technical Details

**Affected files:**
- `design-system/src/components/messaging/Modal/Modal.scss`
- `design-system/src/specs/Toolkit/Post-Session/Modals/ConfirmationPopUp/*`

## Acceptance Criteria

- [x] No Post-Session Figma comments in core Modal.scss
- [x] Confirmation pop-up still matches Figma (surface-container-high, sm pads, small buttons)
- [x] Radius uses tokens / `radiusSize`, not hardcoded `6px`

## Work Log

### 2026-07-30 - Code review

**By:** CE review (PR #81)

## Resources

- **PR:** https://github.com/BilLogic/plus-uno/pull/81
- **Figma:** Confirmation Pop-up `6327:241454`
