---
name: po-prototype
description: >
  Scaffold and build a new playground prototype using the PLUS design system.
  Use when creating new feature prototypes, experiments, or proof-of-concepts.
user-invocable: true
argument-hint: [project-name]
---

# Scaffold Prototype

Create a new playground prototype project with proper DS integration.

## When to Use

- Designer wants to explore a new feature idea
- Need a standalone prototype for user testing
- Building a proof-of-concept for a product pillar

## Prerequisites

- `docs/project/plus-app-features.md` — understand which product pillar this relates to
- `docs/foundations/context-levels.md` — understand the atomic hierarchy
- `.agent/assets/PLUS_CHEAT_SHEET.md` — available components

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

1. Read `.agent/assets/PLUS_CHEAT_SHEET.md` (MANDATORY)
2. Read `.agent/assets/PLUS_LAYOUT_CHEAT_SHEET.md` if building a page
3. Use design system components — check `@/components/`, `@/forms/`, `@/specs/`
4. Apply tokens for all visual values
5. Use `<PageLayout>` from specs/Universal for page structure

## Phase 4: Validate

- [ ] Imports resolve (`@` alias works)
- [ ] Token-driven styling (no hardcoded colors/spacing)
- [ ] Uses DS components (not raw Bootstrap)
- [ ] Dev server runs (`npm run dev:{project-name}`)

## Phase 5: Register

1. Add entry to `src/pages/PrototypeMarket/prototypes-data.js`
2. Or use `/submit-to-market` skill for guided submission
