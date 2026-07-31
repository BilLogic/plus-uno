---
status: complete
priority: p2
issue_id: "081"
tags: [code-review, post-session, prototype, figma]
dependencies: []
---

# Gate SideNav tab clicks to completed prerequisites

## Problem Statement

Only Student Reflection is muted in `pre-student-add`. Session / Self / Form Feedback tabs stay clickable, so users can skip Next/rating gates. Undermines form requiredness and Figma progress-indicator intent.

## Findings

- `SideNavBar.jsx` ~153–174: `sectionState` never muted for later tabs
- `ReflectionFlow.jsx` `onTabClick={setActiveTab}` with no guard
- Also: `state === 'in-progress'` falsely marks `studentDone` (~101–102 SideNav + ReflectionFlow ~320)

## Proposed Solutions

### Option 1: Derive enabled tabs from completedSections (recommended)

**Approach:** Mute/disable tabs until prerequisites complete; ignore illegal clicks in ReflectionFlow. Fix `studentDone` to require actual student completion, not `in-progress` state.

**Effort:** Medium

**Risk:** Low

### Option 2: Allow free nav in Storybook only

**Approach:** `allowFreeNav` prop for docs; default gated in ReflectionFlow.

**Effort:** Medium

**Risk:** Low

## Recommended Action

## Acceptance Criteria

- [ ] Later tabs disabled until prior steps complete (unless story override)
- [ ] Student Reflection checkmark only when students actually complete
- [ ] Next buttons remain source of truth for progression

## Work Log

- 2026-07-31: Flagged by architecture, TS, Figma, prototype agents
