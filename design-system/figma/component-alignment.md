# Component Alignment — Figma ↔ Coding Agent

How to keep **Figma component instances** and **PLUS code imports** (`@/components/*`) consistent when implementing designs in Cursor or writing prototypes back to Figma.

## Problem

Without a binding layer, agents guess:

- Figma frame → wrong or hallucinated React component
- Code JSX → redrawn rectangles in Figma instead of library instances
- Tokens → hardcoded hex/px instead of `var(--*)`

This folder plus **Code Connect** replaces guessing with lookup.

## Architecture

```
Figma component set (instance on canvas)
        ↕  Code Connect (.figma.js) + component-registry.json
PLUS Button.jsx  ←  imported in playground via @/
        ↕  same tokens
Figma Variables  ←  sync:tokens → design-system/src/tokens/
```

**Code truth:** `design-system/src/`  
**Figma truth (tokens):** Variables in file `zAecJNRdvJzAUOcjV32tRX`  
**Bridge truth:** `design-system/figma/component-registry.json`

## Registry entry shape

Each component (e.g. `Button`) may map to **multiple Figma component sets** when Figma splits variants by `fill`:

| Figma set | Code `fill` | Example node |
|-----------|-------------|--------------|
| Filled buttons | `filled` | _(pending node-id)_ |
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
2. `get_code_connect_map` / `search_design_system` for the node
3. Load `component-registry.json` — resolve import path and props
4. If node is a **library instance**, use mapped `@/components/...` and props from registry
5. If node is a **raw frame**, flag as design debt; do not invent a new component
6. Tokens: `get_variable_defs` + `token-registry.json` / `figma-token-mapping.md` → only `var(--*)`
7. Run `uno-review` on output

## Cursor → Figma (write-back)

Only after user opts in and supplies a Figma URL.

1. Extract component usage from prototype (imports from `@/components`, `@/forms`, `@/specs`)
2. For each usage, lookup registry:
   - **Hit** → place **component instance** with variant props; apply `codeDefaults` (e.g. `fill`)
   - **Miss** → stop and report; do not draw a substitute shape
3. Layout/spacing → bind Figma variables, never raw hex/px
4. Record returned `node-id`s for the next import pass

Requires: `figma-use` skill before canvas writes; prefer `figma-generate-design` for full pages.

## Adding a new mapped component

1. **Code** — confirm export in `design-system/src/` and props in `.jsx` + `.stories.jsx`
2. **Figma** — select component **set** → Copy link to selection → paste `node-id`
3. **Registry** — add entry under `components` in `component-registry.json`
4. **Code Connect** — add `ComponentName.figma.js` beside the component; run `npx figma connect publish`
5. **Verify** — Dev Mode shows code snippet; MCP `get_code_connect_map` returns mapping
6. **Round-trip** — one implement + one write-back on a pilot frame

## Button pilot checklist

- [x] Registry entry for Tonal buttons (`979:20977`)
- [x] `Button.figma.js` for Tonal set
- [ ] Copy link for Filled / Text / Outline sets
- [ ] Install `@figma/code-connect`, publish
- [ ] Dev Mode verification
- [ ] Round-trip test on one playground page

## Drift prevention

| Check | Command / tool |
|-------|----------------|
| Figma library changed | `npm run figma:poll` |
| Token drift | `npm run sync:tokens` + compare |
| Code compliance | `bash .agent/skills/uno-review/scripts/run-review-checks.sh <prototype>/src` |
| Registry stale node | Re-copy link after Figma restructure |

## Related docs

- `design-system/figma/token-registry.json`
- `.agent/skills/uno-prototype/references/figma-token-mapping.md`
- `.agent/skills/uno-prototype/references/figma-mcp-guide.md`
- `docs/plans/2026-03-21-005-feat-npm-package-publishing-figma-make-strategy-plan.md` (Code Connect strategy)
