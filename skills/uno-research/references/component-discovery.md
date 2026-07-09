<!-- Load for: finding existing components before building new ones, design-to-code mapping -->

# Component Discovery Process

0. **Mandatory Existing Component Check:** You MUST always check if there is a similar or exact component that already exists within the design system FIRST before starting to implement any new custom component. Do not build from scratch if the design system already provides it.

0a. **Mandatory Figma Registry Load:** When a Figma link, design-to-code mapping, or Figma audit is involved, read `design-system/figma/component-registry.json` and `design-system/figma/token-registry.json` before any other discovery. See `../uno-prototype/references/figma-registry-mandatory-load.md`.

1. Check design-to-code mapping first
- If a design link is provided, fetch design context/screenshot first.
- Resolve components via `component-registry.json` (primary) and `search_design_system` MCP (secondary).
- If MCP suggests a component, cross-check against registry before using imports or props.

2. Check component documentation
- Start with `docs/context/design-system/components/inventory.md`
- Then inspect story files: `design-system/src/**/*.stories.jsx`
- Use `.storybook/main.js` story globs to locate authoritative examples.

3. Understand hierarchy before implementing
- Primitives/tokens: `design-system/src/tokens/*`
- Reusable components: `design-system/src/components/*`, `design-system/src/forms/*`, `design-system/src/DataViz/*`
- Higher-level compositions/specs: `design-system/src/specs/*`

4. Decide when to ask vs proceed
- Ask when design intent is ambiguous, target context level is unclear, or multiple component families fit equally.
- Proceed when a direct component/story/spec precedent exists.
