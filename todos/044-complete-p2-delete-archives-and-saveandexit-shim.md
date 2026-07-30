---
status: completed
priority: p2
issue_id: "044"
tags: [code-review, architecture, quality, post-session]
dependencies: ["039"]
---

# Delete archives and SaveAndExitModal shim

## Problem Statement

Obsolete `.archive*` files, V1 form modules, and `SaveAndExitModal` (thin ConfirmationPopUp wrapper) still pollute the tree / barrels / some stories. STRUCTURE already marks them obsolete.

## Findings

- `Modals/index.js` still exports SaveAndExitModal; Session Reflection Part1 stories still import it.
- ReflectionFlow already uses ConfirmationPopUp directly.
- Soft-deleted `.archive` / `.mdx.archive` / `.jsx.archive` pile (~15 files) plus V1 Session/Student/FormFeedback section files.
- Broken barrels: Pages/Cards/Tables index re-exports missing story files.

## Proposed Solutions

### Option 1: Hard delete + retarget (recommended)

**Approach:** Delete SaveAndExitModal folder + all archives + unused V1 forms; point remaining stories at ConfirmationPopUp; repair barrels.

**Pros:** Clear public surface; matches STRUCTURE.
**Cons:** Need import audit (live-app PostSessionPage).
**Effort:** Medium
**Risk:** Medium

### Option 2: Tag !manifest only

**Approach:** Hide from Storybook without deleting.

**Pros:** Safer short-term.
**Cons:** Dead code remains; agents still import.
**Effort:** Small
**Risk:** Low

## Recommended Action

**To be filled during triage.**

## Technical Details

**Affected files:**
- `Modals/SaveAndExitModal/**`
- `Modals/index.js`
- `**/*.archive*`
- V1 `*ReflectionForm.jsx` / `FormFeedback.jsx` (non-V2)
- `Pages/index.js`, `Cards/index.js`, `Tables/index.js`

## Acceptance Criteria

- [x] No SaveAndExitModal export
- [x] No archive files left in Post-Session tree
- [x] Barrels resolve or are removed
- [x] Storybook shows only Figma-current organisms

## Work Log

### 2026-07-30 - Code review

**By:** CE review (PR #81)

## Resources

- **PR:** https://github.com/BilLogic/plus-uno/pull/81
