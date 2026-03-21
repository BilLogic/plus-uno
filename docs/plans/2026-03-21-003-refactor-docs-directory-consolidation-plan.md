---
title: "refactor: Consolidate docs/ directory into 3-directory structure"
type: refactor
status: active
date: 2026-03-21
origin: docs/plans/2026-03-21-001-feat-agents-md-compound-loop-agent-skills-plan.md
---

# Consolidate docs/ into 3-Directory Structure

## Overview

The docs/ section of plan 001 proposed 5 subdirectories (`agent-context/`, `design-system/`, `solutions/`, `plans/`, `ideation/`). This plan consolidates to **3 directories** by merging ideation into plans, nesting DS guides under a unified guides/ directory, and absorbing redundant files.

## Problem

1. **5 subdirectories is too many** for a project with 4 actual doc files today
2. **`ideation/` and `plans/` are the same pipeline** — ideation is just an early-stage plan
3. **`agent-context/` and `design-system/` are both "guides for agents"** — separating them is artificial
4. **"agent-context" is jargon** — nobody searches for "agent context"
5. **`platform-integration.md` overlaps with the proposed setup guide** — two files about "how to configure your tools"
6. **`packages/plus-ds/guidelines/` already has DS source docs** — the agent decision guides in `.agent/references/` are a different layer (workflow guidance, not reference docs) and should be clearly distinguished

## Proposed Structure

```
docs/
├── guides/                         (everything an agent or human needs to reference)
│   ├── product-landscape.md        (what is plus-one, stack, inventory, team)
│   ├── conventions.md              (file naming, imports, git, gotchas)
│   ├── setup.md                    (CE skills, MCP servers, platform config — absorbs platform-integration.md)
│   └── design-system/              (agent workflow guides — moved from .agent/references/)
│       ├── router.md               (mode routing — was SKILL.md)
│       ├── learning.md             (mode: understand existing code)
│       ├── maintaining.md          (mode: update DS source/tokens/docs)
│       ├── consulting.md           (mode: early wireframing/IA)
│       ├── iteration.md            (mode: 3-5 variations with tradeoffs)
│       ├── finalization.md         (mode: production-ready implementation)
│       ├── foundations-guide.md    (baseline context, terminology)
│       ├── tokens-guide.md        (token application rules)
│       ├── components-guide.md    (component selection workflow)
│       ├── implementation-guide.md (pattern rules, example selection)
│       ├── integrations-guide.md  (Figma/Stitch MCP workflows)
│       ├── local-preview-runbook.md (dev server, Storybook)
│       ├── maintenance.md         (updating agent docs)
│       ├── script-inventory.md    (npm scripts reference)
│       └── sync-checklist.md      (staleness prevention)
├── plans/                          (ideation + plans — the full pipeline)
└── solutions/                      (compound loop — learnings that feed back)
```

**3 directories. Clear hierarchy. No jargon.**

## Key Decisions

### 1. Merge ideation/ into plans/

Ideation and plans are stages of the same pipeline. The existing naming convention already distinguishes them: `2026-03-17-toolkit-ia-revision-ideation.md` vs `2026-03-17-001-feat-toolkit-ia-revision-plan.md`. One directory, sorted by date.

**Action:** Move `docs/ideation/*.md` → `docs/plans/`. Delete `docs/ideation/`.

### 2. Single guides/ directory with DS nested inside

Project-wide guides (product-landscape, conventions, setup) sit at `docs/guides/` root. DS-specific agent guides (16 files) nest under `docs/guides/design-system/`. This reflects reality: 3 general files + 15 DS files.

**Why not flat?** 18 flat files is hard to scan. The nesting communicates "these 15 are about the design system specifically."

**Why not separate agent-context/ and design-system/?** They're both "guides for agents." An agent looking for token rules shouldn't need to know which subdirectory category it falls into.

### 3. Absorb platform-integration.md into setup.md

`platform-integration.md` currently documents how to wire Claude Code, Cursor, Windsurf to SKILL.md. The new `setup.md` covers CE skills, MCP servers, AND platform config. Same topic → one file.

**Action:** Merge platform-integration.md content into setup.md. 15 DS files moved (not 16).

### 4. packages/plus-ds/guidelines/ stays where it is

These are **source documentation** co-located with the package: component catalogs, token value references, Figma workflow tutorials. The agent guides in `docs/guides/design-system/` are a **different layer** — concise workflow decisions that REFERENCE the guidelines. They complement, not duplicate.

**Example:** `docs/guides/design-system/components-guide.md` says "Read `packages/plus-ds/guidelines/overview-components.md` first" — it's a workflow wrapper, not a copy.

### 5. solutions/ stays as-is

The compound loop is distinct from guides and plans. It's where learnings accumulate and feed back into guides. Separate directory is correct.

## Implementation

### Task 1: Create docs/guides/ structure

- [ ] Create `docs/guides/` directory
- [ ] Create `docs/guides/product-landscape.md` (~50 lines)
- [ ] Create `docs/guides/conventions.md` (~40 lines)
- [ ] Create `docs/guides/setup.md` (~60 lines — merges platform-integration.md content):
  - Recommended CE skills: `/ce:plan`, `/ce:work`, `/ce:review`, `/ce:compound`, `/ce:brainstorm`, `/ce:ideate`
  - MCP servers: Figma (required), Stitch (required for wireframes), Playwright (optional), Context7 (recommended)
  - Platform config for Claude Code, Cursor, Windsurf (absorbed from platform-integration.md)
  - Environment variables, first steps for new contributors

### Task 2: Move .agent/references/ → docs/guides/design-system/

