# Implementation Patterns

This file captures established patterns to avoid drift when coding.

## Pattern 1: Tokens Over Literals

- Use `var(--color-*)`, `var(--size-*)`, `var(--font-*)`, `var(--elevation-*)`
- Prefer semantic spacing tokens by context level
- Keep primitives internal to token definitions

## Pattern 2: PLUS Component First

- Check `packages/plus-ds/src/components`, `forms`, and `specs` before introducing generic framework equivalents
- Reuse existing DS patterns for layout, state, and typography

## Pattern 3: Story-Driven Verification

- Update or add `*.stories.jsx` for changed behavior
- Keep Storybook controls grouped per `packages/plus-ds/guidelines/guides/Storybook.md`
- Validate visually in Storybook (`npm run storybook`)

## Pattern 4: Figma-to-Code Flow

- If design link exists: fetch design context + screenshot first
- Map design blocks to DS components/specs
- Use tokenized implementation and verify states
- Reference: `packages/plus-ds/guidelines/guides/figma-workflow.md`

## Pattern 5: Responsive Framing for Page Specs

- For page-level stories, use responsive breakpoint checks (`md`, `lg`, `xl`)
- Leverage `ResponsiveFrame` pattern where applicable

## Pattern 6: State Completeness (Finalization)

For interactive controls, account for:
- Default, Hover, Focus, Pressed/Active, Disabled
- Loading/Error when relevant to component type

## Pattern 7: Documentation Coherence

When changing DS behavior:
- Update related guidelines
- Keep examples aligned with actual exports and props
- Remove stale path references

## Pattern 8: Card Styling Alignment

- For dashboard/section cards, align with established admin spec card styling.
- Reuse surface, spacing, radius, and elevation token patterns from:
  - `packages/plus-ds/src/specs/Admin/Tutor Admin/Cards/TutorDataCard/TutorDataCard.scss`
  - `packages/plus-ds/src/specs/Admin/Student Admin/Sections/StudentOverviewSection/StudentOverviewSection.scss`
  - `packages/plus-ds/src/specs/Admin/Session Admin/Sections/SessionOverviewSection/SessionOverviewSection.scss`

## Pattern 9: Table Styling Alignment

- Global table behavior is defined in `packages/plus-ds/src/styles/main.scss`.
- Keep table-level custom SCSS aligned with existing admin table implementations.
- Reference:
  - `packages/plus-ds/src/specs/Admin/Student Admin/Tables/StudentsTable/StudentsTable.scss`

## Pattern 10: Responsive Story Verification

- For page-level UI, include `md/lg/xl` verification in stories.
- Reuse `ResponsiveFrame` where appropriate.
- Reference:
  - `packages/plus-ds/src/specs/Universal/ResponsiveFrame.jsx`
