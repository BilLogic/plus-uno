---
status: completed
priority: p1
issue_id: "048"
tags: [figma-annotation, notion, post-session, tooltips]
dependencies: []
---

# Option chips need hover ≥2s tooltips (Figma Content annotations)

## Problem Statement

Figma Multi-Select Question (`10791:8694`) and Notion Form Design require every option chip to show a tooltip after hover ≥2s (hide on move-away). Copy lives as Content annotations on each chip in page masters. Implementation has zero Tooltip usage on OptionChip / MultiSelectQuestion.

## Findings

- Annotation: “Hovering an option for 2 s or more shows its tooltip; it hides on move-away. Applies to every instance… Each option’s tooltip copy is a Content annotation on that chip in the page masters.”
- Notion §2: “Every chip carries a tooltip on hover ≥2 s.”
- Hub changelog (Jul 29): tooltips annotated per option.
- DS `Tooltip` exists (`components/overlays/Tooltip`) but hardcodes `delay.show: 250` — need 2000ms for this use (or pass delay).
- Sample tooltip copy already in Figma masters (Session What worked / improve / escalation; Student progress / effort / engagement / escalation).

## Proposed Solutions

### Option 1: Wire Tooltip on OptionChip via `tooltip` prop (recommended)

**Approach:** Add optional `tooltip` string to OptionChip; wrap with DS Tooltip (`delayShow: 2000`). Put copy on option objects in `reflectionCopy.js`. MultiSelectQuestion / OptionChipGroup pass through.

**Pros:** Matches annotation; reusable.
**Cons:** Tooltip API may need a delay prop if not already exposed.
**Effort:** Medium
**Risk:** Low

## Recommended Action

Implement Option 1; extract all Content annotation strings into `reflectionCopy.js` next to labels.

## Acceptance Criteria

- [x] Hover ≥2s shows tooltip; leave hides it
- [x] Every chip in Student / Session / Self multi-selects has Figma Content copy
- [x] Storybook Multi-Select / Option Chip demos tooltips
- [x] No tooltip markup in Figma annotation attributes in shipped code

## Resources

- Figma Multi-Select `10791:8694`; page masters Student `10662:18966` / Session `10662:18166`
- Notion Form Design: https://app.notion.com/p/2e0b7cca4982816a8641c69fe65287b6
- Hub: Tutor Reflection Form Enhancement
