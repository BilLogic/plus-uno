---
status: pending
priority: p2
issue_id: 063
tags: [code-review, ci, guards]
dependencies: []
---

# The headless faces' machine checks have never checked anything

`.github/workflows/figma-implement-design.yml:117` runs `run-review-checks.sh "playground/$SLUG"` but `scripts/implement-design-from-figma.js:48` has written to `prototypes/` since 2026-07-14. The directory never exists, the check exits 1 at its guard clause, and `continue-on-error` converts that into a permanent "❌ FAILED" badge — every headless design-implement run since 2026-07-16 shipped with machine checks that ran against nothing. `figma-implement.yml:136` also diff-globs the `playground/` directory removed in #85. PR bodies/Slack copy in the same workflows still say playground (lines 148, 171, 266, 268).

## Proposed Solutions
1. ~6 line edits: `playground/$SLUG` → `prototypes/$SLUG` in both workflows + copy strings. Zero risk, restores a guard believed active. One dispatch run to confirm green.
