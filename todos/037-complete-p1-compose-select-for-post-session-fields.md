---
status: completed
priority: p1
issue_id: "037"
tags: [code-review, architecture, quality, design-system, post-session]
dependencies: []
---

# Compose Select for Post-Session form fields

## Problem Statement

Session Selection, No Recording Reason, and Students Dropdown reinvent or fight DS form controls: Dropdown + `fieldDropdownStyles` `!important` injection for single-select fields, and a ~260 LOC custom multi-select instead of `Select` (`mode="multi" searchable displayMode="badges"`).

This blocks correct token/component usage and will drift from Foundations.

## Findings

- `SessionSelection.jsx` / `NoRecordingReason.jsx` use `Dropdown` then inject `fieldDropdownStyles.js` (~20 `!important` rules + hex/rgba fallbacks).
- `StudentsDropdown.jsx` hand-rolls trigger, menu, search, checkboxes, Badge dismiss overrides; DS `Select` already supports multi + searchable + secondary dismissible badges.
- Known pattern: silent token drift when specs invent chrome ([docs/knowledge/lessons/ds-compliance.md](../docs/knowledge/lessons/ds-compliance.md)).
- forms.md maps pick-one → Select, pick-many → SelectMultiple/Select multi.

## Proposed Solutions

### Option 1: Thin organism wrappers over Select (recommended)

**Approach:** Keep Figma organism names; implement with `Select` single/multi. Delete `fieldDropdownStyles.js` and hand-rolled StudentsDropdown engine.

**Pros:** Matches Figma catalog + Foundations; deletes !important layer; a11y comes from Select.
**Cons:** May need Select tweaks (label/helper slots, required asterisk).
**Effort:** Medium
**Risk:** Medium

### Option 2: Add Dropdown “field” variant in Foundations

**Approach:** Promote medium form-field look into Dropdown SCSS; keep Session/NoRecording on Dropdown; still migrate Students → Select.

**Pros:** Fixes single-select without Select migration.
**Cons:** Leaves two pickers; Students still custom.
**Effort:** Medium
**Risk:** Medium

## Recommended Action

**To be filled during triage.**

## Technical Details

**Affected files:**
- `design-system/src/specs/Toolkit/Post-Session/Elements/fieldDropdownStyles.js`
- `…/SessionSelection/SessionSelection.jsx`
- `…/NoRecordingReason/NoRecordingReason.jsx`
- `…/StudentsDropdown/StudentsDropdown.jsx`
- `…/Sections/SessionInformationForm/SessionInformationForm.jsx`
- `design-system/src/components/forms-and-inputs/Select.jsx`

## Acceptance Criteria

- [x] No runtime `<style>` + `!important` for Post-Session fields
- [x] Session Selection + No Recording Reason use Select (or documented Dropdown field variant)
- [x] Students Dropdown uses Select multi + searchable + badges (or thin wrapper)
- [x] Storybook Overview still maps to Figma Elements nodes
- [x] No hardcoded elevation rgba / hex in these fields

## Work Log

### 2026-07-30 - Code review

**By:** CE review (PR #81)

**Actions:**
- Multi-agent review flagged Dropdown misuse vs Select
- Confirmed Select supports `mode="multi"`, `searchable`, `displayMode="badges"`, secondary Badge dismiss

**Learnings:**
- StudentsDropdown reinvented an existing Select API

## Resources

- **PR:** https://github.com/BilLogic/plus-uno/pull/81
- **Figma:** Students Dropdown `20:24325`, Session selection `20:24370`, No Recording Reason `10925:11334`
- **Lesson:** docs/knowledge/lessons/ds-compliance.md
