---
title: "refactor: Optimal repo structure — flatten packages, consolidate docs, complete restructure"
type: refactor
status: completed
date: 2026-03-21
supersedes:
  - docs/plans/2026-03-21-001-feat-agents-md-compound-loop-agent-skills-plan.md
  - docs/plans/2026-03-21-002-feat-skill-taxonomy-and-reference-mapping-plan.md
  - docs/plans/2026-03-21-003-refactor-docs-directory-consolidation-plan.md
  - docs/plans/2026-03-21-004-feat-agent-infrastructure-consolidated-plan.md
  - docs/plans/2026-03-21-005-feat-npm-package-publishing-figma-make-strategy-plan.md
  - docs/plans/2026-03-21-006-refactor-strip-npm-publishing-simplify-package-plan.md
---

# Optimal Repo Structure for plus-uno

**This is the FINAL consolidated plan.** It supersedes all previous plans (001-006) and incorporates every decision, review finding, and user correction from this planning session.

> **POST-PULL UPDATE (2026-03-21)**: After `git pull`, the repo has evolved significantly. Many planned items already exist. This plan is revised to reflect current state. See "Already Done" section.

## Overview

Restructure the entire plus-uno repo for clarity: flatten `packages/plus-ds/` to `design-system/`, consolidate all docs under `docs/`, create AGENTS.md, add skills, and establish the compound loop. Update all 99 references. No half-measures.

## Target Structure

