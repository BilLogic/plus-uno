---
status: complete
priority: p1
issue_id: "075"
tags: [code-review, post-session, foundations, quality]
dependencies: []
---

# Revert Switch unchecked-label opacity to Foundations default

## Problem Statement

Uncommitted `Switch.scss` sets every `.form-check-label` to disabled opacity and only restores full opacity when `:checked`. Off switches across the DS (Admin, Pre-Session, Switch stories) look disabled. Post-Session previously used local opacity wrappers; baking that into Foundations is a breaking visual regression.

## Findings

- `design-system/src/components/forms-and-inputs/Switch.scss` (~156–173): default label `opacity: var(--color-disabled-opacity)`; `:checked` restores `1`
- Call sites removed local opacity hacks (`SessionSelection.jsx`, `UploadFiles.jsx`)
- Simplicity + TypeScript reviewers both flagged as P1

## Proposed Solutions

### Option 1: Restore Foundations default (recommended)

**Approach:** Label opacity `1` by default; dim only `:disabled` / `.plus-form-switch-disabled`. Reintroduce Post-Session-only muted-off wrappers if product still wants that look.

**Pros:** Fixes all Switch consumers; matches Figma Form Switch intent (track chrome ≠ muted label)

**Cons:** Post-Session may need 1–2 local wrappers again

**Effort:** Small

**Risk:** Low

### Option 2: Opt-in prop `muteUncheckedLabel`

**Approach:** Add a Switch prop that applies the muted-unchecked pattern only when requested.

**Pros:** Keeps Post-Session look without global impact

**Cons:** Extra API surface

**Effort:** Small–Medium

**Risk:** Low

## Recommended Action

## Technical Details

- Affected: `Switch.scss`, `Switch.jsx`, Post-Session `SessionSelection` / `UploadFiles`

## Acceptance Criteria

- [ ] Unchecked enabled Switch labels render at full opacity in Foundations stories
- [ ] Disabled Switch labels remain muted
- [ ] Post-Session Session Selection / Upload Files still match intended Figma look (local override OK)

## Work Log

- 2026-07-31: Flagged in `/ce:review` of PR #88 + WT

## Resources

- PR: https://github.com/BilLogic/plus-uno/pull/88
- Figma Form Switch: `zAecJNRdvJzAUOcjV32tRX` node `82:16570`