- [ ] Create `docs/guides/design-system/` directory
- [ ] Move and rename `.agent/SKILL.md` → `docs/guides/design-system/router.md`
- [ ] Move 5 mode files: `learning.md`, `maintaining.md`, `consulting.md`, `iteration.md`, `finalization.md`
- [ ] Move 5 core guides: `foundations-guide.md`, `tokens-guide.md`, `components-guide.md`, `implementation-guide.md`, `integrations-guide.md`
- [ ] Move 3 operational: `local-preview-runbook.md`, `maintenance.md`, `script-inventory.md`, `sync-checklist.md`
- [ ] Do NOT move `platform-integration.md` — its content is absorbed into `setup.md`
- [ ] Do NOT move `index.md` — replaced by AGENTS.md pointers
- [ ] Update all internal cross-references within moved files
- [ ] Delete `.agent/references/` and `.agent/AGENT.md` and `.agent/SKILL.md`

### Task 3: Merge ideation/ into plans/

- [ ] Move `docs/ideation/2026-03-17-toolkit-ia-revision-ideation.md` → `docs/plans/`
- [ ] Delete `docs/ideation/` directory

### Task 4: Create docs/solutions/

- [ ] Create `docs/solutions/README.md` (~15 lines): purpose, template, categories, compounding rules
- [ ] Create category directories with `.gitkeep`: `ui-bugs/`, `integration-issues/`, `agent-infrastructure/`, `token-issues/`

### Task 5: Update all references

- [ ] Update AGENTS.md to point to `docs/guides/` and `docs/guides/design-system/`
- [ ] Update `docs/guides/design-system/router.md` internal paths
- [ ] Update `.agent/assets/*.json` if they reference `.agent/references/` paths
- [ ] Update skill SKILL.md files to reference `docs/guides/` paths
- [ ] Grep entire repo for `.agent/references/` and fix any remaining references

## File Movement Map

| From | To | Notes |
|------|-----|-------|
| `.agent/SKILL.md` | `docs/guides/design-system/router.md` | Merged with AGENT.md content |
| `.agent/AGENT.md` | DELETED | Content split between AGENTS.md and router.md |
| `.agent/references/learning.md` | `docs/guides/design-system/learning.md` | |
| `.agent/references/maintaining.md` | `docs/guides/design-system/maintaining.md` | |
| `.agent/references/consulting.md` | `docs/guides/design-system/consulting.md` | |
| `.agent/references/iteration.md` | `docs/guides/design-system/iteration.md` | |
| `.agent/references/finalization.md` | `docs/guides/design-system/finalization.md` | |
| `.agent/references/foundations-guide.md` | `docs/guides/design-system/foundations-guide.md` | |
| `.agent/references/tokens-guide.md` | `docs/guides/design-system/tokens-guide.md` | |
| `.agent/references/components-guide.md` | `docs/guides/design-system/components-guide.md` | |
| `.agent/references/implementation-guide.md` | `docs/guides/design-system/implementation-guide.md` | |
| `.agent/references/integrations-guide.md` | `docs/guides/design-system/integrations-guide.md` | |
| `.agent/references/local-preview-runbook.md` | `docs/guides/design-system/local-preview-runbook.md` | |
| `.agent/references/maintenance.md` | `docs/guides/design-system/maintenance.md` | |
| `.agent/references/script-inventory.md` | `docs/guides/design-system/script-inventory.md` | |
| `.agent/references/sync-checklist.md` | `docs/guides/design-system/sync-checklist.md` | |
| `.agent/references/platform-integration.md` | ABSORBED into `docs/guides/setup.md` | |
| `.agent/references/index.md` | DELETED | Replaced by AGENTS.md pointers |
| `docs/ideation/*.md` | `docs/plans/` | Ideation merged into plans |
| NEW | `docs/guides/product-landscape.md` | |
| NEW | `docs/guides/conventions.md` | |
| NEW | `docs/guides/setup.md` | |
| NEW | `docs/solutions/README.md` | |

## Updated Architecture (replaces docs/ section of plan 001)

```
AGENTS.md (THE entry point)
├── docs/
│   ├── guides/                     (all reference docs — project + DS)
│   │   ├── product-landscape.md
│   │   ├── conventions.md
│   │   ├── setup.md
│   │   └── design-system/         (15 agent workflow guides — moved from .agent/references/)
│   ├── plans/                      (ideation + plans consolidated)
│   └── solutions/                  (compound loop)
├── .agent/
│   ├── skills/                     (/po:xxx with full dir structure)
│   └── assets/                     (JSON indexes)
├── packages/plus-ds/guidelines/    (DS source documentation — UNCHANGED, stays co-located)
```

## Acceptance Criteria

- [ ] `docs/` has exactly 3 subdirectories: `guides/`, `plans/`, `solutions/`
- [ ] `docs/guides/` has 3 project-wide files + `design-system/` subdirectory
- [ ] `docs/guides/design-system/` has 15 files (all from `.agent/references/` except platform-integration.md and index.md)
- [ ] `docs/ideation/` no longer exists (files moved to `docs/plans/`)
- [ ] `.agent/references/` no longer exists
- [ ] `.agent/AGENT.md` no longer exists
- [ ] `.agent/SKILL.md` no longer exists
- [ ] No broken cross-references (grep for `.agent/references/` returns 0 results)
- [ ] `packages/plus-ds/guidelines/` is untouched
- [ ] AGENTS.md correctly points to all new paths

## Sources

- **Origin:** [plan 001](docs/plans/2026-03-21-001-feat-agents-md-compound-loop-agent-skills-plan.md) — this replaces the docs/ section
- Current `.agent/references/`: 16 files + index.md
- Current `packages/plus-ds/guidelines/`: 16 files (stays untouched)
- Current `docs/`: ideation/ (1 file) + plans/ (3 files)
