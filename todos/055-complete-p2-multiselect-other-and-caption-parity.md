---
status: completed
priority: p2
issue_id: "055"
tags: [notion, figma, post-session]
dependencies: ["049"]
---

# MultiSelect parity: B3 caption, OtherTextInput, required Other text

## Problem Statement

Session Reflection builds chip banks by hand (inline caption, raw Textarea for Other) instead of MultiSelectQuestion + OtherTextInput. Student MultiSelects don’t pass `otherValue` / `onOtherChange`. Notion: selecting Other requires short “Other (please specify)” text for validation.

## Findings

- MultiSelectQuestion supports OtherTextInput; Student V2 never wires other state.
- Session uses Textarea placeholders not “Other (please specify)”.
- Caption should be B3 under label (“Select all that apply.”), not parenthetical after title.

## Acceptance Criteria

- [x] Session/Self chip questions use MultiSelectQuestion
- [x] Other selection shows OtherTextInput; required when Other selected for Next
- [x] Caption style matches Figma B3

## Resources

- Figma Multi-Select + Other Text Input `10807:115523`
