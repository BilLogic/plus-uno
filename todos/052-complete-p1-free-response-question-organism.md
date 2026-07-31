---
status: completed
priority: p1
issue_id: "052"
tags: [figma, notion, post-session, components]
dependencies: []
---

# Add Free Response Question organism (caption + danger warning slots)

## Problem Statement

Figma Sections · Free Response Question (`791:137860`) is the pattern for every free-text field: Label, optional caption (neutral), optional warning (danger red), optional example, textarea, optional escalate toggle. Notion insists caption and privacy warning are **separate slots** — colour cannot share one property. Not implemented; AI box / Form Feedback / Self / escalation / cancellation use bare Textarea.

## Findings

- Used by: cancellation description · Session/Student escalation description · Self support (+ escalate toggle) · Form Feedback Q2 (caption) · Q3 (warning) · AI privacy line
- Archive `FormReflection.jsx` had warning text but wrong structure
- AiPromptedQuestionBox missing danger privacy line under answer
- Form Feedback step missing Q2 caption + Q3 warning question

## Proposed Solutions

### Option 1: New `Sections/FreeResponseQuestion` composing Label + Textarea + Switch (recommended)

**Approach:** Props: `label`, `required`, `caption`, `warning`, `example`, `showEscalate`, escalate state/handlers. Wire into consumers. AI box can compose warning slot or share the privacy string.

**Effort:** Medium
**Risk:** Low

## Acceptance Criteria

- [x] Organism matches Figma Empty/Filled + escalate variant
- [x] Caption = on-surface-variant; warning = danger-text
- [x] Wired for escalation describe, Self support, Form Feedback Q2/Q3, cancellation
- [x] AI card shows privacy warning in danger red
- [x] Storybook leaf under Sections

## Resources

- Figma `791:137860`
- Notion Form Design §5 + AI cards contract