```
plus-vibe-coding-starting-kit/             (repo: github.com/BilLogic/plus-vibe-coding-starting-kit)
│
├── AGENTS.md                              THE cross-agent entry point (~100-120 lines)
├── CLAUDE.md                              @AGENTS.md pointer
├── cursorrules.md                         AGENTS.md pointer (Cursor)
├── .windsurfrules                         AGENTS.md pointer (Windsurf)
│
├── design-system/                         DESIGN SYSTEM SOURCE (was packages/plus-ds/)
│   ├── src/
│   │   ├── components/                    46 component directories
│   │   ├── forms/                         61 form directories
│   │   ├── DataViz/                       11 data viz components
│   │   ├── specs/                         10 composite page specs
│   │   ├── tokens/                        9 token categories
│   │   ├── styles/                        11 style files
│   │   ├── assets/
│   │   ├── index.js                       barrel export
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json                       private: true, simplified
│   └── vite.config.js                     SCSS config, aliases
│
├── src/                                   VITE APP ENTRY (unchanged — 3 files)
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── docs/
│   ├── project/                           PROJECT CONTEXT
│   │   ├── plus-uno.md                    This repo: DS, prototyping, agent infra, team, stack
│   │   ├── plus-app.md                    The PLUS product: users, features, flows, domain terms
│   │   ├── conventions.md                 File naming, imports, git, gotchas
│   │   └── setup-guide.md                 Onboarding: CE skills, MCP setup, platform config
│   │
│   ├── design-system/                     ALL DS KNOWLEDGE (merged from guidelines + .agent/references)
│   │   ├── overview.md                    Foundations, setup, what the DS is
│   │   ├── components.md                  Inventory, discovery, import conventions
│   │   ├── tokens.md                      Token system, values, sync workflow
│   │   ├── modes/                         Agent workflow modes
│   │   │   ├── learning.md
│   │   │   ├── maintaining.md
│   │   │   ├── consulting.md
│   │   │   ├── iteration.md
│   │   │   └── finalization.md
│   │   ├── guides/                        How-to references
│   │   │   ├── figma-workflow.md
│   │   │   ├── storybook.md
│   │   │   ├── implementation.md
│   │   │   └── local-preview.md
│   │   ├── maintenance/                   Keeping the DS healthy
│   │   │   ├── runbook.md
│   │   │   ├── sync-checklist.md
│   │   │   └── scripts.md
│   │   ├── workflows/                     Consumer + contributor guides
│   │   │   ├── consumer.md
│   │   │   └── contributor.md
│   │   ├── layout-grid.md
│   │   ├── icons.md
│   │   └── packaging.md
│   │
│   ├── foundations/                        PLUS VOCABULARY + ARCHITECTURE (replaces phantom develop/)
│   │   ├── terminology.md                 PLUS-only vocabulary
│   │   ├── tech-stack.md                  Versions, commands, scripts
│   │   └── context-levels.md              Element → Card → Section → Page hierarchy
│   │
│   ├── solutions/                         COMPOUND LOOP
│   │   └── README.md                      Template + categories
│   │
│   ├── plans/                             (existing, unchanged)
│   └── ideation/                          (existing, unchanged)
│
├── .agent/
│   ├── skills/                            AGENT-AGNOSTIC SKILLS (two tiers)
│   │   │
│   │   │  ── MODE SKILLS (wrap DS modes — fix phantom refs in AGENT.md)
│   │   ├── learn-plus/                    Learning mode: "How do I...", "What is..."
│   │   │   ├── SKILL.md
│   │   │   └── references/
│   │   ├── design-consulting/             Consulting + Iteration: "Brainstorm", "Compare"
│   │   │   ├── SKILL.md
│   │   │   └── references/
│   │   ├── building/                      Prototyping + Finalization: "Build", "Create"
│   │   │   ├── SKILL.md
│   │   │   └── references/
│   │   ├── maintaining/                   Maintaining: "Update", "Fix", "Sync"
│   │   │   ├── SKILL.md
│   │   │   └── references/
│   │   │
│   │   │  ── WORKFLOW SKILLS (project-wide processes)
│   │   ├── uno-prototype/                  Scaffold new playground prototype
│   │   │   ├── SKILL.md
│   │   │   ├── references/
│   │   │   ├── examples/
│   │   │   └── scripts/
│   │   ├── uno-compound/                   Document learnings (compound loop)
│   │   │   ├── SKILL.md
│   │   │   ├── references/
│   │   │   └── examples/
│   │   ├── uno-review/                     Quality gate before shipping
│   │   │   ├── SKILL.md
│   │   │   ├── references/
│   │   │   └── scripts/
│   │   └── uno-post/              Post to marketplace (EXISTS — update paths)
│   │       └── SKILL.md
│   │
│   └── assets/                            JSON INDEXES (paths updated)
│       ├── README.md
│       ├── components-index.json
│       ├── tokens-index.json
│       ├── foundations-index.json
│       ├── examples-index.json
│       ├── patterns-index.json
│       ├── integrations-index.json
│       └── index-manifest.json
│
├── playground/                            PROTOTYPING WORKSPACE (flat, project-oriented)
│   ├── home-redesign/                     Tutor home page redesign (was bill/)
│   ├── monthly-report/                    Monthly report dashboard (was bill/)
│   ├── research-assistant-chat/           AI research assistant in admin (was bill/)
│   ├── in-session-ux/                     In-session content + reflection (was bill/sessions)
│   ├── weekly-report-demo/                Weekly report prototype (was bill/)
│   ├── session-management/                Session admin + attendance (was victor/sessions)
│   ├── training-progress/                 Training progress admin (was victor/)
│   ├── tutor-performance/                 Tutor performance admin (was victor/)
│   ├── group-modal/                       Group management modal (was Ashley/)
│   ├── group-performance-v2/              Group performance v2 (was Ashley/)
│   ├── tutor-risk-interventions/          At-risk tutor interventions (was Ashley/)
│   ├── storybook-ai-agent/               Storybook AI agent (was Ashley/ root)
│   ├── tutor-reflection-form/             Post-session reflection redesign (was Bryan/)
│   ├── starter/                           Bryan's starter template (was Bryan/)
│   └── README.md
│
├── marketplace/                           PROJECT SHOWCASE (to be rebuilt)
│   └── README.md                          Placeholder — marketplace was removed, needs re-architecture
│
├── .storybook/                            Storybook config (paths updated)
├── .claude/                               Claude Code settings
│   ├── settings.json
│   └── settings.local.json
├── .github/                               CI/CD
├── scripts/                               Token sync + generation (paths updated)
│   ├── sync-figma-tokens.js
│   ├── generate-all-tokens.js
│   └── storybook-networkinterfaces-fix.cjs
├── package.json                           Root config (updated aliases)
└── vite.config.js                         Root Vite config (updated aliases)
```

## What Changes

### Directory Moves

| From | To | References to Update |
|------|----|---------------------|
| `packages/plus-ds/` | `design-system/` | 99 references across 27 files |
| `packages/plus-ds/guidelines/` | `docs/design-system/` | Merge with .agent/references/ |
| `.agent/references/` | `docs/design-system/` | 16 files merged |
| `.agent/AGENT.md` | Eliminated (→ AGENTS.md) | — |
| `.agent/SKILL.md` | Eliminated (→ AGENTS.md + docs/design-system/modes/) | — |

### New Files

| File | Purpose |
|------|---------|
| `AGENTS.md` | Cross-agent entry point |
| `CLAUDE.md` | `@AGENTS.md` pointer |
| `.windsurfrules` | AGENTS.md pointer |
| `docs/project/plus-uno.md` | This repo: DS, prototyping, agent infra |
| `docs/project/plus-app.md` | PLUS product: users, features, flows, domain terms (from Notion Phase 0) |
| `docs/project/conventions.md` | File naming, imports, git, gotchas |
| `docs/project/setup-guide.md` | CE skills, MCP setup, platform config |
| `docs/solutions/README.md` | Compound loop template |
| `.agent/skills/po-*/` | 4 agent-agnostic skills |
| `marketplace/README.md` | Placeholder for project showcase rebuild |

