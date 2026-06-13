# Figma ↔ Coding Agent Component Alignment

Machine-readable contracts and human runbooks so Cursor prototypes, Storybook, and the Figma design system stay aligned on **tokens** and **components**.

> **Branch policy:** Work on `cynthia-main` (or a feature branch off it). **Do not push this pilot to `main`** until Code Connect is published and round-trip is validated.

## Canonical Figma file

| Field | Value |
|-------|--------|
| Name | Design System - BS4 Foundation Component Library |
| `fileKey` | `zAecJNRdvJzAUOcjV32tRX` |
| URL | https://www.figma.com/design/zAecJNRdvJzAUOcjV32tRX/Design-System---BS4-Foundation--Component-LIbrary- |

## Files in this folder

| File | Purpose |
|------|---------|
| `component-registry.json` | **Source of truth** for code import ↔ Figma component set ↔ props |
| `component-alignment.md` | Workflow for agents and contributors (implement + write-back) |
| `token-registry.json` | Figma variable name ↔ CSS custom property (extends token sync) |

## Code-side source of truth

- Components: `design-system/src/components/`, `forms/`, `specs/`
- Tokens: `design-system/src/tokens/` (synced from Figma via `npm run sync:tokens`)
- Agent cheat sheet: `docs/context/design-system/components/cheat-sheet.md`

## Pilot status (Button)

- [x] Tonal buttons component set → `979:20977` → `Button` with `fill="tonal"`
- [ ] Filled buttons — needs component-set `node-id`
- [ ] Text buttons — needs component-set `node-id`
- [ ] Outline buttons — needs component-set `node-id`
- [ ] `@figma/code-connect` installed + `npx figma connect publish`

## Quick commands

```bash
# Regenerate registry from Storybook MDX figmaLink (44 components)
npm run generate:component-registry

# Sync tokens from Figma (requires .env)
npm run sync:tokens && npm run generate:tokens

# Publish Code Connect mappings (requires FIGMA_ACCESS_TOKEN in .env)
npx figma connect publish

# Review a prototype for DS compliance
bash .agent/skills/uno-review/scripts/run-review-checks.sh playground/<name>/src
```

## Agent loading order

1. `design-system/figma/component-registry.json`
2. `design-system/figma/component-alignment.md`
3. `.agent/skills/uno-prototype/references/figma-mcp-guide.md`
4. `.agent/skills/uno-prototype/references/figma-token-mapping.md`
