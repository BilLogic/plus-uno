# Playground

Workspace for prototype exploration and reusable templates.

## Structure

- `design-system/src/specs/` — reusable starter templates by product area
- `playground/` — designer/feature-specific experiments

## Runtime

Use Vite-based prototype apps and run them from their own folder:

```bash
cd playground/{project}
npm install
npm run dev
```

## Guidance

- Agent workflow: `.agent/SKILL.md`
- Foundations: `docs/design-system/overview.md` (details in `.agent/assets/foundations-index.json`)
- Tokens: `docs/design-system/tokens.md`
- Components: `docs/design-system/components.md`

## Best Practices

1. Keep prototypes tokenized and component-driven.
2. Prefer PLUS components/specs over ad hoc UI primitives.
3. Document prototype intent in local `README.md` files.
4. Promote only reusable patterns to `design-system/src/specs/`.
