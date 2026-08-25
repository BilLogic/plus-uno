<!-- Tier: 2 | ~450 tokens | Load FIRST for any DS task — routes to focused docs -->

# Design System Guidelines

**Purpose:** route to the right file. This document does not teach design; it
says where design knowledge lives.

Design-system knowledge has exactly two homes:

- **`design-system/guidelines/`** — authored protocol. Rules, procedures, correct and incorrect examples. This folder.
- **`design-system/agent-views/`** — generated facts. What exists and what it is named. Never authored by hand.

Anything else is narrative (`*.mdx` beside the component, for humans) or a
machine registry (`*.json`).

## Retrieval flow

```
Task → guidelines/overview.md → locate 2–3 focused docs → read only those → implement
```

Do not bulk-load. Two or three documents per task is the budget.

## The tree

| Folder | Holds | Start at |
|--------|-------|----------|
| [`foundations/`](foundations/overview.md) | The fourteen foundations — tokens, colour, type, spacing, grid, elevation, iconography, accessibility, content, and the five not yet authored | `foundations/overview.md` |
| [`components/`](components/overview.md) | Per-component guidance: when to use, correct and incorrect, accessibility | `components/overview.md` |
| [`composition/`](composition/overview.md) | How components combine — layout, hierarchy, surfaces, forms | `composition/overview.md` |
| [`figma/`](figma/overview.md) | Design-to-code: registries, the load gate, token mapping, MCP workflows | `figma/overview.md` |
| [`principles.md`](principles.md) | The nine principles, the agent's role, and how this knowledge is organised | — |

## Common task routes

**Build UI with components**
→ `agent-views/components/index.md` (does it exist?) → `agent-views/tokens/tokens.md` (token names) → the component's Storybook MDX (props, usage)

**Build a page or dashboard**
→ `composition/layout.md` → `composition/hierarchy.md` → `foundations/grid.md`

**Build a form**
→ `composition/forms.md` → `agent-views/components/index.md` → `foundations/spacing.md`

**Dialog, modal, card, table, empty or loading state**
→ `composition/surfaces.md`

**Style something**
→ `agent-views/tokens/tokens.md` for the name → `foundations/<topic>.md` for the rule

**Implement from Figma**
→ `figma/registry-load-gate.md` (MANDATORY) → `figma/mcp-guide.md` → `figma/token-mapping.md`

**Write product copy**
→ `foundations/content/overview.md`

## Machine artifacts

| Artifact | State |
|----------|-------|
| `design-system/agent-views/components/index.md` | Generated — the existence law. Not listed means it does not exist. |
| `design-system/agent-views/tokens/tokens.md` | Generated — token names. |
| `design-system/figma/component-registry.json` | Generated — import ↔ Figma component set ↔ props. |
| `design-system/figma/token-registry.json` | Generated — Figma variable ↔ CSS custom property. |

Refresh them all with `npm run generate:agent`. Never hand-edit a generated file.

## Not design-system knowledge

| Topic | Lives at |
|-------|----------|
| Local build, aliases, Vite, prototypes | `docs/engineering/setup.md` |
| Product overview and features | `docs/context/product/` |
| How agents write (commits, PRDs, Slack, articles) | `docs/conventions/` |
| Scaffolding and review workflow | `skills/uno-prototype/`, `skills/uno-review/` |
| Production readiness checklist | `skills/uno-maintain/references/production-checklist.md` |
