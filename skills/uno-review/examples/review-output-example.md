---
embodiment: ide
---

# Review Output Examples

## PASS — No violations

```
PLUS Review: prototypes/onboarding-flow/src
===
  PASS  No hardcoded hex colors
  PASS  No raw HTML form elements (using DS components)
  PASS  No deep imports into design-system/src/
  PASS  No hardcoded pixel values in inline styles
  PASS  No Font Awesome Pro icons
===
Results: 6 passed, 0 warnings, 0 failures
STATUS: PASS

✅ All checks passed. Ready to ship.
```

## WARN — Minor issues, can ship with notes

```
PLUS Review: prototypes/tutor-scheduling/src
===
  PASS  No hardcoded hex colors
  WARN  Found 2 lines with raw HTML elements (use DS components)
    src/components/TimeSlot.jsx:15: <button onClick={handleClick}>
    src/components/TimeSlot.jsx:28: <input type="time" value={time} />
  PASS  No deep imports into design-system/src/
  PASS  No hardcoded pixel values in inline styles
  PASS  No Font Awesome Pro icons
===
Results: 4 passed, 1 warnings, 0 failures
STATUS: WARN

⚠️ Can ship with notes:
- TimeSlot.jsx: Replace raw <button> with <Button>, <input type="time"> with <TimePicker>
```

## FAIL — Violations that must be fixed

```
PLUS Review: prototypes/parent-dashboard/src
===
  WARN  Found 5 lines with hardcoded hex colors (use var(--ds-*) tokens)
    src/components/StatusBadge.jsx:8: color: '#ff4444'
    src/components/StatusBadge.jsx:12: color: '#44bb44'
    ...
  PASS  No raw HTML form elements (using DS components)
  FAIL  Found 3 deep imports (use the @/components barrel)
    src/pages/Dashboard.jsx:2: from 'design-system/src/components/forms-and-inputs/Button/Button.jsx'
    src/pages/Dashboard.jsx:3: from 'design-system/src/components/labels/StatusTag/StatusTag.jsx'
    src/pages/Settings.jsx:1: from 'design-system/src/components/messaging/Flag/Flag.jsx'
  PASS  No hardcoded pixel values in inline styles
  FAIL  Found 2 FA Pro icon references (only fa-solid, fa-regular, fa-brands allowed)
    src/components/Nav.jsx:5: fa-light fa-house
    src/components/Nav.jsx:8: fa-thin fa-gear
===
Results: 2 passed, 1 warnings, 2 failures
STATUS: FAIL

❌ Must fix before shipping:
1. Deep imports: import { StatusTag } from '@/components', PatternCard from '@/patterns', tokens as var(--ds-*)
2. FA Pro icons: Replace fa-light/fa-thin with fa-solid equivalents
```
