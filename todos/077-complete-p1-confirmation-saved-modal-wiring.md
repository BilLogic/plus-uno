---
status: complete
priority: p1
issue_id: "077"
tags: [code-review, post-session, figma, prototype]
dependencies: []
---

# Wire Confirmation Pop-up `type=exit` (Saved) for Save & Exit

## Problem Statement

Figma annotations split three modal triggers: Cancel → exit without saving; Save & Exit → Saved (`type=exit`); Submit → reflection submitted. The orchestrator always opens `exit-without-saving` for both Cancel and Save & Exit, so the Saved modal never appears in the live prototype despite `COPY.exit` existing.

## Findings

- Figma `6327:241454`: `exit` triggered by Save & Exit; `exit without saving` by Cancel when unsaved; `reflection submitted` by Submit
- `ReflectionFlow.jsx` ~339–348: single modal `type="exit-without-saving"` for `showSaveExit`
- `ConfirmationPopUp.jsx` already defines `exit` copy (Saved / Continue Editing / Exit)
- `pageShell.jsx` same gap for leaf stories
- Known Pattern: prior modal type work exists in ConfirmationPopUp organism — wiring incomplete
- Related P1 `091`: Cancel → `openSaveExit()` without snapshot means even “Save & Exit” on the discard modal cannot persist draft — fix type wiring **and** draft capture together

## Proposed Solutions

### Option 1: Dual modal state (recommended)

**Approach:** Cancel (dirty) → `exit-without-saving`. Save & Exit → persist draft then show `type="exit"` (Saved). Wire Saved primary → exit; secondary → continue editing.

**Pros:** Matches Figma development annotations exactly

**Cons:** Slightly more state in ReflectionFlow

**Effort:** Medium

**Risk:** Low

### Option 2: Save & Exit skips confirm, shows Saved only

**Approach:** Save immediately on Save & Exit click, then Saved modal only.

**Pros:** Fewer clicks

**Cons:** Diverges if product wanted confirm-before-save

**Effort:** Small

**Risk:** Medium (product confirm)

## Recommended Action

## Acceptance Criteria

- [ ] Cancel with dirty form opens “Exit without saving?”
- [ ] Save & Exit shows “Saved” / “Your progress was saved.”
- [ ] Submit still shows “Reflection submitted”
- [ ] Storybook Confirmation Pop-up Overview still shows all three types

## Work Log

- 2026-07-31: Flagged in `/ce:review` Figma annotation + prototype agents

## Resources

- Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/?node-id=6327-241454
- `ReflectionFlow.jsx`, `ConfirmationPopUp.jsx`, `pageShell.jsx`
