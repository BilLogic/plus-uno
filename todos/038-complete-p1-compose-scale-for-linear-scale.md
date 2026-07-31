---
status: completed
priority: p1
issue_id: "038"
tags: [code-review, architecture, quality, design-system, post-session]
dependencies: []
---

# Compose Scale (RadioButtonGroup) for Linear Scale

## Problem Statement

Local `LinearScale` hand-rolls 1–5 radio chrome (raw px geometry, `#fff` fallbacks) while Foundations already ships `Scale` (`RadioButtonGroup`) documented against Figma Linear Scale.

## Findings

- `Sections/LinearScale/LinearScale.jsx` custom radios + fixed 445px shell.
- Used from `ReflectionFlow` Self Reflection step.
- DS `components/forms-and-inputs/RadioButtonGroup.jsx` exports Scale with `lowestLabel` / `highestLabel` / options.

## Proposed Solutions

### Option 1: Thin wrapper (recommended)

**Approach:** Keep organism name for Figma mapping; render `<Scale … />` inside primary-state-08 shell; delete custom radio markup.

**Pros:** Tokens/a11y from Foundations; catalog leaf preserved.
**Cons:** Shell styling still local.
**Effort:** Small
**Risk:** Low

### Option 2: Delete organism; use Scale directly in ReflectionFlow

**Approach:** Drop LinearScale leaf; document Scale as the mapping.

**Pros:** Maximum deletion.
**Cons:** Storybook catalog no longer 1:1 with Figma Sections strip.
**Effort:** Small
**Risk:** Medium (catalog fidelity)

## Recommended Action

**To be filled during triage.**

## Technical Details

**Affected files:**
- `design-system/src/specs/Toolkit/Post-Session/Sections/LinearScale/*`
- `Pages/ReflectionFlow/ReflectionFlow.jsx`
- `components/forms-and-inputs/RadioButtonGroup.jsx`

## Acceptance Criteria

- [x] No custom radio dots in LinearScale
- [x] Uses Scale/RadioButtonGroup for selection chrome
- [x] Self Reflection step visually matches Figma Linear Scale shell
- [x] Storybook Sections leaf still exists or STRUCTURE updated if removed

## Work Log

### 2026-07-30 - Code review

**By:** CE review (PR #81)

**Actions:** Identified LinearScale as duplicate of Scale

## Resources

- **PR:** https://github.com/BilLogic/plus-uno/pull/81
- **Figma:** Linear Scale `10819:11602`
