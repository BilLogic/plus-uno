# Example Audit: uno-plan

## Executive Summary
- Overall result: `Needs Revision`
- Issues: `4` (`P0: 0`, `P1: 3`, `P2: 1`)
- Primary risk: misuse boundaries and failure behavior are not explicit enough for stable triggering.

## Issue 1 - Not-for-Use Boundaries Not Explicit
- Priority: `P1`
- Checklist section: `9. Failure Handling`
- Specific problem:
  - Misuse prevention exists implicitly but lacks a clear "Not for Use" block.
- Original code:
```md
## Constraints
- No code generation...
```
- Improvement suggestion:
  - Add a dedicated Not-for-Use section with concrete exclusions.
- Suggested revised code:
```md
## Not for Use
- Small UI tweaks or single-component changes
- Direct coding requests
- Bug fixing/debugging tasks
```

## Issue 2 - Failure Handling Edge Cases Are Under-Specified
- Priority: `P1`
- Checklist section: `9. Failure Handling`
- Specific problem:
  - The skill does not fully define behavior when key context inputs are missing.
- Original code:
```md
### Step 1: Ingest Research (if available)
```
- Improvement suggestion:
  - Add explicit fallback outcomes for missing brief, inventory gaps, and unclear token choices.
- Suggested revised code:
```md
## Failure Handling
- If research brief is missing: proceed with user input and mark assumptions.
- If inventory lacks required component: mark as gap and request user decision.
- If token choice is unclear: propose 2-3 options and confirm.
```

## Issue 3 - Positioning As Planning Bridge Can Be Stronger
- Priority: `P2`
- Checklist section: `1. Skill Definition`
- Specific problem:
  - Description implies planning but does not clearly emphasize pre-implementation role.
- Original code:
```md
description: >
  Scope features, plan implementations, and create structured briefs.
```
- Improvement suggestion:
  - Clarify that the skill is a planning bridge before build execution.
- Suggested revised code:
```md
description: >
  This planning skill scopes implementation before coding and bridges
  research findings to prototype execution briefs.
```

## Issue 4 - Consulting Reference Discoverability Is Weak
- Priority: `P1`
- Checklist section: `7. Trigger -> Action Mapping`
- Specific problem:
  - `references/consulting.md` is not explicitly linked from core loading logic.
- Original code:
```md
| Trigger | Load |
|---------|------|
| Any plan | `docs/context/conventions/tech-stack.md` |
```
- Improvement suggestion:
  - Add a trigger row for unclear layout/IA cases that maps to consulting reference.
- Suggested revised code:
```md
| Layout / IA unclear | `references/consulting.md` |
```
