---
name: uno-prototype
description: >
  Scaffold a new playground prototype with proper PLUS design system integration.
  Use when the user asks to "create a prototype", "scaffold a new project",
  "set up a playground", "start a new experiment", "build a proof-of-concept",
  or needs a standalone prototype for user testing.
user-invocable: true
argument-hint: [project-name]
---

# Scaffold Prototype

Create a new playground prototype project with proper DS integration.

## When to Use

- Designer wants to explore a new feature idea
- Need a standalone prototype for user testing
- Building a proof-of-concept for a product pillar

## Auto-Suggest

Proactively suggest this skill when:
- The user describes a new feature idea that doesn't have an existing prototype
- The user wants to explore or validate a concept visually
- A new `playground/` project needs to be set up from scratch

Do not suggest if the user is working on an existing prototype (use the appropriate mode instead).

## Prerequisites

- `docs/context/product/features.md` — understand which product pillar this relates to
- `docs/context/design-system/foundations/layout.md` — understand the atomic hierarchy
- `docs/context/design-system/components/cheat-sheet.md` — available components

## Tier 2 Context — Mandatory Load (~5K budget)

Load **before Phase 3 Build** (and before any Figma implement-design work):

| Order | File | Required |
|-------|------|----------|
| 1 | `design-system/figma/component-registry.json` | **MANDATORY** |
| 2 | `design-system/figma/token-registry.json` | **MANDATORY** |
| 3 | `references/figma-registry-mandatory-load.md` | **MANDATORY** (load gate) |
| 4 | `docs/context/design-system/components/cheat-sheet.md` | **MANDATORY** |
| 5 | `references/figma-mcp-guide.md` | When Figma link or MCP tools used |
| 6 | `docs/context/design-system/components/layout-cheat-sheet.md` | When building a page |
| 7 | `.agent/handoffs/plans/{feature-slug}.md` | When handoff exists |

**Gate:** Do not write JSX mapping Figma nodes to components until `component-registry.json` is loaded. Do not apply visual tokens until `token-registry.json` is loaded.

## Phase 1: Scope

1. Ask: What feature or area is this prototype for?
2. Ask: What product pillar? (admin, home, toolkit, training, profile, login, universal)
3. Ask: What fidelity? (low/mid/high)
4. Check: Does a relevant spec already exist in `design-system/src/specs/`? If so, use it as a starting point.
5. **Gate**: Confirm project name and scope before scaffolding.

## Phase 2: Scaffold

1. Create `playground/{project-name}/` directory
2. Copy the minimal starter structure:
   ```
   playground/{project-name}/
   ├── index.html
   ├── src/
   │   ├── App.jsx
   │   └── main.jsx
   ├── vite.config.js    (with @ alias → ../../design-system/src)
   └── package.json
   ```
3. Add dev script to root `package.json`: `"dev:{project-name}": "vite --config playground/{project-name}/vite.config.js"`
4. Ensure vite.config.js has proper SCSS loadPaths for tokens

## Phase 3: Build

1. Read `design-system/figma/component-registry.json` (MANDATORY)
2. Read `design-system/figma/token-registry.json` (MANDATORY)
3. Read `references/figma-registry-mandatory-load.md` — confirm load gate
4. Read `docs/context/design-system/components/cheat-sheet.md` (MANDATORY)
5. Read `docs/context/design-system/components/layout-cheat-sheet.md` if building a page
6. If Figma input: read `references/figma-mcp-guide.md` and follow implement-design workflow
7. Use design system components — check `@/components/`, `@/forms/`, `@/specs/`
8. Apply tokens for all visual values (resolve via `token-registry.json` first)
9. Use `<PageLayout>` from specs/Universal for page structure

## Phase 4: Validate

- [ ] Imports resolve (`@` alias works)
- [ ] Token-driven styling (no hardcoded colors/spacing)
- [ ] Uses DS components (not raw Bootstrap)
- [ ] Dev server runs (`npm run dev:{project-name}`)

## Phase 5: Register

1. Add entry to `src/pages/PrototypeMarket/prototypes-data.js`
2. Or use `/uno:post` skill for guided submission

## Next Step

After completing the prototype:
→ Suggest `/uno:review` to check DS compliance before shipping. Pass the prototype's directory path as the argument.

These are suggestions — the user may choose to skip steps.
