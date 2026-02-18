<!-- ~140 tokens | Load for: component selection and discovery workflow -->

# Components Guide

## When to Load
- Load this when you need component-selection workflow guidance.
- For exhaustive paths/globs/entrypoints, load `.agent/assets/components-index.json`.

## Discovery Workflow
1. Read component docs first:
- `packages/plus-ds/guidelines/overview-components.md`
- `packages/plus-ds/guidelines/reference/component-index.md`
2. Inspect implementation triplet for candidate component:
- `{Component}.jsx`, `{Component}.scss`, `{Component}.stories.jsx`
3. Confirm composition fit in `packages/plus-ds/src/specs/**`.
4. Prefer existing export entrypoints over deep imports.

## Guardrails
- Prefer PLUS components/forms/specs before generic framework primitives.
- Verify props/states in stories before implementing.
- If two families are plausible, ask for clarification instead of guessing.
