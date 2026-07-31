---
status: complete
priority: p2
issue_id: "085"
tags: [code-review, security, foundations]
dependencies: []
---

# Allowlist Modal width CSS values

## Problem Statement

`resolveModalWidth` accepts arbitrary CSS length strings. Latent layout/redressing risk if width is ever caller-controlled. ConfirmationPopUp currently passes a number.

## Findings

- Security-sentinel P2: `Modal.jsx` ~19–25
- Also: `{...props}` after `style` can overwrite resolved width (P3 adjacent)

## Proposed Solutions

### Option 1: Allowlist finite numbers + safe units + CSS vars (recommended)

**Approach:** Numbers → px; strings matching `/^\d+(\.\d+)?(px|rem|%)$/` or `^var\(--[a-z0-9-]+\)$/`; else fallback + dev warn. Stop spreading raw props onto content node; merge style carefully.

**Effort:** Small

**Risk:** Low

### Option 2: Numbers only

**Approach:** Reject all strings except undefined.

**Effort:** Small

**Risk:** Medium (breaks `var(--col-*)` callers if any)

## Recommended Action

## Acceptance Criteria

- [ ] Invalid width strings fall back safely
- [ ] Numeric 340 and token vars (if supported) still work
- [ ] Prop spread cannot clobber width/style silently

## Work Log

- 2026-07-31: Flagged by security-sentinel

- 2026-07-31: Implemented and verified in Post-Session PR #88 branch (tests green).
