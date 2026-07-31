---
status: completed
priority: p1
issue_id: "049"
tags: [figma-annotation, notion, post-session, escalation]
dependencies: ["048"]
---

# Escalation: multi-select + No exclusive + describe concern

## Problem Statement

Notion Form Design §2–§3 and Figma behavior annotations require supervisor follow-up as multi-select with **No exclusive**, default No, and a required “Please describe the concern.” Free Response when any Yes is selected. Student Reflection V2 omits escalation entirely; Session Reflection has chips but no exclusivity and no description field.

## Findings

- Figma: “Escalation selection — multi-select, with No exclusive… Any selection other than No reveals the required 'Please describe the concern.' field… deselecting back to No hides and clears it.”
- Student options: No (default) · Yes, behavioral concern · Yes, well-being concern · Other
- Session options already in `SUPERVISOR_FOLLOWUP_OPTIONS` (lead late = lateness only)
- `StudentReflectionFormV2` ends at AI card — no follow-up question
- Session `toggle()` is plain multi-select — No can coexist with Yes options
- No description Free Response under either escalation block

## Proposed Solutions

### Option 1: Shared exclusivity helper + FreeResponseQuestion (recommended)

**Approach:** `toggleExclusiveNo(list, id, noId='no')`; render Free Response when `selected && !selected.includes('no')`; add `STUDENT_FOLLOWUP_OPTIONS` + tooltips; place escalation **below** AI card.

**Effort:** Medium
**Risk:** Low

## Acceptance Criteria

- [x] Student + Session escalation present, caption “Select all that apply.”
- [x] Selecting No clears Yes*; selecting any Yes clears No; never empty
- [x] Non-No reveals required describe field; back to No hides + clears
- [x] Escalation never part of AI input payload
- [x] Next/Submit blocked until escalation valid (incl. description when needed)

## Resources

- Notion Form Design §§2–3
- Figma Student filled `10662:19061`; Session filled `10662:18166`
