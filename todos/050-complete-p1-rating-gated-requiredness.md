---
status: completed
priority: p1
issue_id: "050"
tags: [notion, figma-annotation, post-session, validation]
dependencies: []
---

# Rating gates requiredness (Session + Self); both questions always render

## Problem Statement

Notion Form Design §3–§4: ratings do not hide questions; they decide which is **required**. 4–5 → worked/effective required, improve optional; 1–2 → reversed; 3 → both. Current Session form always stars What worked, never requires improve, and hides both until rating > 0. Self step is a stub without chip banks.

## Findings

- Spec: “Both questions always render; only the required mark and validation change.”
- `SessionReflectionFormV2`: `{rating > 0 && (…)}` gates entire chip block; `canNext` requires `whatWorked` always, never gates on rating for improve.
- AI should fire when rating + **rating-gated** selection complete (Notion AI Spec) — optional gated field not waited on.
- Self Reflection step lacks effective/improve MultiSelects entirely.

## Proposed Solutions

### Option 1: Always show chip banks; compute required flags from rating (recommended)

**Approach:** After rating selected, show both banks always; `requiredWorked = rating >= 3` (or >=4 for worked-only? Spec: 4–5 worked required / 1–2 improve required / 3 both). Validate `canNext` accordingly. Same for Self.

**Effort:** Medium
**Risk:** Low

## Acceptance Criteria

- [x] Both Session chip questions visible whenever rating set (and ideally even before, if Figma unfilled shows them — verify masters)
- [x] Asterisk + Next validation follow rating gates
- [x] Self uses same gating on effective / improve banks
- [x] AI fires when required-above-card fields complete

## Resources

- Notion Form Design §3–§4; AI Spec fire conditions
