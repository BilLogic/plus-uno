# Figma ↔ Coding Agent Component Alignment

Machine-readable contracts and human runbooks so Cursor prototypes, Storybook, and the Figma design system stay aligned on **tokens** and **components**.

> **Branch policy:** Work on `cynthia-main` (or a feature branch off it). **Do not push this pilot to `main`** until round-trip is validated on a pilot page.

## Canonical Figma file

| Field | Value |
|-------|--------|
| Name | Design System - BS4 Foundation Component Library |
| `fileKey` | `zAecJNRdvJzAUOcjV32tRX` |
| URL | https://www.figma.com/design/zAecJNRdvJzAUOcjV32tRX/Design-System---BS4-Foundation--Component-LIbrary- |

## Files in this folder

| File | Purpose |
|------|---------|
| `component-registry.json` | **Generated artifact** — code import ↔ Figma component set ↔ props. DO NOT EDIT BY HAND |
| `component-alignment.md` | Workflow for agents and contributors (implement + write-back) |
| `token-registry.json` | **Generated artifact** — Figma variable name ↔ CSS custom property, validated against SCSS. DO NOT EDIT BY HAND |

## Source of truth: per-component MDX

The Figma mapping for each component lives in that component's MDX file as a non-rendered ESM export:

```jsx
export const figmaMeta = {
  fileKey: "zAecJNRdvJzAUOcjV32tRX",
  props: { /* optional code-side enum/boolean props */ },
  sets: [
    {
      id: "tonal-buttons",
      name: "Tonal buttons",
      componentSetNodeId: "979:20977",
      codeDefaults: { fill: "tonal" },
      variantProps: { size: "size", style: "style", state: "state" },
      variantValueMap: { /* Figma enum label → code value */ },
      status: "verified"
    }
  ]
};
```

- To change a mapping (node ID, variants, props), **edit the component's MDX `figmaMeta`**, not the registry.
- `component-registry.json` is regenerated from all `figmaMeta` exports.
- `export const figmaMeta` is placed after imports and before `<Meta>`; Storybook does not render it.

### Token source of truth: `figma-token-mapping.md`

`token-registry.json` is generated from `.agent/skills/uno-prototype/references/figma-token-mapping.md`. Every `var(--*)` is validated against `design-system/src/tokens/*.scss`, so a mapping to a non-existent token fails the check.

- To change a token mapping, **edit `figma-token-mapping.md`**, not the registry.
- Spacing is **contextual** (per layer: element / card / section / modal / surface / table) — there is no single `Spacing/N` → one token.

## Regenerating the registries

```bash
# Rebuild component-registry.json from MDX figmaMeta exports
npm run generate:component-registry
npm run check:component-registry   # CI guard: fail if stale vs MDX

# Rebuild token-registry.json from figma-token-mapping.md (+ validate vs SCSS)
npm run generate:token-registry
npm run check:token-registry       # CI guard: fail if stale OR tokens missing from SCSS
```

## Code-side source of truth

- Components: `design-system/src/components/`, `forms/`, `specs/`
- Tokens: `design-system/src/tokens/` (synced from Figma via `npm run sync:tokens`)
- Agent cheat sheet: `docs/context/design-system/components/cheat-sheet.md`

## Pilot status (Button)

- [x] Tonal buttons component set → `979:20977` → `Button` with `fill="tonal"`
- [x] Filled buttons → `33:2470` → `Button` with `fill="filled"`
- [ ] Text buttons — needs component-set `node-id`
- [ ] Outline buttons — needs component-set `node-id`
- [ ] Round-trip validated on playground page

## Quick commands

```bash
# Regenerate component registry from per-component MDX figmaMeta (44 components)
npm run generate:component-registry
npm run check:component-registry

# Regenerate token registry from figma-token-mapping.md (validated vs SCSS)
npm run generate:token-registry
npm run check:token-registry

# Sync tokens from Figma (requires .env)
npm run sync:tokens && npm run generate:tokens

# Review a prototype for DS compliance
bash .agent/skills/uno-review/scripts/run-review-checks.sh playground/<name>/src
```

## Agent loading order

**MANDATORY** before Figma implement-design or design-to-code mapping:

1. `design-system/figma/component-registry.json`
2. `design-system/figma/token-registry.json`
3. `.agent/skills/uno-prototype/references/figma-registry-mandatory-load.md`

Then:

4. `design-system/figma/component-alignment.md`
5. `.agent/skills/uno-prototype/references/figma-mcp-guide.md`
6. `.agent/skills/uno-prototype/references/figma-token-mapping.md`
