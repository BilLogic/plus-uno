<!-- MANDATORY — load before Figma implement, write-back, or design-to-code mapping -->

# Figma Registry — Mandatory Load

Agents **MUST** read both files below before:

- Implementing from a Figma link
- Mapping Figma nodes to PLUS imports
- Translating Figma variables to CSS tokens
- Writing code back to Figma (component instances)
- Planning or building UI that references Figma component sets

**Do not guess** component imports or token names. If a node is not in the registry, flag it as a gap — do not invent a substitute.

**Write-back gate:** when the user asks to write back to Figma, `.cursor/hooks/briefings/active-writeback-gate.json` is the live checklist — follow `design-system/figma/component-alignment.md` § Cursor → Figma.

## Mandatory files (load in this order)

| Order | File | Purpose |
|-------|------|---------|
| 1 | `design-system/figma/component-registry.json` | Code import ↔ Figma component set ↔ props (**generated artifact, read-only**) |
| 2 | `design-system/figma/token-registry.json` | Figma variable name ↔ `var(--*)` (**generated artifact, read-only**) |

> Both registries are **generated, read-only artifacts** — never hand-edit them.
>
> - **`component-registry.json`** is generated from each component's MDX `export const figmaMeta`. To change a mapping, edit the component's MDX `figmaMeta` and run `npm run generate:component-registry`.
> - **`token-registry.json`** is generated from `design-system/docs/foundations/token-mapping.md` and every `var(--*)` is validated against `design-system/src/tokens/*.scss`. To change a mapping, edit `token-mapping.md` and run `npm run generate:agent` (or `generate:token-registry`). If a token doesn't exist in SCSS, the generator reports it (and `check:token-registry` fails) — this is the guard against drift.

## Load gate (before writing JSX or SCSS)

1. Read `component-registry.json` — resolve `@/components/*` import and variant props for each Figma instance.
2. Read `token-registry.json` — map every color, spacing, and typography value to `var(--*)`.
3. Registry is the **primary** mapping source. Use `search_design_system` MCP only as secondary confirmation.
4. If a node is not in the registry, flag as a gap — do not fall back to guessing from `components-index.json` alone.

## Supporting docs (load after registries)

- `design-system/figma/component-alignment.md` — implement + write-back rules
- `skills/uno-prototype/references/figma-mcp-guide.md` — MCP workflow
- `design-system/docs/foundations/token-mapping.md` — extended token tables (authoritative source)

## Skills that enforce this load

| Skill | When |
|-------|------|
| uno-prototype | Always (hi-fi build); required before Figma implement-design |
| uno-research | When auditing Figma ↔ code alignment or component discovery |
| uno-review | When reviewing Figma-derived prototypes or registry drift |

Entry: `AGENTS.md` § Progressive loading + forbidden pattern #17 route here.
