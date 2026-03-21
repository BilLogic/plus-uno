---
title: "feat: Add AGENTS.md entry point, consolidated docs, compound loop, and skills for plus-one"
type: feat
status: active
date: 2026-03-21
---

# Add AGENTS.md Entry Point, Consolidated Docs, Compound Loop, and Skills

## Overview

The plus-one project has agent guidance split across `.agent/AGENT.md`, `.agent/SKILL.md`, and 16 reference files in `.agent/references/` — but no cross-agent entry point, no compound loop, and no user-invocable skills. This plan consolidates all documentation under `docs/`, establishes AGENTS.md as the single entry point, and introduces `/po:xxx` skills.

## Problem Statement / Motivation

1. **No cross-agent entry point** — Platform files point to `.agent/SKILL.md` which only covers DS work
2. **Docs split across two locations** — `.agent/references/` and `docs/` create confusion about where things live
3. **Redundant files** — `.agent/AGENT.md` and `.agent/SKILL.md` are two files that should be one, and shouldn't coexist alongside a root AGENTS.md
4. **No compound loop** — Learnings lost between sessions
5. **No user-invocable skills** — Repeatable workflows aren't codified as `/po:xxx` commands
6. **No setup guide** — New contributors don't know which CE skills and MCP servers to install

## Proposed Solution

### Architecture

```
AGENTS.md (THE entry point, ~80 lines — one file, all agents read it)
├── docs/
│   ├── agent-context/                    (project-wide references)
│   │   ├── product-landscape.md          (platform, stack, inventory, team)
│   │   ├── conventions.md                (file naming, imports, git, gotchas)
│   │   └── setup-guide.md               (CE skills, MCP servers, platform config)
│   ├── design-system/                    (DS guides — moved from .agent/references/)
│   │   ├── router.md                     (mode routing — was .agent/SKILL.md)
│   │   ├── learning.md                   (mode guide)
│   │   ├── maintaining.md                (mode guide)
│   │   ├── consulting.md                 (mode guide)
│   │   ├── iteration.md                  (mode guide)
│   │   ├── finalization.md               (mode guide)
│   │   ├── foundations-guide.md           (core guide)
│   │   ├── tokens-guide.md               (core guide)
│   │   ├── integrations-guide.md         (core guide)
│   │   ├── components-guide.md           (core guide)
│   │   ├── implementation-guide.md       (core guide)
│   │   ├── local-preview-runbook.md      (runbook)
│   │   ├── maintenance.md                (maintenance)
│   │   ├── script-inventory.md           (maintenance)
│   │   ├── sync-checklist.md             (maintenance)
│   │   └── platform-integration.md       (meta)
│   ├── solutions/                        (compound loop)
│   │   ├── README.md
│   │   ├── ui-bugs/
│   │   ├── integration-issues/
│   │   ├── agent-infrastructure/
│   │   └── token-issues/
│   ├── plans/                            (EXISTING, unchanged)
│   └── ideation/                         (EXISTING, unchanged)
├── .agent/
│   ├── skills/                           (/po:xxx user-invocable workflows)
│   │   ├── po-prototype/
│   │   │   ├── SKILL.md
│   │   │   ├── references/
│   │   │   ├── examples/
│   │   │   └── scripts/
│   │   ├── po-compound/
│   │   │   ├── SKILL.md
│   │   │   ├── references/
│   │   │   ├── examples/
│   │   │   └── scripts/
│   │   ├── po-review/
│   │   │   ├── SKILL.md
│   │   │   ├── references/
│   │   │   ├── examples/
│   │   │   └── scripts/
│   │   └── po-post/
│   │       ├── SKILL.md
│   │       ├── references/
│   │       ├── examples/
│   │       └── scripts/
│   └── assets/                           (JSON indexes — UNCHANGED)

Platform pointers (all point to AGENTS.md):
  CLAUDE.md        → @AGENTS.md
  cursorrules.md   → Read AGENTS.md
  .windsurfrules   → Read AGENTS.md (future)
```

### Key Design Decisions

- **AGENTS.md is THE single entry point** — no `.agent/AGENT.md`, no `.agent/SKILL.md`. One file to rule them all.
- **All docs consolidated under `docs/`** — DS guides move from `.agent/references/` to `docs/design-system/`. One place for documentation.
- **`.agent/` is only for skills and assets** — invocable workflows (skills/) and JSON lookup data (assets/). No markdown reference docs.
- **Each skill has full directory structure** — SKILL.md + references/ + examples/ + scripts/ per skill (see plan 002)
- **Forbidden patterns centralized in AGENTS.md** — extracted from SKILL.md's Critical Rules
- **Setup guide advises CE skills + MCP servers** — new contributors know what to install upfront

## Technical Approach

### Implementation Phases

#### Phase 1: Foundation — AGENTS.md + CLAUDE.md + Platform Pointers

**Tasks:**

- [ ] Create `AGENTS.md` at project root (~80 lines):
  - Voice/personality section
  - Product context → `docs/agent-context/product-landscape.md`
  - Design system → `docs/design-system/router.md`
  - Conventions → `docs/agent-context/conventions.md`
  - Setup → `docs/agent-context/setup-guide.md`
  - Forbidden patterns (6 rules, extracted from current SKILL.md Critical Rules)
  - Skills section listing `/po:prototype`, `/po:compound`, `/po:review`, `/po:post`
  - Learnings → `docs/solutions/`
  - Commands table
- [ ] Create `CLAUDE.md`: single line `@AGENTS.md`
- [ ] Update `cursorrules.md`: point to `AGENTS.md`

**Files:** `AGENTS.md` (NEW), `CLAUDE.md` (NEW), `cursorrules.md` (MODIFIED)