### Alias Updates

```js
// vite.config.js (root) — BEFORE
'@': path.resolve(__dirname, './packages/plus-ds/src')
'@plus-ds': path.resolve(__dirname, './packages/plus-ds/src')

// vite.config.js (root) — AFTER
'@': path.resolve(__dirname, './design-system/src')
'@plus-ds': path.resolve(__dirname, './design-system/src')
```

Same pattern for all 16 playground vite configs — update relative paths from `../../packages/plus-ds/src` to `../../design-system/src`.

### Package.json Simplification

```json
// design-system/package.json — AFTER
{
  "name": "plus-ds",
  "private": true,
  "sideEffects": ["*.css", "*.scss"],
  "peerDependencies": {
    "bootstrap": ">=5.3.0",
    "react": ">=18.0.0",
    "react-bootstrap": ">=2.10.0",
    "react-dom": ">=18.0.0"
  },
  "dependencies": {
    "classnames": "^2.5.1",
    "prop-types": "^15.8.1"
  },
  "devDependencies": {
    "highcharts": "^11.4.8",
    "highcharts-react-official": "^3.2.3"
  },
  "scripts": {
    "build": "vite build",
    "test": "vitest run"
  }
}
```

### Deletions

| Item | Reason |
|------|--------|
| `packages/` directory wrapper | Flattened to `design-system/` |
| `packages/plus-ds/guidelines/` | Merged into `docs/design-system/` |
| `playground/templates/` (entire directory) | Redundant — specs + Storybook serve this purpose (see below) |
| `playground/Bill/` | Duplicate of `playground/prototyping/bill/` — content preserved in flattened structure |
| `playground/Ashley/` | `storybook-ai-agent/` moved to `playground/storybook-ai-agent/`, then deleted |
| `playground/prototyping/` | Entire directory flattened — all 12 prototypes now at `playground/` root |
| `playground/*.html`, `*.json`, `*.cjs` | Loose test/debug files (home-test.html, static-badge files, lottie files, optimize script) |
| `.agent/AGENT.md` | Replaced by AGENTS.md |
| `.agent/SKILL.md` | Split into AGENTS.md + docs/design-system/modes/ |
| `.agent/references/` (entire directory) | Merged into `docs/design-system/` |
| `packages/plus-ds/dist/` | No npm publishing |
| `packages/plus-ds/*.tgz` | Stale artifact |
| npm publishing fields | `files`, `exports`, `main`, `module`, `types`, `style`, `prepublishOnly`, `bundledDependencies` |

### Templates Elimination — Specs Are the Source of Truth

Investigation found `playground/templates/` is mostly empty scaffolding:
- `home/` contains only STRUCTURE.md pointing to specs — no implementation
- `admin/` has HTML/JS prototypes less complete than the spec React components
- Templates reference specs but add nothing over them

Meanwhile, **specs + Storybook already provide everything templates promised:**

| Capability | Templates | Specs + Storybook |
|-----------|-----------|-------------------|
| Page-level compositions | Planned but mostly empty | Full Pages/ directory with interactive stories |
| Component catalog | README.md lists | Autodocs with live props, variants, controls |
| Architectural guidance | STRUCTURE.md files | STRUCTURE.md in specs + story hierarchy mirrors IA |
| Interactive preview | None (static HTML) | Storybook with fullscreen layout, responsive testing |
| Discoverability | File system only | Storybook sidebar, searchable |

**Specs organization** (already in place, informed by Storybook):
```
design-system/src/specs/
├── Home/           Cards/ Elements/ Modals/ Sections/ Tables/ Pages/ STRUCTURE.md
├── Admin/          Tutor Admin/ Student Admin/ Session Admin/ Group Admin/
├── Toolkit/        In-Session/ Pre-Session/ Post-Session/
├── Training/       TrainingLessons/ Onboarding/
├── Profile/
├── Login/
└── Universal/      Sidebar, TopBar, Footer, PageLayout
```

Each spec follows the atomic hierarchy: **Elements → Cards/Tables → Sections/Modals → Pages**

Storybook sidebar mirrors this exactly via story `title` fields (e.g., `Specs/Admin/Tutor Admin/Pages/TutorPerformancePage`).

**Enhancement opportunity**: Add STRUCTURE.md to every spec directory (currently only Home and some Admin specs have them). This provides the Figma-to-code mapping that templates' STRUCTURE.md files were supposed to offer.

