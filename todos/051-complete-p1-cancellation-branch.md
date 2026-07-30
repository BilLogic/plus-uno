---
status: completed
priority: p1
issue_id: "051"
tags: [notion, figma, post-session, cancellation]
dependencies: ["052"]
---

# Cancellation branch when “Session did not happen”

## Problem Statement

Notion Form Design + Figma Session Info `state=cancelled` (`563:296342`): toggle switches to cancellation — multi-select reasons (≥1) with examples + required situation description; no roster/upload; Submit replaces Next. Toggle exists on SessionSelection but does not change the form body; students + upload still required for Next.

## Findings

- `SessionInformationForm` keeps StudentsDropdown + UploadFiles when `hasDateAndSession`, ignoring `didNotHappen`.
- `canNext` still needs students + recordingOk.
- ReflectionFlow has no cancellation path to submit early.
- Reason examples from Notion: Unforeseen circumstances · Technical difficulties · Participant absence · Schedule conflict · Communication error · Other (+ describe).

## Proposed Solutions

### Option 1: Branch SessionInformationForm + Flow submit (recommended)

**Approach:** When `didNotHappen`, hide students/upload; show checkbox multi-select + FreeResponseQuestion for situation; Next/Submit validates ≥1 reason + description; Flow skips student/session/self and completes.

**Effort:** Medium–Large
**Risk:** Medium (flow orchestration)

## Acceptance Criteria

- [x] Toggle on → cancellation UI; off → normal Session Info
- [x] No recording/roster on cancel path
- [x] ≥1 reason + required description to submit
- [x] Flow writes cancellation instead of §§2–3

## Resources

- Notion Form Design — Cancellation
- Figma `563:296342`
