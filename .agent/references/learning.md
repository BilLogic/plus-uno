<!-- ~550 tokens | Load for: discovery questions, orientation, no new implementation -->

# Learning Mode Reference

## When to Use This Mode
- The user asks discovery questions: "what components exist", "how does X work", "where is Y defined".
- The user needs orientation to tokens, imports, story files, or structure.
- The user is not asking for new implementation.

### Decision Tree
- If the user asks to understand existing patterns only: use Learning Mode.
- If the user asks to modify design-system source: use Maintaining Mode.
- If the user asks for new solution options: use Iteration Mode.
- If the user asks for production implementation: use Finalization Mode.

## User Persona
- New designers or developers onboarding to PLUS DS
- Product developers trying to understand available components before implementation
- Contributors mapping repository structure and conventions

## Resources to Reference

For exhaustive lookup paths/globs/commands, load `.agent/assets/index-manifest.json` and the relevant index file(s).

1. Component documentation
- `packages/plus-ds/guidelines/overview-components.md`
- `packages/plus-ds/guidelines/reference/component-index.md`

2. Design token documentation
- `packages/plus-ds/guidelines/design-tokens/*.md`
- `packages/plus-ds/src/tokens/*.scss`
- `references/tokens-guide.md`

3. Example implementations
- `packages/plus-ds/src/**/*.stories.jsx`
- `playground/templates/**`
- `playground/prototyping/**`
- `playground/Ashley/**`
- `playground/Bill/**`

4. Storybook and tooling
- `.storybook/main.js`
- `.storybook/preview.jsx`
- `packages/plus-ds/guidelines/guides/Storybook.md`

## How to Respond in Learning Mode

1. Explain, Don't Build
- Teach from existing source files and stories.
- Cite file paths for every recommendation.
- Avoid generating new implementation code.

2. Answer Pattern Questions
- For "which component": compare closest components and explain tradeoffs.
- For "which token": map context (element/card/section/modal/table) to semantic tokens.
- For "where is this defined": point to exact source, story, and guideline files.

3. Provide Navigation
- Always include next files to open.
- Route to `references/components-guide.md` and `references/implementation-guide.md` for quick lookup.

4. Stay Read-Only
- Learning mode is analysis and explanation only.
- Use existing code examples; do not create net-new code.

## Sample Q&A

Q: "What button styles are available?"
A: "Start with `packages/plus-ds/src/components/Button/Button.stories.jsx` and `packages/plus-ds/src/components/Button/Button.jsx`. The DS uses `style` and `fill` props rather than Bootstrap `variant` in this codebase."

Q: "Where do I find spacing tokens?"
A: "Read `packages/plus-ds/src/tokens/_spacing_semantics.scss` for runtime variables and `packages/plus-ds/src/tokens/source/size _ semantics.json` for source values. Use semantic tokens (for example `--size-element-*`, `--size-card-*`) instead of primitives."

Q: "How do imports work here?"
A: "Public consumers use `@tutors.plus/design-system`; internal DS source commonly uses alias `@` mapped to `packages/plus-ds/src` (see `.storybook/main.js` and `packages/plus-ds/vite.config.js`)."

Q: "Where can I see realistic usage?"
A: "Check stories under `packages/plus-ds/src/**/*.stories.jsx`, then compare full-page assemblies in `packages/plus-ds/src/specs/**`, `playground/prototyping/**`, `playground/Ashley/**`, and `playground/Bill/**`."

Q: "How do I start from a Figma link?"
A: "Use the flow in `packages/plus-ds/guidelines/guides/figma-workflow.md`: fetch design context + screenshot first, then map to DS components."