## AGENTS.md Design

~100-120 lines. Sections:

1. **Voice** — cite sources, push back on violations, be precise about file paths
2. **Product Context** — points to `docs/project/plus-app.md` for the tutoring platform, `docs/project/plus-uno.md` for this repo
3. **Design System** — 5 modes with inference signals, points to `docs/design-system/` for details
4. **Conventions** — points to `docs/project/conventions.md`
5. **Forbidden Patterns** (11 rules from SKILL.md):
   - Never hardcode colors/spacing/typography/radius/elevation — use tokens
   - Never skip reading component source + story + styles before using unfamiliar components
   - Never reach for generic primitives when a PLUS component exists
   - Never implement from Figma without fetching design context first
   - Never install packages without user approval
   - Never introduce non-Bootstrap UI frameworks
   - Never deep-import — use barrel exports
   - Never duplicate existing components — check `.agent/assets/components-index.json`
   - Never edit generated token files — run `npm run generate:tokens`
   - Never skip Storybook validation when component behavior is touched
   - Always confirm plan before large or risky edits
6. **Skills** — table of /uno:xxx with descriptions
7. **Learnings** — check `docs/solutions/` before work, document after
8. **Setup** — points to `docs/project/setup-guide.md`
9. **Commands** — npm scripts table
10. **Progressive Loading** — trigger → doc mapping table

## docs/project/ — Two Product Docs

### `plus-uno.md` — This Repo
- What plus-uno is: design system + prototyping workspace + agent infrastructure
- Tech stack: React 19, Bootstrap 5, Vite 6, Storybook 10, SASS
- Team: Bill, Ashley, Victor
- Directory layout overview
- DS inventory: 46 components, 61 forms, 11 DataViz, 10 specs, 9 token categories
- Deployment: Netlify (Storybook static site)
- Integrations: Figma MCP, Stitch MCP, Playwright MCP

### `plus-app.md` — The PLUS Product
Built from Notion research (Phase 0):
- What PLUS is: tutoring management platform
- Users & roles: Tutor, Student, Supervisor, Admin
- Core entities: Sessions, Reflections, Training, Groups, Sign-Ups, Call-Offs
- Feature map by area with implementation status
- Core user flows: session lifecycle, training, performance monitoring
- Domain terminology table
- Key metrics
- Product direction (sidebar IA revision, AI research assistant, multi-tier reflections)
- Notion source links

## Marketplace Status

The marketplace (PrototypeMarket) **exists** at `src/pages/PrototypeMarket/` with:
- `PrototypeMarket.jsx` — main page with search + filters
- `PrototypeCard.jsx` + `.scss` — card component
- `prototypes-data.js` — static data store
- `.agent/skills/uno-post/SKILL.md` — agent skill for guided submission

The marketplace is functional. Phase 2 (playground reorg) affects it since prototypes move from `playground/prototyping/{owner}/{name}` to `playground/{name}`. The `prototypes-data.js` file will need path and metadata updates to reflect the flat structure with project identifiers instead of creator groupings.

## Already Done (from recent commits — do NOT redo)

After `git pull`, these items from the original plan are already implemented:

| Item | Status | Notes |
|------|--------|-------|
| `CLAUDE.md` | Done | Points to `.agent/SKILL.md` (not AGENTS.md — needs update) |
| `.windsurfrules` | Done | Same content as CLAUDE.md |
| `.cursor/rules/plus-agent.mdc` | Done | Cursor native rules |
| `cursorrules.md` updated | Done | Points to `.agent/SKILL.md` with routing instructions |
| `.agent/AGENT.md` expanded | Done | Identity, skills table, grounding rules, foundations, repo structure |
| `.agent/SKILL.md` updated | Done | 6 modes now (added Prototyping), stronger rules, cheat sheets |
| `PLUS_CHEAT_SHEET.md` | Done | New asset — mandatory for UI code |
| `PLUS_LAYOUT_CHEAT_SHEET.md` | Done | New asset — mandatory for page layouts |
| `references/prototyping.md` | Done | New mode reference |
| Marketplace | Done | `src/pages/PrototypeMarket/` exists with components + data |
| `/uno-post` skill | Done | `.agent/skills/uno-post/SKILL.md` |

### Key Architecture Difference from Our Plan

The current codebase uses **`.agent/SKILL.md` as the entry point** (not `AGENTS.md`). Platform files (CLAUDE.md, .windsurfrules, cursorrules.md) all point to SKILL.md. `.agent/AGENT.md` is supporting context.

