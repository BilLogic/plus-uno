# Workflow: Contributor (Maintainer)

This workflow document is maintained for compatibility.

## Canonical Source

Design-system maintenance behavior is now defined in:

- `.agent/SKILL.md`
- `docs/design-system/modes/maintaining.md`
- `docs/design-system/tokens.md`
- `.agent/scripts/maintenance.md`

## Current Verification Commands

```bash
npm run storybook
npm run sync:tokens
npm run generate:tokens
npm run build
```

## Notes

Use `.agent` references as the operational source of truth for agent behavior.
