<!-- ~500 tokens | Load when: production-ready implementation with all states and accessibility -->

# Production Readiness Checklist

Use with **uno-review** when implementing approved designs for production (not disposable prototypes prototypes).

## Interactive States (verify each)

- Default, hover, focus, pressed/active, disabled
- Loading, error/validation (form flows)
- Empty data, long-text truncation/wrap, skeleton states

## Figma Implementation

If a Figma link is provided:

1. Follow `../uno-prototype/references/figma-mcp-guide.md` (7 steps)
2. Load registries per `figma-registry-mandatory-load.md`
3. Use `get_variable_defs` to verify tokens against latest Figma variables

## Accessibility (mandatory)

- Semantic HTML first; ARIA only when needed
- Keyboard navigation and visible focus indicators
- Color contrast and readable state communication
- Screen-reader-friendly labels and content order

See also `docs/context/design-system/foundations/accessibility.md`.

## Before Finishing

- [ ] Tokens only — no hardcoded visual values where DS tokens exist
- [ ] PLUS components/specs before generic framework substitutions
- [ ] Storybook stories updated for changed behavior/states
- [ ] Responsive at `md`, `lg`, `xl` — use `ResponsiveFrame` patterns for page-level work
- [ ] Accessibility pass (focus, keyboard, labels, contrast)

## Spec References (common patterns)

**Card surfaces in admin contexts:**
- `design-system/src/specs/Admin/Tutor Admin/Cards/TutorDataCard/TutorDataCard.scss`
- `design-system/src/specs/Admin/Student Admin/Sections/StudentOverviewSection/StudentOverviewSection.scss`

**Table styling:**
- Respect global table reset in `design-system/src/styles/main.scss`
- Reference: `design-system/src/specs/Admin/Student Admin/Tables/StudentsTable/StudentsTable.scss`

**Responsive verification:**
- `design-system/src/specs/Universal/ResponsiveFrame.jsx`