**Our plan proposed AGENTS.md as the entry point.** We need to decide: adapt to what exists (SKILL.md-first) or still create AGENTS.md and rewire. Given the user's clear preference for AGENTS.md as the cross-agent standard, the plan keeps AGENTS.md but must update the existing platform files.

### What Still Needs Doing

1. Flatten `packages/plus-ds/` → `design-system/` (not done)
2. Reorganize playground to flat/project-oriented (not done — includes Bryan prototype we missed)
3. Create `AGENTS.md` and rewire CLAUDE.md/.windsurfrules/cursorrules.md to point to it (updating what exists)
4. Create `docs/project/plus-uno.md` and `docs/project/plus-app.md` (not done)
5. Create `docs/project/conventions.md` and `docs/project/setup-guide.md` (not done)
6. Merge DS docs into `docs/design-system/` (not done)
7. Create compound loop `docs/solutions/` (not done)
8. **Reconcile skills architecture** — AGENT.md lists 4 phantom skills (learn-plus, design-consulting, building, maintaining) that have no SKILL.md files. Our plan adds 3 po- skills. Both need to be created.
9. Create `docs/foundations/` to replace phantom `develop/` references in AGENT.md
10. Update marketplace `prototypes-data.js` and `uno-post` skill after playground reorg
11. Update Storybook globs (explicitly reference `playground/Ashley/**` and `playground/Bill/**`)
12. Clean up old files after migration (not done)
13. Initialize memory system (not done)

### Post-Pull Mismatches to Fix

| What Exists | Issue | Our Fix |
|-------------|-------|---------|
| AGENT.md skills table | References 4 skill files that don't exist (learn-plus, design-consulting, building, maintaining) | Create them as real skills during Phase 6 |
| AGENT.md foundations | References `develop/foundations/` which doesn't exist | Map to `docs/foundations/` (terminology, tech-stack, context-levels) |
| AGENT.md repo structure table | Lists `develop/` and `packages/plus-ds/` | Update after restructure |
| CLAUDE.md / .windsurfrules | Point to `.agent/SKILL.md` (not AGENTS.md) | Rewire in Phase 3 |
| `prototypes-data.js` | All `repoPath` values use `playground/prototyping/{owner}/{name}/` | Update to `playground/{name}/` in Phase 2 |
| `uno-post` SKILL.md | Hardcodes `playground/prototyping/{name}/{project}/` | Update to `playground/{project}/` in Phase 2 |
| Storybook main.js | 3 explicit globs for `playground/prototyping/**`, `playground/Ashley/**`, `playground/Bill/**` | Simplify to single `playground/**` glob in Phase 2 |
| Bryan prototype | `playground/prototyping/Bryan/` has `tutor-reflection-form/` and `starter/` — not in our reorg plan | Include in Phase 2 flatten |

---

## Execution Plan

### Phase 0: Product Research (Notion) — Can run async

> **Fallback**: If Notion MCP fails (it errored earlier), create a placeholder `plus-app.md` from codebase exploration and mark sections "TO ENRICH FROM NOTION" for later.

1. Fetch Design HQ, Design Cards DB, Tutor Onboarding from Notion
2. Cross-reference with codebase prototypes and specs
3. Output: `docs/project/plus-app.md`

---

### Phase 1: Flatten `packages/` → `design-system/` — HIGHEST RISK

> **Gate**: Storybook and playground prototypes MUST work before proceeding. If anything breaks, fix it here before moving on. Commit after this phase.

4. `git mv packages/plus-ds design-system && rmdir packages`
5. Update root `vite.config.js`:
   - Lines 30-31: `@` and `@plus-ds` aliases → `./design-system/src`
   - Lines 72-74: SCSS `loadPaths` → `design-system/src/tokens`, `design-system/src/styles`, `design-system/src/forms`
6. Update `.storybook/main.js` (5 references):
   - Line 12: story glob → `../design-system/src/**/*.stories.{js,jsx,ts,tsx}`
   - Line 50: static dir → `design-system/dist`
   - Line 51: assets path → `design-system/src/assets`
   - Line 70: srcPath → `design-system/src`
7. Update all 16 playground `vite.config.js` files — relative paths to `design-system/src`
8. Update 2 playground `tsconfig.json` files — path mappings
9. Update `scripts/generate-all-tokens.js` and `scripts/restore-tokens.js`
10. Simplify `design-system/package.json` — add `private: true`, strip all publishing fields (`files`, `exports`, `main`, `module`, `types`, `style`, `prepublishOnly`, `bundledDependencies`), move `highcharts` to devDependencies
11. Delete `design-system/tutors.plus-design-system-0.1.0-pilot.11.tgz` (stale tarball)
12. Delete `design-system/dist/` if it exists
13. Check `netlify.toml` — ensure build still works with new paths
14. **GATE: Verify `npm run storybook` works**
15. **GATE: Verify `npm run dev:home-redesign` works**
16. **Commit**: `refactor: flatten packages/plus-ds to design-system/`

