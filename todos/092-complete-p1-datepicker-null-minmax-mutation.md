---
status: complete
priority: p1
issue_id: "092"
tags: [code-review, post-session, foundations, quality]
dependencies: []
---

# Harden DatePicker min/max parse + avoid mutating Date props

## Problem Statement

`handleDayClick` calls `.setHours` on `parseDate(minDate|maxDate)` with no null guard — invalid Storybook/control strings throw. `parseDate` returns the same `Date` instance when given a Date, so `setHours` mutates caller props.

## Findings

- [kieran-typescript-reviewer](e2581c19-4c7b-4a77-b2f6-00e4e6a2ec0b): `DatePicker.jsx` ~188–189, ~14
- Security P3 adjacent: picker DoS on bad minDate

## Proposed Solutions

### Option 1: Clone + null-safe compare (recommended)

**Approach:** Always `new Date(d.getTime())` from parse; skip bounds when parse returns null; compare timestamps like DateAndTimePicker.

**Effort:** Small

**Risk:** Low

## Recommended Action

## Acceptance Criteria

- [ ] Invalid `minDate`/`maxDate` strings do not throw on day click
- [ ] Passing a `Date` as min/max does not mutate the original instance
- [ ] Valid bounds still disable out-of-range days

## Work Log

- 2026-07-31: Flagged in second-pass `/ce:review` of PR #88

## Resources

- PR: https://github.com/BilLogic/plus-uno/pull/88
- Figma Date & Time Picker: `zAecJNRdvJzAUOcjV32tRX` node `13549:6703`
