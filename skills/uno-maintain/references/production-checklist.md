---
embodiment: ide
summary: Use with uno-review when implementing approved designs for production (not disposable prototypes)
---

<!-- ~500 tokens | Load when: production-ready implementation with all states and accessibility -->

# Production Readiness Checklist

Use with **uno-review** when implementing approved designs for production (not disposable prototypes).

## Interactive States (verify each)

- Default, hover, focus, pressed/active, disabled
- Loading, error/validation (form flows)
- Empty data, long-text truncation/wrap, skeleton states

## Figma Implementation

If a Figma link is provided:

1. Follow `../../../design-system/guidelines/figma/mcp-guide.md` (7 steps)
2. Load registries per `design-system/guidelines/figma/registry-load-gate.md`
3. Use `get_variable_defs` to verify tokens against latest Figma variables

## Accessibility (mandatory)

- Semantic HTML first; ARIA only when needed
- Keyboard navigation and visible focus indicators
- Color contrast and readable state communication
- Screen-reader-friendly labels and content order

See also `design-system/src/styles/Accessibility.mdx`.

## Before Finishing

- [ ] Tokens only — no hardcoded visual values where DS tokens exist
- [ ] PLUS components and patterns before generic framework substitutions
- [ ] Storybook stories updated for changed behavior/states
- [ ] Responsive at `md`, `lg`, `xl` — page-level work sits in `PageLayout`, whose Frame resolves the layout from its own width
- [ ] Accessibility pass (focus, keyboard, labels, contrast)

## Pattern references

- **Card surfaces:** `design-system/src/patterns/PatternCard/`
- **Tables:** `design-system/src/patterns/PatternTable/`; respect the global table reset in `design-system/src/styles/main.scss`
- **Page layout and breakpoints:** `design-system/src/patterns/PageLayout/` and `design-system/src/patterns/Frame/`