---

### Phase 2: Reorganize playground — MEDIUM RISK

> Flatten from creator-grouped to project-oriented. No prototypes lost — just renamed/moved. Creator info moves to each prototype's README (marketplace metadata).

17. Flatten all prototypes to `playground/` root (14 projects total):
    - `prototyping/bill/home-redesign/` → `playground/home-redesign/`
    - `prototyping/bill/monthly-report/` → `playground/monthly-report/`
    - `prototyping/bill/research-assistant-chat/` → `playground/research-assistant-chat/`
    - `prototyping/bill/sessions/` → `playground/in-session-ux/` (renamed — collision with victor)
    - `prototyping/bill/weekly-report-demo/` → `playground/weekly-report-demo/`
    - `prototyping/victor/sessions/` → `playground/session-management/` (renamed — collision)
    - `prototyping/victor/training-progress/` → `playground/training-progress/`
    - `prototyping/victor/tutor-performance/` → `playground/tutor-performance/`
    - `prototyping/Ashley/group-modal/` → `playground/group-modal/`
    - `prototyping/Ashley/group-performance-v2/` → `playground/group-performance-v2/`
    - `prototyping/Ashley/tutor-risk-interventions/` → `playground/tutor-risk-interventions/`
    - `Ashley/storybook-ai-agent/` → `playground/storybook-ai-agent/` (unique to Ashley/ root)
    - `prototyping/Bryan/tutor-reflection-form/` → `playground/tutor-reflection-form/`
    - `prototyping/Bryan/starter/` → `playground/starter/`
18. Remove now-empty: `playground/prototyping/`, `playground/Bill/` (confirmed dup), `playground/Ashley/`
19. Remove `playground/templates/` (redundant — specs + Storybook replace this)
20. Remove loose files: `home-test.html`, `static-badge-*.html`, `optimize-lottie.cjs`, `*.json` lottie files
21. Update `.storybook/main.js` story globs — replace 3 explicit globs with single:
    ```js
    '../playground/**/*.stories.{js,jsx,ts,tsx}'
    ```
22. Update `src/pages/PrototypeMarket/prototypes-data.js`:
    - All `repoPath` values: `playground/prototyping/{owner}/{name}/` → `playground/{name}/`
    - All `id` values: remove creator prefix (e.g., `bill-home-redesign` → `home-redesign`)
    - Update renamed projects: `bill-sessions` → `in-session-ux`, `victor-sessions` → `session-management`
23. Update `.agent/skills/uno-post/SKILL.md`:
    - Phase 1 path: `playground/prototyping/{name}/{project}/` → `playground/{project}/`
    - Auto-generate `id` from project folder name (not `{creator}-{project}`)
    - Confirmation template: update `repoPath` example
24. Add marketplace metadata to each prototype's README.md:
    ```yaml
    ---
    name: Home Redesign
    creator: Bill
    date: 2026-03-10
    status: active
    area: home
    stage: high
    description: Tutor home page redesign with skills radar, weekly load, student momentum
    ---
    ```
25. Update `playground/README.md` — document flat structure, link to specs as starting point
26. Update root `package.json` dev scripts — paths may change for renamed prototypes
27. Update playground vite.config.js relative paths to `design-system/src` (broken by both Phase 1 + Phase 2 moves)
28. **GATE: Verify `npm run dev:home-redesign` works**
29. **GATE: Verify marketplace at `/market` shows all 14 prototypes correctly**
30. **Commit**: `refactor: flatten playground to project-oriented structure`

---

### Phase 3: Create AGENTS.md and rewire platform files — LOW RISK

> CLAUDE.md, .windsurfrules, cursorrules.md, and .cursor/rules/plus-agent.mdc all exist already — they currently point to `.agent/SKILL.md`. We create AGENTS.md and update them to point there instead. AGENTS.md then references SKILL.md for DS routing.

23. Create `AGENTS.md` at root (~100-120 lines) — incorporates grounding rules from current AGENT.md + project-wide context
24. Update `CLAUDE.md` — change from SKILL.md pointer to `@AGENTS.md`
25. Update `.windsurfrules` — change from SKILL.md pointer to AGENTS.md pointer
26. Update `cursorrules.md` — change from SKILL.md pointer to AGENTS.md pointer
27. Update `.cursor/rules/plus-agent.mdc` — change from SKILL.md pointer to AGENTS.md pointer
28. Update `.agent/references/platform-integration.md` — document new AGENTS.md-first architecture
29. **Commit**: `feat: add AGENTS.md cross-agent entry point, rewire platform files`

