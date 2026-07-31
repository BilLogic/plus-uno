---
status: complete
priority: p2
issue_id: "082"
tags: [code-review, post-session, figma, prototype]
dependencies: ["077"]
---

# Dirty-gate Cancel modal + fix escalation Other text wiring

## Problem Statement

1. Figma: exit-without-saving only when Cancel + unsaved changes. Flow always opens the modal. *(Cancel now passes a draft snapshot; Save & Exit from the discard modal persists — remaining gap is dirty-gate so clean Cancel exits/skips modal.)*
2. ~~Student/Session escalation OtherTextInput~~ **Fixed 2026-07-31:** escalation MultiSelects pass `otherId=""`; FreeResponse describe remains.

## Findings

- `ReflectionFlow.jsx` `onCancel={() => openSaveExit()}` always
- `StudentReflectionFormV2.jsx` follow-up MultiSelect uses `STUDENT_FOLLOWUP_OPTIONS` with `id: 'other'` and default `otherId='other'`
- Same pattern risk on Session supervisor follow-up

## Proposed Solutions

### Option 1: Dirty flag + otherId=null for escalation (recommended)

**Approach:** Track dirty per step; Cancel no-ops or exits silently when clean. Pass `otherId={null}` (or non-matching) on escalation MultiSelects so only FreeResponse describe shows.

**Effort:** Medium

**Risk:** Low

### Option 2: Wire OtherTextInput for escalation Other

**Approach:** Only if product wants OtherTextInput instead of FreeResponse describe.

**Effort:** Medium

**Risk:** Medium (copy/UX conflict)

## Recommended Action

## Acceptance Criteria

- [ ] Clean Cancel does not open discard modal
- [ ] Escalation Other does not show an empty unwired OtherTextInput
- [ ] Describe FreeResponse still required when escalation needs description

## Work Log

- 2026-07-31: Flagged in `/ce:review`

- 2026-07-31: Implemented and verified in Post-Session PR #88 branch (tests green).
