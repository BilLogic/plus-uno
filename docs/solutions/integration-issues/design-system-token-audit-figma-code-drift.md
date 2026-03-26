---
title: "PLUS Design System Token Audit & Drift Fix"
category: integration-issues
date: 2026-03-25
tags:
  - token-drift
  - ghost-tokens
  - storybook
  - scss
  - figma
  - design-tokens
  - audit
severity: P0-P2
affected_components:
  - _fonts.scss
  - _spacing_semantics.scss
  - _colors.scss
  - _elevation.scss
  - Modal.scss
  - Input.mdx / Input.stories.jsx
  - Select.mdx / Select.stories.jsx
  - Layout.stories.jsx
  - Colors.stories.jsx
  - 7 spec/story files (ghost token migration)
root_cause_type:
  - naming-convention-migration-incomplete
  - figma-code-sync-gap
  - copy-paste-error
  - stale-documentation
---

# PLUS Design System Token Audit & Drift Fix

## Problem

Multiple categories of token issues accumulated silently in the PLUS design system:

1. **Figma-Code drift**: 6 semantic token values in code didn't match Figma source of truth (spacing and color)
2. **Ghost tokens**: Old naming convention tokens (`--size-spacing-between-components-*`, `--size-spacing-within-component-*`) persisted in 10+ files after the semantic token system was built
3. **P0 bugs in _fonts.scss**: Wrong color token, copy-paste icon sizing bug, undefined ghost token references causing silent CSS failures
4. **Storybook breakage**: Input and Select MDX pages threw `of={undefined}` errors
5. **Stale documentation**: Storybook token docs pages had hardcoded values that drifted from actual tokens

## Root Cause

**Drift**: Token values were manually transcribed from Figma. No automated verification existed between Figma variables and code CSS custom properties. When Figma values were updated, code wasn't synced.

**Ghost tokens**: The semantic token layer (`_spacing_semantics.scss`) was built but the old naming convention was never fully purged from component SCSS files. CSS silently ignores undefined custom properties, so the ghost references produced no errors — just wrong spacing.

**Storybook MDX**: Input.mdx and Select.mdx rendered components inline in MDX JSX (`<Input ... />`) instead of using the `DocsCanvasShell` + `<Canvas of={...}>` pattern used by all other working forms. When the inline component render failed, it crashed the entire MDX module evaluation, making the story import resolve as `undefined`.

## Method

Used Figma MCP `get_variable_defs` via the desktop plugin to pull authoritative token values, then systematically compared against code primitives and semantics.

1. Called `get_variable_defs` on the DS Foundation file with a node selected in Figma desktop
2. Built a comparison table: Figma value vs code primitive reference vs resolved px value
3. Identified 6 drift values, fixed at the semantic layer (not primitive)
4. Grepped the full codebase for old naming convention tokens and migrated all references
5. Verified Storybook docs pages had matching hardcoded display values

## Solution

### Token Drift Fixes (Figma = source of truth)

| Token | Old Primitive | Old Value | New Primitive | New Value |
|---|---|---|---|---|
| `--size-element-pad-x-md` | `small-space-150` | 10px | `medium-space-200` | **12px** |
| `--size-element-radius-sm` | `radius-50` | 2px | `radius-100` | **4px** |
| `--size-card-gap-lg` | `large-space-600` | 32px | `medium-space-400` | **20px** |
| `--size-section-pad-x-md` | `medium-space-300` | 16px | `medium-space-500` | **24px** |
| `--size-section-pad-y-md` | `medium-space-300` | 16px | `medium-space-500` | **24px** |
| `--color-success-container` | — | #a1eb83 | — | **#bdf292** |

`--size-card-gap-lg` had the largest visual impact — card gaps were 60% larger than design intent.

### P0 Bug Fixes in _fonts.scss

