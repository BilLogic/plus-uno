---
status: completed
priority: p2
issue_id: "073"
tags: [code-review, post-session, architecture, quality]
dependencies: []
---

# Tokenize remaining raw px/hex in Post-Session organisms

## Problem Statement

SideNavBar, ConfirmationPopUp, FileListItem, field shells still use raw px/hex/opacity in places.

## Findings

From ce:review (2026-07-30) against Figma `1721:118446` + Notion Form Design & Tutor Experience.

## Proposed Solutions

### Option 1 (recommended)

Map remaining literals to --size-* / --color-* / typography classes; compose ButtonGroup if Figma-connected.

## Recommended Action

Triage — schedule after PR merge if not blocking.

## Acceptance Criteria

- [x] Matches Figma Components strip / Notion Form Design where applicable
- [x] No Storybook catalog pollution from obsolete names

## Work Log

- 2026-07-30: Filed from ce:review synthesis (kieran-typescript, architecture-strategist, code-simplicity, security-sentinel).

- 2026-07-30: Implemented — SideNav SCSS + --col-* widths; stories colocated under SideNavBar/ FormRating/ SessionRating/.