---

### Phase 4: Create project docs + foundations — LOW RISK

> `docs/foundations/` replaces the phantom `develop/foundations/` that AGENT.md references but doesn't exist.

31. Create `docs/project/plus-uno.md` (this repo)
32. Create `docs/project/plus-app.md` (the product — from Phase 0 or placeholder)
33. Create `docs/project/conventions.md`
34. Create `docs/project/setup-guide.md`
35. Create `docs/foundations/terminology.md` — PLUS-only vocabulary (referenced by AGENT.md grounding rule #1)
36. Create `docs/foundations/tech-stack.md` — versions, commands, scripts
37. Create `docs/foundations/context-levels.md` — Element → Card → Section → Page hierarchy
38. Update `.agent/AGENT.md` foundations section — change `develop/foundations/` refs to `docs/foundations/`
39. Update `.agent/AGENT.md` repo structure table — `packages/plus-ds/` → `design-system/`, add `docs/`, remove `develop/`
40. **Commit**: `docs: add project context, product landscape, and PLUS foundations`

---

### Phase 5: Merge DS docs — MEDIUM RISK (content loss possible)

> Merging 32 files (16 guidelines + 16 references) into ~18 consolidated docs. Must verify zero content loss.

33. Create `docs/design-system/` directory structure
34. Merge `design-system/guidelines/*` + `.agent/references/*` into `docs/design-system/` following the merge table in "What Gets Created" section
35. Move mode files to `docs/design-system/modes/`
36. Preserve `<!-- ~NNN tokens -->` comments for progressive loading
37. Add STRUCTURE.md to spec directories that lack them (Toolkit, Training, Profile, Login, Universal)
38. **Verify**: count source files (32) vs target files (~18 merged) — confirm all content accounted for
39. **Commit**: `docs: consolidate design system knowledge into docs/design-system/`

---

### Phase 6: Create ALL skills + compound loop — MEDIUM RISK

> Two tiers of skills: **mode skills** (fix 4 phantom refs in AGENT.md) + **workflow skills** (new project processes). `uno-post` already exists but was updated in Phase 2.

**Mode skills** — DELETED. The mode routing in `.agent/SKILL.md` handles learn-plus, design-consulting, building, and maintaining directly by pointing to `docs/design-system/modes/`. Separate skill wrappers were redundant.

**Workflow skills** (project-wide processes):
50. Create `.agent/skills/uno-prototype/` with full structure (SKILL.md + references/ + examples/ + scripts/)
51. Create `.agent/skills/uno-compound/` with full structure
52. Create `.agent/skills/uno-review/` with full structure

**Compound loop**:
53. Create `docs/solutions/README.md` (template + categories)

54. Update `.agent/AGENT.md` skills table — verify all 8 skills have working SKILL.md paths
55. **Commit**: `feat: create mode skills, workflow skills, and compound loop`

---

### Phase 7: Clean up old files + fix stale paths — LOW RISK

> AGENT.md stays (updated, not removed). SKILL.md is removed — content distributed to AGENTS.md + docs/ + assets/.

56. Remove `.agent/SKILL.md` (routing → AGENTS.md, modes → docs/design-system/modes/, cheat sheets stay in assets/)
57. Remove `.agent/references/` (entire directory — content now in docs/design-system/)
58. Remove `design-system/guidelines/` (content now in docs/design-system/)
59. Update `.agent/AGENT.md`:
    - Foundations links: `develop/foundations/` → `docs/foundations/`
    - Design tokens link: `packages/plus-ds/guidelines/design-tokens/` → `docs/design-system/tokens.md`
    - Repo structure table: `packages/plus-ds/` → `design-system/`, add `docs/`, remove `develop/`
    - Verify all 8 skill paths in skills table resolve
60. Update `.agent/assets/*.json` — fix all paths:
    - `packages/plus-ds/` → `design-system/`
    - `packages/plus-ds/guidelines/` → `docs/design-system/`
    - `.agent/references/` → `docs/design-system/`
61. Update `.agent/assets/README.md`
62. Add STRUCTURE.md to spec directories that lack them (Toolkit, Training, Profile, Login, Universal)
63. Grep entire repo for stale paths: `packages/`, `.agent/references/`, `playground/templates`, `playground/prototyping/`, `develop/`
64. Fix any stragglers
65. **Commit**: `chore: remove superseded files, fix all stale path references`

---

### Phase 8: Initialize memory — LOW RISK

66. Create `~/.claude/projects/.../memory/MEMORY.md` (index)
67. Create `user_bill.md` (user profile)
68. Create `project_plus_one.md` (project context)
69. Create `feedback_agent_architecture.md` (agent system decisions)

---

### Phase 9: Final verification — GATE

70. `npm run storybook` — Storybook works with all stories loading
71. `npm run dev` — Vite dev server works
72. `npm run dev:home-redesign` — prototype works (path may have changed)
73. `npm run dev:monthly-report` — prototype works
74. `npm run build` — production build succeeds
75. Marketplace at `/market` — all 14 prototypes show with correct paths
76. Fresh Claude Code session — verify CLAUDE.md → AGENTS.md → AGENT.md chain loads
77. Test: "help me learn about Button" → learn-plus skill activates
78. Test: all 8 skill SKILL.md paths in AGENT.md resolve
79. Grep for stale paths — zero results for: `packages/`, `develop/`, `playground/prototyping/`, `.agent/references/`
80. Confirm `docs/design-system/` has all merged docs with `<!-- ~NNN tokens -->` estimates
81. Confirm `docs/foundations/` has terminology, tech-stack, context-levels

## Acceptance Criteria

### Phase 1 Gate (must pass before continuing)
- [ ] `packages/` directory no longer exists
- [ ] `design-system/` exists at root with all component source intact
- [ ] `design-system/package.json` has `private: true`, no publishing fields
- [ ] All 99 references updated — zero grep results for `packages/plus-ds`
- [ ] No stale tarball or dist/
- [ ] `npm run storybook` works
- [ ] `npm run dev:home-redesign` works

### Cleanup
- [ ] `playground/templates/` no longer exists
- [ ] `playground/` is flat — 12 project directories, no creator subdirectories
- [ ] `playground/prototyping/`, `playground/Bill/`, `playground/Ashley/` all removed
- [ ] Each prototype has README.md with marketplace metadata (name, creator, date, status, area)
- [ ] `bill/sessions` renamed to `in-session-ux`, `victor/sessions` renamed to `session-management`
- [ ] Loose test files removed from `playground/`
- [ ] Every spec directory has a STRUCTURE.md

### Agent Infrastructure
- [ ] `AGENTS.md` at root with 11 forbidden patterns, commands, modes, skills, progressive loading
- [ ] `CLAUDE.md` → `@AGENTS.md`
- [ ] `cursorrules.md` → AGENTS.md
- [ ] `.windsurfrules` → AGENTS.md

### Docs
- [ ] `docs/project/plus-uno.md` — repo context (DS, prototyping, agent infra)
- [ ] `docs/project/plus-app.md` — product context (users, features, flows, terms)
- [ ] `docs/project/conventions.md` — project conventions
- [ ] `docs/project/setup-guide.md` — onboarding
- [ ] `docs/design-system/` — ALL DS knowledge, zero content loss from 32 source files
- [ ] `docs/solutions/README.md` — compound loop template
- [ ] No DS docs remain in `design-system/guidelines/` or `.agent/references/`

### Skills
- [ ] 4 skills with full directory structure (SKILL.md + references/ + examples/ + scripts/)
- [ ] `/uno:post` marked blocked pending marketplace rebuild

### Marketplace
- [ ] `marketplace/README.md` exists as placeholder

### Final Verification (Phase 9)
- [ ] Storybook works with all stories
- [ ] Vite dev works
- [ ] All playground prototypes work
- [ ] Production build succeeds (`npm run build`)
- [ ] Fresh Claude Code session loads AGENTS.md correctly
- [ ] Mode routing works
- [ ] Zero grep results for `packages/`, `.agent/references/`, `playground/templates`

## Sources

### Internal (this planning session)
- Plans 001-006: superseded, all decisions incorporated
- Review findings: docs/project/ split, packages/ restructure, templates not redundant, marketplace gap
- Codebase exploration: 99 references mapped across 27 files
- Marketplace history: built Mar 18, removed, needs re-architecture

### Product (Notion — Phase 0)
- Design HQ: https://www.notion.so/plus-tutors/Design-HQ-7965d76a998e47c19f11aef21ae1ab80
- Design Cards DB: https://www.notion.so/plus-tutors/e3ef0e5a323c4a39a706f2842164bdc3?v=6360bd0ad95347ce91b1355a0d14a502
- Tutor Onboarding: https://plus-tutors.notion.site/Tutor-Onboarding-Material-26fb7cca49828000952fd7b346d1b09c

### External
- Coding Agent Grounding Playbook (cornerstone)
- Compound Engineering: https://every.to/guides/compound-engineering
- Anthropic best practices: skills, CLAUDE.md, context engineering
- npm publishing research: Chakra, Radix, Ant Design — all ship dist/ only
