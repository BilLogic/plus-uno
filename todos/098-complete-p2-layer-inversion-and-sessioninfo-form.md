---
status: complete
priority: p2
issue_id: "098"
tags: [code-review, post-session, architecture]
dependencies: []
---

# Fix Element→Section import; extract SessionInfoForm for Flow

## Problem Statement

1. `NoRecordingReason` (Element) imports `OtherTextInput` (Section) — layer inversion.
2. `ReflectionFlow` imports `SessionInfo` Page as a step body while other steps use Section form composers — asymmetric architecture.

## Findings

- [architecture-strategist](4039a425-7c4f-49eb-84a7-7067759d688b)
- STRUCTURE documents form composers under Sections; Session Info still lives as a Page body

## Proposed Solutions

### Option 1: Extract SessionInfoForm + inline Other in Element (recommended)

**Approach:** Move Session Info body to `Sections/SessionInfoForm/`; page + Flow compose it. Replace NoRecordingReason’s OtherTextInput with Foundations Textarea/Label (or a thin Element shared with OtherTextInput).

**Effort:** Medium

**Risk:** Low–Medium (import churn)

### Option 2: Document asymmetry as intentional

**Approach:** Keep SessionInfo as Page-only; accept Element→Section for Other. Update STRUCTURE.

**Effort:** Small

**Risk:** Medium (IA drift continues)

## Recommended Action

## Acceptance Criteria

- [ ] No Element imports from Sections/
- [ ] ReflectionFlow imports only Section composers (or shared form modules) for step bodies
- [ ] Session Info page story still matches Figma

## Work Log

- 2026-07-31: Flagged in second-pass `/ce:review` of PR #88

## Resources

- PR: https://github.com/BilLogic/plus-uno/pull/88
