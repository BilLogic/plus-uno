---
status: complete
priority: p3
issue_id: "088"
tags: [code-review, post-session, quality, architecture]
dependencies: []
---

# Post-Session cleanup: empty dirs, deep imports, IDs, compose shell

## Problem Statement

Nice-to-have cleanup after P1/P2: empty obsolete folders, deep Button imports, hardcoded control IDs, ReflectionFlow/pageShell duplication, V2 naming, a11y current state on SideNav tabs.

## Findings

- Empty dirs: `Elements/AiGeneratingPlaceholder/`, `Elements/SessionInfo/`, `Modals/SaveAndExitModal/` ([architecture](096f2301-02cd-46a2-9b70-52afedb72942) P1 cleanup → kept P3)
- Deep imports: `OptionChip.jsx`, `FileListItem.jsx` → `@/components/actions/Button/Button`
- Hardcoded ids: `ai-prompted-answer`, `no-recording-switch` ([security](7b8548be-d972-4047-bf56-6909ffdd3931) P3)
- SideNav `role="button"` without `aria-current`
- Duplicate BreakpointPreview; V2 form names; compose ReflectionFlow from shared shell
- Document Section `*Form` composers in Post-Session STRUCTURE; LinearScale `null` Scale PropTypes; Switch size API trim ([simplicity](3260d9e0-ff51-4ec5-88d9-cdc70e62efbd))
- Upload annotated behaviors (2GB, supervisor flags) — product flags, prototype may defer
- AI Loading uses Spinner vs Figma grower; FileListItem `xmark` vs `close`
- Tests don’t cover tooltip delay / AI fail hide

## Proposed Solutions

### Option 1: Batched cleanup PR (recommended)

**Approach:** Delete empty dirs; barrel Button imports; `useId()`; aria-current; shared shell extract; rename V2; optional visual polish + tests.

**Effort:** Medium–Large (split if needed)

**Risk:** Low

### Option 2: Triage individually

**Approach:** Separate micro-todos when working each area.

**Effort:** Small each

**Risk:** Low

## Recommended Action

## Acceptance Criteria

- [ ] No empty obsolete organism folders
- [ ] No deep Button imports in Post-Session Elements
- [ ] Unique control IDs when multiple instances mount
- [ ] SideNav selected state announced to AT

## Work Log

- 2026-07-31: Consolidated P3s from `/ce:review`

## Resources

- PR #88; STRUCTURE.md obsolete table

- 2026-07-31: Implemented and verified in Post-Session PR #88 branch (tests green).
