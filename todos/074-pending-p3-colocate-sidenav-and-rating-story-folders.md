---
status: pending
priority: p3
issue_id: "074"
tags: [code-review, post-session, architecture, quality]
dependencies: []
---

# Colocate SideNav + Rating story files under folders

## Problem Statement

SideNavBarReflection.stories.jsx and FormRating/SessionRating stories sit loosely under Sections/Elements.

## Findings

From ce:review (2026-07-30) against Figma `1721:118446` + Notion Form Design & Tutor Experience.

## Proposed Solutions

### Option 1 (recommended)

Move into SideNavBar/, FormRating/, SessionRating/ folders for IA consistency.

## Recommended Action

Triage — schedule after PR merge if not blocking.

## Acceptance Criteria

- [ ] Matches Figma Components strip / Notion Form Design where applicable
- [ ] No Storybook catalog pollution from obsolete names

## Work Log

- 2026-07-30: Filed from ce:review synthesis (kieran-typescript, architecture-strategist, code-simplicity, security-sentinel).
