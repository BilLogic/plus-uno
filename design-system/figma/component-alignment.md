# Component Alignment — Figma ↔ Coding Agent

How to keep **Figma component instances** and **PLUS code imports** (`@/components/*`) consistent when implementing designs in Cursor or writing prototypes back to Figma.

## Problem

Without a binding layer, agents guess:

- Figma frame → wrong or hallucinated React component
- Code JSX → redrawn rectangles in Figma instead of library instances
- Tokens → hardcoded hex/px instead of `var(--*)`

`component-registry.json` + `token-registry.json` replace guessing with lookup.

## Architecture

```
Figma component set (instance on canvas)
        ↕  component-registry.json
PLUS Button.jsx  ←  imported in playground via @/
        ↕  same tokens
Figma Variables  ←  sync:tokens → design-system/src/tokens/
        ↕  token-registry.json
```

**Code truth:** `design-system/src/`  
**Figma truth (tokens):** Variables in file `zAecJNRdvJzAUOcjV32tRX`  
**Mapping truth:** each component's MDX `export const figmaMeta`  
**Bridge artifact (generated, read-only):** `design-system/figma/component-registry.json`

## Registry entry shape

Each component (e.g. `Button`) may map to **multiple Figma component sets** when Figma splits variants by `fill`:

| Figma set | Code `fill` | Example node |
|-----------|-------------|--------------|
| Filled buttons | `filled` | `33:2470` |
| Tonal buttons | `tonal` | `979:20977` |
| Text buttons | `text` | _(pending node-id)_ |
| Outline buttons | `outline` | _(pending node-id)_ |

One code component (`Button`) + `fill` prop → pick the correct Figma set from registry.

### Required fields per set

- `componentSetNodeId` — parent component set (purple diamond), not a single variant
- `codeDefaults` — props always applied (e.g. `{ "fill": "tonal" }`)
- `variantProps` — Figma variant property name → code prop name
- `variantValueMap` — Figma enum label → code enum value

## Figma → Cursor (implement design)

Before generating JSX:

1. Parse URL → `fileKey`, `nodeId` (`979-20977` → `979:20977`)
2. Load `component-registry.json` — resolve import path and props
3. `search_design_system` for the node (secondary confirmation)
4. If node is a **library instance**, use mapped `@/components/...` and props from registry
5. If node is a **raw frame**, flag as design debt; do not invent a new component
6. Tokens: `get_variable_defs` + `token-registry.json` / `design-system/docs/foundations/token-mapping.md` → only `var(--*)`
7. Run `uno-review` on output

## Cursor → Figma (write-back)

Only after user opts in and supplies a Figma URL.

1. Extract component usage from prototype (imports from `@/components`, `@/forms`, `@/specs`)
2. For each usage, lookup registry:
   - **Hit** → place **component instance** with variant props; apply `codeDefaults` (e.g. `fill`)
   - **Miss** → stop and report; do not draw a substitute shape
3. Layout/spacing → bind Figma variables, never raw hex/px
4. Record returned `node-id`s in `playground/<name>/<name>-manifest.json`
5. Run `npm run validate:figma-writeback` then `npm run audit:figma-writeback` (gate clears on pass)

**IDE gate:** saying "write back to Figma" activates `.cursor/hooks/briefings/active-writeback-gate.json`. **`generate_figma_design` / screenshot capture is forbidden as the final frame** — reference-only at most.

Requires: `figma-use` skill before canvas writes; summon `writers/figma` for placement.

## Adding a new mapped component

1. **Code** — confirm export in `design-system/src/` and props in `.jsx` + `.stories.jsx`
2. **Figma** — select component **set** → Copy link to selection → paste `node-id`
3. **MDX** — add/extend `export const figmaMeta` in the component's `.mdx` (variant props, `codeDefaults`, `variantValueMap` as needed)
4. **Generate** — run `npm run generate:component-registry` to rebuild `component-registry.json`
5. **Verify** — round-trip: one implement + one write-back on a pilot frame

> Never hand-edit `component-registry.json` — it is regenerated from MDX `figmaMeta`.

## Button pilot checklist

- [x] Registry entry for Tonal buttons (`979:20977`)
- [x] Registry entry for Filled buttons (`33:2470`)
- [ ] Copy link for Text / Outline sets
- [ ] Round-trip test on one playground page

## Drift prevention

| Check | Command / tool |
|-------|----------------|
| Figma library changed | `npm run figma:poll` |
| Token drift | `npm run sync:tokens` + compare |
| Code compliance | `bash skills/uno-review/scripts/run-review-checks.sh <prototype>/src` |
| Registry stale node | Re-copy link after Figma restructure |

## Related docs

- `design-system/figma/token-registry.json`
- `design-system/docs/foundations/token-mapping.md`
- `skills/uno-prototype/references/figma-mcp-guide.md`
- `skills/uno-prototype/references/figma-registry-mandatory-load.md`
