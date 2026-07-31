---
status: complete
priority: p2
issue_id: "095"
tags: [code-review, post-session, storybook, agent-native]
dependencies: ["086", "089"]
---

# Save & Exit mount props open discard modal (misnamed)

## Problem Statement

`showSaveAndExitOnMount` / `showSaveExit` initialize `exitModal` to `'discard'` (Exit without saving), not Saved. Stories named “Save & Exit” and MDX claim the wrong ConfirmationPopUp type. Agent-native Controls lie.

## Findings

- [agent-native-reviewer](0e4b514e-5625-41f5-8af3-c027cdc64929) + [kieran-typescript-reviewer](e2581c19-4c7b-4a77-b2f6-00e4e6a2ec0b)
- `ReflectionFlow.jsx` ~64; `pageShell.jsx` ~62; stories `SaveAndExit` / `SaveAndExitConfirmation`
- `openSaveExit: openDiscard` alias is a naming footgun ([code-simplicity-reviewer](05ac69ea-eaeb-4d88-abe7-2bcc5f572639))

## Proposed Solutions

### Option 1: Split discard vs saved mount flags (recommended)

**Approach:** `showDiscardOnMount` / `showSavedOnMount` (or single `initialExitModal: 'discard'|'saved'|null`). Rename stories/MDX. Delete `openSaveExit` alias.

**Effort:** Small

**Risk:** Low

## Recommended Action

## Acceptance Criteria

- [ ] Save & Exit story opens Saved (`type="exit"`) modal
- [ ] Discard / exit-without-saving has its own seed
- [ ] No `openSaveExit` → discard alias

## Work Log

- 2026-07-31: Flagged in second-pass `/ce:review` of PR #88

## Resources

- PR: https://github.com/BilLogic/plus-uno/pull/88
- Known pattern: todos/086, 077