#### Phase 2: Consolidate All Docs Under docs/

**Tasks:**

- [ ] Move `.agent/references/` → `docs/design-system/`:
  - Move all 16 files, preserving content
  - Rename SKILL.md content → `docs/design-system/router.md` (the mode routing, component discovery, import conventions, critical rules, reference loading)
  - Update all internal cross-references between moved files (e.g., `references/tokens-guide.md` → `docs/design-system/tokens-guide.md`)
  - Update `router.md` to reference AGENTS.md as parent entry point
  - Add compound loop awareness to router.md Critical Rules
  - Add skills section to router.md
- [ ] Delete `.agent/AGENT.md` and `.agent/SKILL.md` — content lives in AGENTS.md + `docs/design-system/router.md`
- [ ] Delete `.agent/references/` directory (all content moved to `docs/design-system/`)
- [ ] Update `.agent/assets/*.json` if they reference `.agent/references/` paths

**Files:** 16 files moved, `.agent/AGENT.md` deleted, `.agent/SKILL.md` deleted, `.agent/references/` deleted

#### Phase 3: Project-Wide Reference Docs — docs/agent-context/

**Tasks:**

- [ ] Create `docs/agent-context/product-landscape.md` (~50 lines):
  - What is plus-one, tech stack, DS inventory, token system, playground, deployment, integrations
- [ ] Create `docs/agent-context/conventions.md` (~40 lines):
  - File naming, import patterns, playground structure, git conventions, docs pipeline, token workflow, known gotchas
- [ ] Create `docs/agent-context/setup-guide.md` (~50 lines):
  - Recommended CE skills: `/ce:plan`, `/ce:work`, `/ce:review`, `/ce:compound`, `/ce:brainstorm`, `/ce:ideate`
  - MCP servers: Figma (required), Stitch (required for wireframes), Playwright (optional), Context7 (recommended)
  - Platform config: Claude Code, Cursor, Windsurf setup
  - Environment variables, first steps for new contributors

**Files:** 3 new files in `docs/agent-context/`

#### Phase 4: Compound Loop — docs/solutions/

**Tasks:**

- [ ] Create `docs/solutions/README.md` (~15 lines): purpose, template, categories, compounding rules
- [ ] Create category directories with `.gitkeep`: `ui-bugs/`, `integration-issues/`, `agent-infrastructure/`, `token-issues/`

**Files:** `docs/solutions/README.md` (NEW), 4 category directories

#### Phase 5: Skills — .agent/skills/ (see plan 002 for details)

Create 4 skills with full directory structure. Each skill has SKILL.md + references/ + examples/ + scripts/. Detailed design in plan 002.

#### Phase 6: Tech Stack Audit + First Compound Pass

**Tasks:**

- [ ] Audit tech stack: package versions, MCP health, settings, env vars, scripts
- [ ] Create first solution doc: `docs/solutions/agent-infrastructure/YYYY-MM-DD-tech-stack-audit-and-agent-docs-setup.md`
- [ ] Extract any new forbidden patterns or gotchas into AGENTS.md and conventions.md

#### Phase 7: Memory System Initialization

**Tasks:**

- [ ] Create `MEMORY.md` index, `user_bill.md`, `project_plus_one.md`, `feedback_agent_architecture.md`
- [ ] Feedback memory captures: AGENTS.md is THE entry point, all docs under `docs/`, `.agent/` is skills + assets only, project name is "plus-one"

## Acceptance Criteria

- [ ] `AGENTS.md` exists at project root as THE single entry point
- [ ] `CLAUDE.md` exists as `@AGENTS.md` pointer
- [ ] `cursorrules.md` points to `AGENTS.md`
- [ ] `docs/design-system/` contains all 16 former `.agent/references/` files + `router.md` (merged SKILL.md)
- [ ] `docs/agent-context/` contains product-landscape, conventions, setup-guide
- [ ] `docs/solutions/` has README and category directories
- [ ] `.agent/AGENT.md` no longer exists
- [ ] `.agent/SKILL.md` no longer exists
- [ ] `.agent/references/` no longer exists
- [ ] `.agent/` contains only `skills/` and `assets/`
- [ ] All internal cross-references updated (no broken links)
- [ ] 4 skills created in `.agent/skills/` with full directory structure (plan 002)
- [ ] Memory files created
- [ ] Fresh Claude Code session auto-loads CLAUDE.md → AGENTS.md with correct context

## Dependencies & Risks

- **Risk**: Moving 16 files could break references in existing mode guides
  - **Mitigation**: Systematic find-and-replace of all `.agent/references/` → `docs/design-system/` paths
- **Risk**: `.agent/assets/*.json` may reference `.agent/references/` paths
  - **Mitigation**: Audit and update JSON indexes after move
- **Risk**: Cursor/Windsurf may not follow `@AGENTS.md` import syntax
  - **Mitigation**: Platform pointer files include explicit "Read AGENTS.md" instruction

## Sources & References

### Internal References
- Current mode router: `.agent/SKILL.md:1-228`
- Current entry stub: `.agent/AGENT.md:1-5`
- Current references: `.agent/references/` (16 files to move)
- Current platform integration: `.agent/references/platform-integration.md:1-33`
- Existing plan convention: `docs/plans/2026-03-17-001-feat-toolkit-ia-revision-plan.md`

### External References
- Compound engineering playbook (cornerstone project)
- Compound engineering guide: https://every.to/guides/compound-engineering
- Anthropic context engineering: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- Claude Code skills docs: https://code.claude.com/docs/en/skills
- Claude Code best practices: https://code.claude.com/docs/en/best-practices
