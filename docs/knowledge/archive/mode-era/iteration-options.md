<!-- ~450 tokens | Load when: comparing 3–5 UI alternatives with tradeoffs -->

# Iteration — Multiple Options

Use with **uno-plan** when the user wants options/tradeoffs before picking a direction. Not for single-path prototyping (use uno-prototype).

## When to Use

- Compare multiple valid UI approaches to the same problem
- Evaluate alternative layout/component compositions
- Produce candidate directions before selecting one for production

## Constraints

- Load `design-system/docs/discovery.md` first, then only required component/token/pattern docs
- Use design tokens — never hardcode visual values
- Generate **3–5 clearly distinct** variations at **mid-fidelity** (compositional direction over pixel-perfect detail)
- Interactive states optional unless requested

## How to Respond

1. **Stop and ask for approval** before generating code
2. Summarize the 3–5 directions and the primary goal for each
3. Present labeled alternatives with tradeoffs (what each optimizes vs compromises)
4. Ask clarifying questions if missing: divergence level, user goal (speed vs clarity), target breakpoints

## Example Tradeoff Frame

**Option A — Dense information-first**
- Compact table + side filters; optimizes scan speed for expert users; sacrifices whitespace

**Option B — Guided card-first**
- Summary cards + progressive drill-down; optimizes readability; sacrifices rows-per-screen

**Option C — Split-pane hybrid**
- KPIs + detail grid; balances discoverability and context; slightly higher complexity

## Resources

- Component options: `design-system/agent-views/components/index.md`, `design-system/src/specs/**`
- Composition patterns: `design-system/docs/patterns/layout.md`
- Story variants: `design-system/src/**/*.stories.jsx`
- Playground references: `playground/**`
