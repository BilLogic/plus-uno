---
status: complete
priority: p2
issue_id: "083"
tags: [code-review, post-session, architecture, quality]
dependencies: []
---

# Promote SessionRating / FormRating Elements; forms must consume them

## Problem Statement

STRUCTURE catalogs Session Rating / Form Rating as Elements, but forms import Foundations `Rating` directly. FormRating is stories-only (no `.jsx`). Optimal DS composition requires Elements to own Rating + comment copy from `reflectionCopy`.

## Findings

- Architecture P1 (downgraded to P2 for merge: not a runtime break)
- `SessionReflectionFormV2` / `FormFeedbackForm` bypass Elements
- `FormRating/` has MDX + stories only after 074 colocation

## Proposed Solutions

### Option 1: Extract Element modules (recommended)

**Approach:** `SessionRating.jsx` / `FormRating.jsx` wrapping Rating + SESSION/FORM_RATING_COMMENTS. Forms + stories import Elements only.

**Effort:** Medium

**Risk:** Low

### Option 2: Document Rating-direct as intentional

**Approach:** Downgrade STRUCTURE to note Elements are docs wrappers only.

**Effort:** Small

**Risk:** Medium (IA drift)

## Recommended Action

## Acceptance Criteria

- [ ] FormRating.jsx and SessionRating.jsx exist as real Elements
- [ ] Section forms import Elements, not Foundations Rating directly
- [ ] Stories stay colocated

## Work Log

- 2026-07-31: Flagged by architecture-strategist

- 2026-07-31: Implemented and verified in Post-Session PR #88 branch (tests green).
