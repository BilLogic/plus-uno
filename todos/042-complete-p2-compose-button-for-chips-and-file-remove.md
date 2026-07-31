---
status: completed
priority: p2
issue_id: "042"
tags: [code-review, quality, design-system, post-session]
dependencies: []
---

# Compose Button for OptionChip and FileListItem remove

## Problem Statement

OptionChip hand-rolls a primary tonal/filled pill `<button>` instead of composing `Button`. FileListItem remove is a naked icon button instead of Button ghost/icon-only.

## Findings

- `OptionChip.jsx` duplicates Button filled/tonal primary; Figma Option Chip maps to filled/tonal chip buttons (H6 / pill).
- `FileListItem.jsx` raw remove control with `fontSize: '12px'`.
- Not Badge — Badge is status/dismissible, not aria-pressed toggle.

## Proposed Solutions

### Option 1: Compose Button (recommended)

**Approach:** OptionChip → `Button` primary filled/tonal + pill radius class. FileListItem remove → icon-only Button with aria-label.

**Pros:** Focus/disabled/tokens from Foundations.
**Cons:** May need pill radius override on Button.
**Effort:** Small
**Risk:** Low

### Option 2: Keep OptionChip local; only fix FileListItem

**Approach:** Minimal change if OptionChip is intentionally local organism chrome.

**Pros:** Faster.
**Cons:** Leaves reinvented chip.
**Effort:** Small
**Risk:** Low

## Recommended Action

**To be filled during triage.**

## Technical Details

**Affected files:**
- `Elements/OptionChip/OptionChip.jsx`
- `Elements/FileListItem/FileListItem.jsx`
- `Sections/MultiSelectQuestion/MultiSelectQuestion.jsx`

## Acceptance Criteria

- [x] OptionChip uses Button API (or documented exception in STRUCTURE)
- [x] File remove uses Button with accessible name
- [x] Visual match to Figma Option Chip + File List Item retained

## Work Log

### 2026-07-30 - Code review

**By:** CE review (PR #81)

## Resources

- **PR:** https://github.com/BilLogic/plus-uno/pull/81
