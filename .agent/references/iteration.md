<!-- ~500 tokens | Load for: comparing 3-5 UI alternatives with tradeoffs -->

# Iteration Mode Reference

## When to Use This Mode
- Compare multiple valid UI approaches to the same problem.
- Evaluate alternative layout/component compositions.
- Produce candidate directions before selecting one for production.

### Decision Tree
- If user wants options/tradeoffs: use Iteration Mode.
- If user wants one final production implementation: use Finalization Mode.
- If user wants to validate one high-fidelity idea without production rigor: use Prototyping Mode.
- If user only wants conceptual structure: use Consulting Mode.

## Design Constraints
- Use design tokens for colors, spacing, and typography.
- Generate 3-5 clearly distinct variations.
- Explain tradeoffs for each option.
- Target mid-fidelity (not pixel-perfect final).

## Resources to Reference

For exhaustive lookup paths/globs/commands, load `.agent/assets/index-manifest.json` and the relevant index file(s).

1. Design tokens
- `references/tokens-guide.md`
- `packages/plus-ds/src/tokens/*.scss`

2. Component pattern options
- `packages/plus-ds/src/components/**`
- `packages/plus-ds/src/forms/**`
- `packages/plus-ds/src/specs/**`

3. Multi-approach examples
- Story variants in `*.stories.jsx`
- Playground prototypes in `playground/prototyping/**`

4. Composition examples
- `references/implementation-guide.md`

## How to Respond in Iteration Mode

1. Generate Multiple Options
- Provide 3-5 labeled alternatives.
- Each option should prioritize a different goal (speed, density, clarity, emphasis, etc.).

2. Explain Tradeoffs
- What each option optimizes.
- What each option compromises.
- When each option is best.

3. Use Design Tokens
- Apply semantic color/spacing/typography tokens.
- Avoid hardcoded visual values.

4. Scope for Mid-Fidelity
- Interactive states are optional unless explicitly requested.
- Focus on compositional direction over final detail.

5. Ask Clarifying Questions
- Which metric matters most: clarity, speed, or density?
- Is this for first-time or expert users?
- Do we prefer conservative or bold layout change?

## Iteration Mode Example

Option A: Dense information-first
- Compact table + side filters
- Optimizes scan speed for expert users
- Sacrifices whitespace and approachability

Option B: Guided card-first
- Summary cards + progressive detail drill-down
- Optimizes onboarding and readability
- Sacrifices rows-per-screen density

Option C: Split-pane hybrid
- Balanced top KPIs + lower detail grid
- Optimizes discoverability and context continuity
- Slightly higher implementation complexity
