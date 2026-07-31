---
status: completed
priority: p2
issue_id: "045"
tags: [code-review, quality, design-system, post-session]
dependencies: ["037", "038", "043"]
---

# Token hygiene sweep (opacity, elevation, spark fill, px)

## Problem Statement

After composing Select/Scale/SidebarTab, remaining hardcoded values still bypass tokens: `opacity: 0.38`, elevation rgba stacks, spark SVG `#3F484A`, skeleton `6px` / invented rgba, magic gaps (`4px`).

## Findings

- Disabled mute uses raw `0.38` in UploadFiles, SessionSelection, SideNavBar, OptionChip — token `--color-disabled-opacity` exists.
- StudentsDropdown / fieldDropdownStyles use raw elevation rgba instead of `--elevation-light-1`.
- `assets/sparkle.svg` hardcodes fill `#3F484A` (on-surface-variant).
- AiPromptedQuestionBox skeleton uses `borderRadius: '6px'` and rgba fallbacks.
- Known pattern: Figma↔code token drift ([docs/knowledge/lessons/ds-compliance.md](../docs/knowledge/lessons/ds-compliance.md)).

## Proposed Solutions

### Option 1: Mechanical token pass (recommended)

**Approach:** Replace opacity/elevation/radius/icon-size literals with tokens; spark SVG `currentColor` + CSS color.

**Pros:** Fast; clear acceptance.
**Cons:** Some max-widths (331/480/219) may intentionally stay as layout constants.
**Effort:** Small
**Risk:** Low

## Recommended Action

**To be filled during triage.**

## Technical Details

**Affected files:**
- UploadFiles, SessionSelection, SideNavBar, OptionChip
- StudentsDropdown / fieldDropdownStyles (if not deleted by 037)
- AiPromptedQuestionBox + SparkleIcon/assets/sparkle.svg
- LinearScale (if not deleted by 038)

## Acceptance Criteria

- [x] No raw `0.38` opacity for disabled mute
- [x] Shadows use elevation tokens
- [x] Spark uses currentColor / on-surface-variant token
- [x] Skeleton radii use border-radius tokens
- [x] Document intentional fixed widths in STRUCTURE if kept

## Work Log

### 2026-07-30 - Code review

**By:** CE review (PR #81)

## Resources

- **PR:** https://github.com/BilLogic/plus-uno/pull/81
- **Lesson:** docs/knowledge/lessons/ds-compliance.md
