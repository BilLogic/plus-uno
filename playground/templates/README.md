# Templates

Reusable prototype starters organized by product area.

## Template Goals

1. Provide realistic starting structure.
2. Reflect current PLUS design-system patterns.
3. Use token-based styling and DS components.

## Canonical References

- Agent router: `.agent/SKILL.md`
- Mode references: `.agent/references/*.md`
- Token reference: `.agent/references/tokens.md`
- DS component docs: `design-system/src/guidelines/overview-components.md`
- DS token docs: `design-system/src/guidelines/design-tokens/`

## Authoring Rules

1. Avoid hardcoded visual values where tokens exist.
2. Keep imports aligned with current alias/package patterns.
3. Include clear setup steps in template-specific `README.md` when needed.
4. Keep examples compatible with Vite and current Storybook conventions.

## Template Promotion Checklist

- [ ] Structure is reusable beyond one-off experimentation
- [ ] Token and component usage follows DS guidance
- [ ] References point to existing files only
- [ ] Included files run locally with documented steps

## Important Note

These are **static HTML reference templates** that predate the React + DS prototyping workflow. They use Bootstrap CDN and raw HTML — they are NOT DS-compliant prototypes.

For creating new React prototypes using the PLUS Design System, use the `/uno:prototype` skill which scaffolds from `playground/starter/`.
