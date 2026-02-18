# Consulting Mode Reference

## When to Use This Mode
- Early-stage concept exploration before visual lock.
- Information architecture and page structure decisions.
- Layout-first wireframing where component detail is secondary.

### Decision Tree
- If the user asks "what should we do" or "which structure works": use Consulting Mode.
- If they ask for multiple styled options: use Iteration Mode.
- If they ask for final production implementation: use Finalization Mode.

## Design Constraints
- Greyscale only
- Structure and hierarchy over polish
- No interactive state detailing
- Box-and-arrow content relationship focus

## Resources to Reference

For exhaustive lookup paths/globs/commands, load `.agent/assets/index-manifest.json` and the relevant index file(s).

1. Layout and structural patterns
- `packages/plus-ds/guidelines/layout-grid.md`
- `packages/plus-ds/src/specs/**`

2. Spacing and hierarchy tokens
- `packages/plus-ds/src/tokens/_spacing_semantics.scss`
- `packages/plus-ds/src/tokens/_layout.scss`

3. Typography hierarchy
- `packages/plus-ds/src/tokens/_fonts.scss`
- `packages/plus-ds/guidelines/design-tokens/typography.md`

4. Structural examples
- `playground/templates/**/STRUCTURE.md`
- `references/patterns-guide.md`

5. Wireframe tooling (critical when available)
- Stitch MCP for PRD/brief-to-wireframe generation and structural variants.
- Figma MCP for reading existing design context when consulting starts from an existing design artifact.

## How to Respond in Consulting Mode

1. Generate Structural Wireframes
- If Stitch MCP is available, generate initial wireframes/options from the brief before manual refinement.
- Use layout containers/sections and content blocks.
- Use neutral/surface tokens only.
- Emphasize content flow and visual hierarchy.

2. Avoid
- Brand accent colors
- Hover/focus/pressed details
- Overly specific component variants
- Micro-interactions and animation detail

3. Ask About Structure
- What is the primary user goal on this screen?
- What must be visible above the fold?
- What is fixed vs scrollable?
- Which data blocks are most important?

4. Deliverable
- Low-fidelity greyscale structure
- Clear sections, cards, tables, and navigation zones
- Spacing rhythm using DS semantic spacing

5. MCP Fallback
- If Stitch MCP or Figma MCP is unavailable in runtime, state that and proceed with repository patterns/specs manually.

## Consulting Mode Example

Example 1: Dashboard planning output
- Header zone (title + primary action)
- KPI strip (3-4 equal cards)
- Main content split (table left, detail panel right)
- Footer utility row
- Notes on section spacing tokens and hierarchy rationale

Example 2: Form page planning output
- Intro section
- Grouped form sections by task stage
- Review/submit section pinned at bottom
- Error summary block placement and empty-state space
