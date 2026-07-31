---
status: complete
priority: p1
issue_id: "094"
tags: [code-review, post-session, architecture]
dependencies: ["083"]
---

# Stage untracked SessionRating / FormRating Element modules

## Problem Statement

`FormRating.jsx` and `SessionRating.jsx` exist in the working tree as **untracked** files while stories, MDX, barrels, and Section forms already import them. Anyone without the local tree (CI after partial commit, fresh clone of pushed commits without these files) breaks Storybook/builds.

## Findings

- [architecture-strategist](4039a425-7c4f-49eb-84a7-7067759d688b): git status shows `??` for both Element `.jsx` files
- Todo 083 marked complete for promotion, but modules never committed

## Proposed Solutions

### Option 1: Include in next commit (recommended)

**Approach:** `git add` both Element modules with the Post-Session working tree; verify imports resolve in Storybook build.

**Effort:** Small

**Risk:** Low

## Recommended Action

## Acceptance Criteria

- [ ] Both `.jsx` files tracked in git
- [ ] Storybook Form Rating / Session Rating docs render without missing-module errors
- [ ] Section forms import Elements successfully in CI

## Work Log

- 2026-07-31: Flagged in second-pass `/ce:review` of PR #88

## Resources

- PR: https://github.com/BilLogic/plus-uno/pull/88
