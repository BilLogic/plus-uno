---
status: completed
priority: p1
issue_id: "053"
tags: [notion, figma, post-session, cadence]
dependencies: ["050", "052"]
---

# Self Reflection + Form Feedback match Form Design (content + cadence)

## Problem Statement

Notion PRD/Form Design: Self on `session_count % 10 == 5`; Form Feedback ≤ once / 3 weeks per tutor. Self content = Linear Scale with correct anchors + effective/improve chips + AI + support Free Response with escalate toggle. Form Feedback = thumbs scale with exact labels + two free-response questions (caption vs danger warning). Current ReflectionFlow always shows both stubs with wrong copy.

## Findings

- Self question in code: “How do you feel about your performance…” — Spec: “How did this session go for you?” anchors “I struggled…” ↔ “I nailed it!”
- Missing Self chip banks / AI / support escalate
- Form Feedback Q1 copy wrong (“How was this reflection form?” vs intuition scale); missing “How was your reflection experience?” + “Any additional comments…” with privacy warning
- Cadence not modeled — both always required for `canSubmit`
- Milestone modal for Self not present

## Proposed Solutions

### Option 1: Spec-complete steps + prototype cadence flags (recommended)

**Approach:** Rebuild Self/Form Feedback bodies from Figma masters; add `showSelfReflection` / `showFormFeedback` props (default true for Storybook demos; prototype can toggle). Side nav hides tabs when cadence off. Submit validation skips hidden sections.

**Effort:** Large
**Risk:** Medium

## Acceptance Criteria

- [x] Self copy, scale anchors, chips, AI, support+escalate match Form Design §4
- [x] Form Feedback Q1–Q3 match §5 (caption vs danger warning)
- [x] Cadence flags hide sections + nav + submit requirements
- [x] Storybook covers with/without Self and Form Feedback

## Resources

- Notion Form Design §§4–5; PRD requirements 6–7
- Figma Self `5179:79703`; Form Feedback `5176:24528`
