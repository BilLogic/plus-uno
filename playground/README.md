# Playground

Workspace for prototype exploration and reusable templates.

## Structure

- `playground/templates/` — reusable starter templates by product area
- `playground/prototyping/` — designer/feature-specific experiments

## Runtime

Use Vite-based prototype apps and run them from their own folder:

```bash
cd playground/prototyping/{name}/{project}
npm install
npm run dev
```

## Guidance

- Agent workflow: `.agent/SKILL.md`
- Foundations: `docs/design-system/overview.md` (details in `.agent/assets/foundations-index.json`)
- Tokens: `design-system/guidelines/design-tokens/`
- Components: `design-system/guidelines/overview-components.md`

## Best Practices

1. Keep prototypes tokenized and component-driven.
2. Prefer PLUS components/specs over ad hoc UI primitives.
3. Document prototype intent in local `README.md` files.
4. Promote only reusable patterns to `playground/templates/`.
