---
summary: Machine-readable contracts and human runbooks so Cursor prototypes, Storybook, and the Figma design system stay aligned on tokens and components
---

<!-- Tier: 2 -->

# Figma

Machine-readable contracts and human runbooks so Cursor prototypes, Storybook, and the Figma design system stay aligned on **tokens** and **components**.

## Canonical Figma file

| Field | Value |
|-------|--------|
| Name | Design System - BS4 Foundation Component Library |
| `fileKey` | `zAecJNRdvJzAUOcjV32tRX` |
| URL | https://www.figma.com/design/zAecJNRdvJzAUOcjV32tRX/Design-System---BS4-Foundation--Component-LIbrary- |

## What lives where

Protocol is authored here in `design-system/guidelines/figma/`; the registries it
governs are generated and stay beside the source they describe in
`design-system/figma/`.

| File | Where | State |
|------|-------|-------|
| `registry-load-gate.md` | this folder | **MANDATORY** — load both registries before any implement, write-back, or design-to-code mapping |
| `component-alignment.md` | this folder | Workflow for agents and contributors (implement + write-back) |
| `mcp-guide.md` | this folder | Figma MCP tool reference + implement-design workflows |
| `token-mapping.md` | this folder | Figma ↔ CSS token mapping (authoritative) |
| `parity-2026-07.md` | this folder | Dated Figma ↔ Storybook parity snapshot |
| `component-registry.json` | `design-system/figma/` | **Generated** — import ↔ Figma component set ↔ props |
| `token-registry.json` | `design-system/figma/` | **Generated** — Figma variable ↔ CSS custom property, validated against SCSS |
| `component-figma-links.md` | `design-system/figma/` | **Generated** — Figma node links per component |
| `knowledge-audit.md` | `design-system/figma/` | **Generated** — verification status (edit `knowledge-audit.json` beside it) |
| `patterns.json` | `design-system/figma/` | Hand-authored source for the `patterns` section of `component-registry.json` |

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

### Token source of truth: `token-mapping.md`

`token-registry.json` is generated from `design-system/guidelines/figma/token-mapping.md`. Every `var(--*)` is validated against `design-system/src/tokens/*.scss`, so a mapping to a non-existent token fails the check.

- To change a token mapping, **edit `design-system/guidelines/figma/token-mapping.md`**, not the registry.
- Spacing is **contextual** (per layer: element / card / section / modal / surface / table) — there is no single `Spacing/N` → one token.

## Regenerating agent + Figma artifacts

```bash
# One command after editing MDX figmaMeta, token-mapping, or tokens SCSS
npm run generate:agent

# Or individually:
npm run generate:component-registry
npm run check:component-registry

npm run generate:token-registry
npm run check:token-registry
```

## Code-side source of truth

- Components: `design-system/src/components/` (forms live in `components/forms-and-inputs/`), `specs/`
- Tokens: `design-system/src/tokens/` (synced from Figma via `npm run sync:tokens`)
- Agent knowledge entry: `design-system/guidelines/overview.md`
- Agent views (generated): `design-system/agent-views/`

## Pilot status (Button)

- [x] Tonal buttons component set → `979:20977` → `Button` with `fill="tonal"`
- [x] Filled buttons → `33:2470` → `Button` with `fill="filled"`
- [ ] Text buttons — needs component-set `node-id`
- [ ] Outline buttons — needs component-set `node-id`
- [ ] Round-trip validated on prototypes page

## Quick commands

```bash
# Regenerate component registry from per-component MDX figmaMeta (59 components)
npm run generate:component-registry
npm run check:component-registry

# Regenerate token registry from token-mapping.md (validated vs SCSS)
npm run generate:token-registry
npm run check:token-registry

# Sync tokens from Figma (requires .env)
npm run sync:tokens && npm run generate:tokens

# Review a prototype for DS compliance
bash skills/uno-review/scripts/run-review-checks.sh prototypes/<name>/src
```

## Agent loading order

**MANDATORY** before Figma implement-design or design-to-code mapping:

1. `design-system/figma/component-registry.json`
2. `design-system/figma/token-registry.json`
3. `design-system/guidelines/figma/registry-load-gate.md`

Then:

4. `design-system/guidelines/figma/component-alignment.md`
5. `design-system/guidelines/figma/mcp-guide.md`
6. `design-system/guidelines/figma/token-mapping.md`
