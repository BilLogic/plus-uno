---
status: complete
priority: p1
issue_id: "070"
tags: [code-review, post-session, architecture, quality]
dependencies: []
---

# Delete Post-Session archives and unused V1 forms

## Problem Statement

26 .archive files reintroduced (044 regression) + unused V1 Session/Student/FormFeedback forms polluted the tree.

## Findings

From ce:review (2026-07-30) against Figma `1721:118446` + Notion Form Design & Tutor Experience.

## Proposed Solutions

### Option 1 (recommended)

Hard-deleted archives, FormReflection folder, V1 form modules. STRUCTURE updated.

## Recommended Action

Completed in follow-up commit.

## Acceptance Criteria

- [x] Matches Figma Components strip / Notion Form Design where applicable
- [x] No Storybook catalog pollution from obsolete names

## Work Log

- 2026-07-30: Filed from ce:review synthesis (kieran-typescript, architecture-strategist, code-simplicity, security-sentinel).
