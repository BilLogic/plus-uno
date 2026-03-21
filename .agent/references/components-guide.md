<!-- ~140 tokens | Load for: component selection and discovery workflow -->

# Components Guide

## When to Load
- Load this when you need component-selection workflow guidance.
- For exhaustive paths/globs/entrypoints, load `.agent/assets/components-index.json`.

## Discovery Workflow
1. Read component docs first:
- `design-system/guidelines/overview-components.md`
- `design-system/guidelines/reference/component-index.md`
2. Inspect implementation triplet for candidate component:
- `{Component}.jsx`, `{Component}.scss`, `{Component}.stories.jsx`
3. Confirm composition fit in `design-system/src/specs/**`.
4. Prefer existing export entrypoints over deep imports.

## Guardrails
- Prefer PLUS components/forms/specs before generic framework primitives.
- **CRITICAL ANTI-HALLUCINATION RULE:** Never guess or assume component props (e.g., `primaryAction` vs `primaryButton`). You MUST strictly check the target component's `.jsx` file or its `.stories.jsx` file to verify the exact prop names before implementing it.
- Verify props/states in stories before implementing.
- If two families are plausible, ask for clarification instead of guessing.
