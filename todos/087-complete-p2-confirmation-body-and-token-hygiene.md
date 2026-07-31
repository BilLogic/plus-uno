---
status: complete
priority: p2
issue_id: "087"
tags: [code-review, post-session, quality]
dependencies: []
---

# Soften ConfirmationPopUp body clamp + finish token hygiene

## Problem Statement

Confirmation body uses fixed `height: 64px` + `overflow: hidden` (clips zoom/longer copy). SideNav uses inventing `--opacity-disabled`; OptionChip/LinearScale still have raw px / fake tokens after 073.

## Findings

- `ConfirmationPopUp.scss` height/overflow
- `SideNavBar.scss` `var(--opacity-disabled, 0.38)` → should be `--color-disabled-opacity`
- `OptionChip.scss` `min-width: 36px`; LinearScale invented `--size-icon-lg`
- Simplicity reviewer: drop redundant ConfirmationPopUp Modal default props that SCSS overrides

## Proposed Solutions

### Option 1: min-height + real tokens (recommended)

**Approach:** `min-height: 64px`, allow wrap; fix opacity token; map remaining px to tokens or local SCSS vars with Figma comments; simplify ConfirmationPopUp props per simplicity review.

**Effort:** Small–Medium

**Risk:** Low

## Recommended Action

## Acceptance Criteria

- [ ] Modal body copy does not clip at default zoom
- [ ] No invented CSS variable names without definitions
- [ ] Confirmation still matches Figma 340px / radius-md chrome

## Work Log

- 2026-07-31: Flagged by TS + simplicity + architecture agents

- 2026-07-31: Implemented and verified in Post-Session PR #88 branch (tests green).