- **Ghost padding removed**: 6 undefined `--size-spacing-between-components-*` / `--size-spacing-within-component-*` tokens removed from display text classes. Spacing now handled by parent layout.
- **Color token fixed**: `--color-neutral-on-surface` → `--color-on-surface` (default text color was broken)
- **h3 icon sizing**: `fa-h1` → `fa-h3` (icons were 36px instead of 24px)

### Elevation Cleanup

Removed 5 `--elevation-{1-5}` aliases. Kept only canonical `--elevation-light-{1-5}`. Fixed `Modal.scss` to use `--elevation-light-2` directly. One name, no indirection.

### Ghost Token Migration (11+ references across 7 files)

| Old Token | Figma Value | Migrated To |
|---|---|---|
| `--size-spacing-within-component-spacer-5` | 20px | `--size-card-pad-x-md` |
| `--size-spacing-within-component-spacer-4` | 12px | `--size-element-gap-lg` |
| `--size-spacing-within-component-spacer-3-base` | 8px | `--size-element-gap-sm` |
| `--size-spacing-within-component-spacer-3-5` | 10px | `--size-element-gap-md` |
| `--size-spacing-within-component-spacer-2` | 4px | `--size-element-gap-xs` |
| `--size-spacing-between-sections-spacer-3-base` | 24px | `--size-section-gap-lg` |
| `--size-spacing-between-sections-spacer-4` | 36px | `--size-section-pad-y-lg` |
| `--size-spacing-between-components-spacer-2` | 8px | `--size-element-gap-sm` |

Files migrated: `StudentsOverviewSection.scss`, `BottomDiv.scss`, `UserFeedbackModal.scss`, `TutorProfilePage.stories.jsx`, `BackgroundAndMatching.stories.jsx`, `SideNavBarReflection.stories.jsx`, `StudentDashboard.stories.jsx`

### Storybook MDX Fixes

Converted `Input.mdx` and `Select.mdx` from inline component rendering to `DocsCanvasShell` + `<Canvas of={...}>` pattern. Added `Content`, `Styles`, `Sizes`, `InteractionStates` story exports to both story files.

### Storybook Docs Content Fixes

Updated hardcoded display values in:
- `Layout.stories.jsx`: element-pad-x-md (10→12px), radius names/values, section-radius-md (8→12px), all breakpoint values (BS4→actual code values)
- `Colors.stories.jsx`: success-container (#a1eb83→#bdf292)

## Prevention

### Figma-Code Drift
- Use `get_variable_defs` MCP to spot-check token values during design reviews
- Maintain a single authoritative token manifest that both CSS and docs derive from
- Add token audit to sprint checklist after any Figma variable update

### Ghost Token Detection
- Grep for old naming patterns (`--size-spacing-between-components`, `--size-spacing-within-component`) at PR review time
- Consider a Stylelint `custom-property-pattern` rule to flag deprecated token patterns in CI
- When introducing new naming conventions, create a migration issue tracking every file using the old pattern

### Storybook Docs Sync
- Never hardcode token values in MDX or story files — consider a `<TokenValue name="--token" />` component that reads computed values at runtime
- Build token tables from a shared manifest rather than handwriting values
- Flag `<!-- HARDCODED -->` comments on any raw value in docs

### MDX Best Practices
- Always use `DocsCanvasShell` + `<Canvas of={...}>` pattern — never render components inline in MDX
- Verify story export names exist before referencing in MDX
- Keep MDX thin — complex rendering belongs in story files

## Cross-References

- Plan: `docs/plans/2026-03-25-002-feat-ds-spec-figma-audit-plan.md` — broader audit plan this work partially executes
- Related: `docs/solutions/integration-issues/2026-03-23-storybook-mdx-autodocs-conflict-and-netlify-spa-static-coexistence.md`
- Figma MCP guide: `.agent/references/figma-mcp-guide.md`
- Token mapping: `.agent/references/figma-token-mapping.md`
- Maintenance checklist: `docs/design-system/maintenance/sync-checklist.md` (Section C: Token Integrity)
