---
status: complete
priority: p1
issue_id: "076"
tags: [code-review, post-session, architecture]
dependencies: []
---

# Track SideNavBar.scss with the SideNav refactor

## Problem Statement

`SideNavBar.jsx` imports `./SideNavBar.scss`, but the SCSS file is untracked (`??`). Merging/pushing without it ships a SideNav with no width/padding/selected styles.

## Findings

- `Sections/SideNavBar/SideNavBar.jsx` imports `./SideNavBar.scss`
- `git status`: `?? .../SideNavBar/SideNavBar.scss` while JSX/MDX/stories are staged/modified
- Layout tokens were moved out of JSX into this SCSS in the 073/074 pass

## Proposed Solutions

### Option 1: git add SideNavBar.scss (recommended)

**Approach:** Add and commit with the SideNav colocation change; verify Storybook + live-app after clean checkout.

**Effort:** Small

**Risk:** Low

### Option 2: Inline critical styles back into JSX

**Approach:** Only if SCSS is intentionally discarded — not preferred.

**Effort:** Medium

**Risk:** Medium (reverts token hygiene)

## Recommended Action

## Acceptance Criteria

- [ ] `SideNavBar.scss` is tracked in git
- [ ] Clean checkout renders SideNav selected/disabled/width correctly

## Work Log

- 2026-07-31: Flagged in `/ce:review` of PR #88 + WT

## Resources

- PR: https://github.com/BilLogic/plus-uno/pull/88
