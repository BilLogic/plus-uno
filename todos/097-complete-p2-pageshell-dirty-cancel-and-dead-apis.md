---
status: complete
priority: p2
issue_id: "097"
tags: [code-review, post-session, prototype, quality]
dependencies: ["082", "086"]
---

# pageShell: dirty Cancel + delete dead exit APIs

## Problem Statement

Leaf page stories use `ReflectionPageShell`, which ignores `(data, dirty)` on Cancel — clean Cancel always opens discard (unlike ReflectionFlow). Shell still exposes unused `onExitWithoutSaving` / `onSaveAndExit` and dead `openSaveExit` alias.

## Findings

- [kieran-typescript-reviewer](e2581c19-4c7b-4a77-b2f6-00e4e6a2ec0b) + [code-simplicity-reviewer](05ac69ea-eaeb-4d88-abe7-2bcc5f572639)
- Known pattern from 082 applies to Flow only today

## Proposed Solutions

### Option 1: Mirror Flow dirty gate in shell (recommended)

**Approach:** Render-prop Cancel receives dirty; shell skips modal when clean. Delete unused callbacks + `openSaveExit`.

**Effort:** Small

**Risk:** Low

## Recommended Action

## Acceptance Criteria

- [ ] Clean Cancel on Session Info / Student page stories does not open discard modal
- [ ] No unused exit callback props on `ReflectionPageShell`

## Work Log

- 2026-07-31: Flagged in second-pass `/ce:review` of PR #88

## Resources

- PR: https://github.com/BilLogic/plus-uno/pull/88
- Known pattern: todos/082
