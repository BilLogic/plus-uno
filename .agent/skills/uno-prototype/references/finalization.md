i <!-- ~900 tokens | Load for: production-ready implementation with all states and accessibility -->

# Finalization Mode Reference

## Contents
- When to Use This Mode
- Design Constraints
- Resources to Reference
- How to Respond in Finalization Mode
- Strict Adherence Checklist
- Technical Guardrails
- Finalization Mode Example

## When to Use This Mode
- Implementing approved designs in production-quality code.
- Translating final design tool artifacts to DS components.
- Completing all interactive states and accessibility requirements.

### Decision Tree
- If design is approved and implementation-ready: use Finalization Mode.
- If validating an idea with high-fidelity but disposal code: use Prototyping Mode.
- If still comparing alternatives: use Iteration Mode.
- If only asking conceptual structure: use Consulting Mode.

## Design Constraints
- Strict token enforcement
- Complete interactive states
- Accessibility is mandatory
- Pixel-accurate to approved design intent
- React-first implementation in this repo (JSX + SCSS + Storybook stories for changed UI)

## Resources to Reference

For exhaustive lookup paths/globs/commands, load `docs/context/design-system/index-manifest.json` and the relevant index file(s).

1. Full tokens
- `references/tokens-guide.md`
- `design-system/src/tokens/*.scss`

2. Component APIs and behavior
- `design-system/src/components/**`
- `design-system/src/forms/**`
- `design-system/src/DataViz/**`

3. Production patterns/examples
- `design-system/src/specs/**`
- `design-system/src/**/*.stories.jsx`

4. Design-tool integration
- `.agent/skills/uno-prototype/references/figma-mcp-guide.md` — full Figma MCP tool reference and implement-design 7-step workflow
- `.agent/skills/uno-prototype/references/figma-workflow.md` — token sync, extraction process, Figma-to-CSS mapping
- `scripts/sync-figma-tokens.js`
- Figma MCP tools: `get_design_context`, `get_screenshot`, `get_variable_defs`, `search_design_system`
- `get_variable_defs` for real-time token verification during implementation (complements daily sync)
- Code Connect not yet available — fall back to `docs/context/design-system/components/components-index.json` for component discovery
- Stitch MCP for early wireframe handoff context when finalization follows consulting/iteration

5. Accessibility expectations
- Existing component patterns in stories and specs
- Keyboard/focus behavior already modeled by DS + React-Bootstrap usage

## How to Respond in Finalization Mode

1. Extract Complete Design
- If a Figma link is provided, follow the full implement-design workflow in `.agent/skills/uno-prototype/references/figma-mcp-guide.md` (7 steps: extract node IDs → fetch design context → capture screenshot → download assets → translate to PLUS conventions → achieve visual parity → validate).
- Capture spacing, typography, color, dimensions, states, and responsive expectations.
- Use `get_variable_defs` to verify token values match the latest Figma variables.
- If finalization follows Stitch-assisted exploration, carry forward selected wireframe structure as the implementation baseline.

2. Map to DS Components
- Prefer existing PLUS components/specs.
- Use forms/dataviz modules where available.
- Avoid introducing net-new primitives unless required.

3. Implement All States
- Default
- Hover
- Focus
- Pressed/Active
- Disabled
- Loading
- Error/Validation (for form flows)

4. Apply Tokens Exactly
- Use semantic tokens by context.
- Avoid hardcoded fallback values except where existing codebase convention already includes fallback.

5. Ensure Accessibility
- ARIA labels and semantic roles when needed.
- Keyboard navigation and visible focus indicators.
- Color contrast and readable state communication.
- Screen-reader-friendly labels/content order.

6. Responsive Behavior
- Validate key breakpoints used by repo (`md`, `lg`, `xl`).
- Use `ResponsiveFrame` story patterns for page-level verification where applicable.

7. Handle Edge Cases
- Long text truncation/wrap behavior
- Empty data states
- Loading/skeleton states
- Error and retry surfaces

8. MCP Fallback
- If Figma MCP or Stitch MCP is unavailable in the active runtime, call that out and continue using repo-native stories/specs/token sources.

## Strict Adherence Checklist

Before finishing, verify:
- [ ] React implementation (no standalone HTML-only output for DS implementation work)
- [ ] Tokens only (no hardcoded visual values where DS tokens exist)
- [ ] PLUS components/specs used before generic framework substitutions
- [ ] Storybook coverage updated for changed behavior/states
- [ ] Accessibility checks completed (focus, keyboard, labels, contrast)

## Technical Guardrails

1. Card surfaces in section/chart contexts
- Prefer DS surface tokens and existing admin card patterns.
- Reference:
  - `design-system/src/specs/Admin/Tutor Admin/Cards/TutorDataCard/TutorDataCard.scss`
  - `design-system/src/specs/Admin/Student Admin/Sections/StudentOverviewSection/StudentOverviewSection.scss`
  - `design-system/src/specs/Admin/Session Admin/Sections/SessionOverviewSection/SessionOverviewSection.scss`

2. Table styling consistency
- Respect global table reset behavior from `design-system/src/styles/main.scss`.
- Avoid reintroducing hard borders/backgrounds that conflict with DS table conventions.
- Reference:
  - `design-system/src/specs/Admin/Student Admin/Tables/StudentsTable/StudentsTable.scss`

3. Responsive verification
- For page-level stories, include breakpoint checks (`md`, `lg`, `xl`) and use `ResponsiveFrame` patterns when applicable.
- Reference:
  - `design-system/src/specs/Universal/ResponsiveFrame.jsx`

## Finalization Mode Example

A complete page implementation should include:
- DS component mapping table (design node -> component)
- State matrix per interactive element
- Accessibility checklist pass
- Responsive notes for `md/lg/xl`
- Storybook story updates for critical states
