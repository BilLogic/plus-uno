---
status: completed
priority: p2
issue_id: "043"
tags: [code-review, quality, design-system, post-session]
dependencies: []
---

# SideNavBar: real tokens + SidebarTab composition

## Problem Statement

SideNavBar uses phantom tokens (`--size-legacy-radius-3`, `--size-border-radius-4-5`), hardcoded `10px`/`8px`/`32px`/`219px`, and a local `SideBarTab` instead of Foundations `SidebarTab`. Disabled opacity uses raw `0.38`.

## Findings

- Selected pill / shell radii fall back to magic px because tokens don’t exist in `design-system/src/tokens`.
- DS `navigation/SidebarTab` already supports enabled/selected/disabled + primary-16.
- Student rows need text-only active (no pill) — may require API extension or local composition on top of SidebarTab.

## Proposed Solutions

### Option 1: Compose SidebarTab + fix tokens (recommended)

**Approach:** Map section tabs to SidebarTab; keep student indent + active-text as documented local extension. Replace phantom tokens with `--size-border-radius-radius-150` / `--size-surface-radius` / semantic pad/gap. Opacity → `--color-disabled-opacity`.

**Pros:** Token compliance; less custom chrome.
**Cons:** May need SidebarTab trailing-icon / active-text support.
**Effort:** Medium
**Risk:** Medium

### Option 2: Token-only cleanup (keep local SideBarTab)

**Approach:** Fix px/phantom tokens without adopting SidebarTab yet.

**Pros:** Faster fidelity fix.
**Cons:** Still reinventing tab primitive.
**Effort:** Small
**Risk:** Low

## Recommended Action

**To be filled during triage.**

## Technical Details

**Affected files:**
- `Sections/SideNavBar/SideNavBar.jsx`
- `components/navigation/SidebarTab/SidebarTab.jsx`

## Acceptance Criteria

- [x] No undefined CSS variables with silent px fallbacks
- [x] Spacing/radius/opacity use design tokens
- [x] Student Reflection parent stays selected; student names remain text-only when active
- [x] Prefer SidebarTab where states map 1:1

## Work Log

### 2026-07-30 - Code review

**By:** CE review (PR #81)

## Resources

- **PR:** https://github.com/BilLogic/plus-uno/pull/81
- **Lesson:** docs/knowledge/lessons/ds-compliance.md (ghost tokens)
