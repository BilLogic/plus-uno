---
status: completed
priority: p3
issue_id: "047"
tags: [code-review, quality, post-session]
dependencies: ["039", "044"]
---

# Storybook IA alignment and barrel cleanup

## Problem Statement

Session InformationForm lives under Sections but stories title as Pages; FormReflection folder ≠ Free Response name; broken Pages/Cards/Tables barrels; leftover nested Unfilled|Filled titles after ReflectionFlow collapse.

## Findings

- Known pattern: Storybook MDX/autodocs catalog drift ([docs/knowledge/lessons/integration.md](../docs/knowledge/lessons/integration.md)).
- `SessionInformationForm.stories.jsx` title `Pages/Session Info` while path is Sections.
- `Pages/index.js` → missing `Pages.stories.jsx`; `Tables/index.js` → wrong filename.

## Proposed Solutions

### Option 1: Align titles + fix barrels (recommended)

**Approach:** Colocate titles with folders or move Session Info under Pages; rename FormReflection → FreeResponseQuestion; fix/delete broken indexes.

**Pros:** Agents and humans find the same leaf.
**Cons:** Storybook URL churn.
**Effort:** Small
**Risk:** Low

## Recommended Action

**To be filled during triage.**

## Technical Details

**Affected files:**
- SessionInformationForm stories/mdx
- FormReflection folder
- `Pages/index.js`, `Cards/index.js`, `Tables/index.js`
- Overview.mdx links

## Acceptance Criteria

- [x] Storybook titles match folder IA or STRUCTURE documents intentional exceptions
- [x] No broken barrel re-exports
- [x] Overview links resolve

## Work Log

### 2026-07-30 - Code review

**By:** CE review (PR #81)

## Resources

- **PR:** https://github.com/BilLogic/plus-uno/pull/81
- **Lesson:** docs/knowledge/lessons/integration.md
