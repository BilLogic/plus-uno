---
status: completed
priority: p1
issue_id: "039"
tags: [code-review, architecture, post-session]
dependencies: []
---

# Collapse page catalog onto ReflectionFlow

## Problem Statement

Storybook ships two product UIs for Self / Form Feedback (and parallel shells for Session/Student): ReflectionFlow (current) vs divergent Unfilled/Filled / Part* page trees. Designers can QA the wrong surface.

## Findings

- `ReflectionFlow` uses LinearScale + thumbs Rating + NavigationButtons + ConfirmationPopUp.
- `Pages/SelfReflection/Filled.jsx` still uses star Rating + checkbox banks.
- `Pages/FormFeedback/Unfilled.jsx` / `Filled.jsx` hand-roll footers and different copy.
- Session/Student Part stories re-shell SideNav + SaveAndExitModal separately from the orchestrator.
- Prototype correctly uses ReflectionFlow only.

## Proposed Solutions

### Option 1: Page stories = ReflectionFlow fixtures (recommended)

**Approach:** Each page leaf mounts ReflectionFlow with `initialTab` + seeded state. Delete divergent page bodies / Part shells.

**Pros:** Single source of truth; matches prototype.
**Cons:** Larger Storybook story rewrite.
**Effort:** Large
**Risk:** Medium

### Option 2: Extract shared Section steps

**Approach:** Pull Self/Form Feedback into Sections; both ReflectionFlow and page stories consume them.

**Pros:** Reuse without deleting page titles.
**Cons:** More files; still need to delete old bodies.
**Effort:** Large
**Risk:** Low

## Recommended Action

**To be filled during triage.**

## Technical Details

**Affected files:**
- `Pages/ReflectionFlow/**`
- `Pages/SelfReflection/**`
- `Pages/FormFeedback/**`
- `Pages/SessionReflection/**`
- `Pages/StudentReflection/**`
- `Overview.mdx`, `STRUCTURE.md`

## Acceptance Criteria

- [x] No divergent Self/Form Feedback implementations in Storybook
- [x] Session/Student page stories do not reimplement SideNav shell logic
- [x] Prototype and Storybook share the same step components
- [x] Overview catalog links point at the surviving leaves

## Work Log

### 2026-07-30 - Code review

**By:** CE review (PR #81)

**Actions:** Architecture + simplicity agents flagged dual page truth

## Resources

- **PR:** https://github.com/BilLogic/plus-uno/pull/81
