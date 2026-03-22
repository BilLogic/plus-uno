---
title: "Major repo restructure: AGENTS.md, docs consolidation, flat playground, marketplace"
category: agent-infrastructure
date: 2026-03-22
tags:
  - restructure
  - agents-md
  - docs-consolidation
  - marketplace
  - skills
  - compound-engineering
  - design-system
module: repo-wide
symptom: "Agent sessions started cold with no project context. DS docs split across 3 locations. Playground grouped by creator. No cross-agent entry point. No compound loop."
root_cause: "Organic growth created fragmentation: .agent/references/ (16 files), packages/plus-ds/guidelines/ (16 files), and no centralized entry point. Playground used creator-based grouping that didn't scale. No AGENTS.md meant platform files pointed directly to SKILL.md (DS-only, not project-wide)."
---

# Major Repo Restructure: AGENTS.md, Docs Consolidation, Flat Playground, Marketplace

## Problem

The plus-one repo had grown organically with several structural issues:

1. **No cross-agent entry point** — platform files (CLAUDE.md, .windsurfrules, cursorrules.md) pointed directly to `.agent/SKILL.md`, which only covers design system routing. Non-DS tasks had no agent guidance.
2. **DS docs in 3 places** — `.agent/references/` (16 agent-optimized guides), `packages/plus-ds/guidelines/` (16 human-readable docs), and no product-level context anywhere.
3. **Unnecessary npm package wrapper** — `packages/plus-ds/` structured for publishing but never published. Added needless nesting.
4. **Creator-grouped playground** — `playground/{owner}/{name}/` didn't scale, caused naming collisions (both bill and victor had `sessions/`), and made marketplace integration awkward.
5. **No compound loop** — learnings from bugs and gotchas weren't captured between sessions.
6. **Phantom skill references** — AGENT.md listed 4 skills (learn-plus, design-consulting, building, maintaining) that had no SKILL.md files.
7. **No product context** — agents had no knowledge of the PLUS tutoring platform, its users, features, or flows.

## Solution

### Phase 0: Product Research (Notion MCP)
- Fetched 16 Notion pages covering PRDs, training, help center, session flows, escalation
- Created 4 product landscape docs: `plus-app.md` (mission + AI loop), `plus-app-users.md`, `plus-app-features.md`, `plus-app-flows.md`
- Incorporated marketing website content (mission, $2000 vs $20, service system)

### Phase 1: Flatten packages/ → design-system/
- `git mv packages/plus-ds design-system`
- Updated 83 file references across vite configs, storybook, scripts, agent docs
- Simplified package.json (`private: true`, stripped all npm publishing fields)
- Fixed 2 pre-existing bugs found during migration (FillInWithModals import path, SessionFillIns export name mismatch)

### Phase 2: Flatten playground
- Moved 21 prototypes from `playground/{owner}/{name}/` to `playground/{name}/`
- Renamed collisions: `bill/sessions` → `in-session-ux`, `victor/sessions` → `session-management`
- Removed `playground/Bill/` (confirmed duplicate), `playground/Ashley/` (storybook-ai-agent moved first)
- Removed `design-system/src/specs/` (redundant with specs + Storybook)
- Removed playground stories from Storybook (prototypes live in marketplace only)
- Updated marketplace data with all 21 prototypes + 4 new split entries from home-redesign

### Phase 3: Create AGENTS.md
- Created ~120-line cross-agent entry point with: voice, product context pointers, 6-mode routing table, 14 forbidden patterns, 8 skills table, commands, progressive loading triggers
- Rewired CLAUDE.md → `@AGENTS.md`, .windsurfrules, cursorrules.md, .cursor/rules/plus-agent.mdc

### Phase 4: Project docs + foundations
- `docs/project/` — plus-one.md (repo), conventions.md, setup-guide.md
- `docs/foundations/` — terminology.md, tech-stack.md, context-levels.md (replaces phantom `docs/foundations/`)
- `docs/solutions/README.md` — compound loop template

### Phase 5: Merge DS docs
- Merged 33 source files (16 guidelines + 17 references) into 23 consolidated docs under `docs/design-system/`
- 6 mode files, 4 guides, 3 maintenance docs, 2 workflows, 3 merged overviews, 5 standalone

### Phase 6: Create 7 new skills
- Mode skills: learn-plus, design-consulting, building, maintaining (fix phantom refs)
- Workflow skills: po-prototype, po-compound, po-review
- Each with SKILL.md + subdirectory structure

### Phase 7: Cleanup
- Removed `.agent/references/` (17 files) and `docs/design-system/` (16 files)
- Updated AGENT.md, SKILL.md, all asset JSON files with new paths
- Grepped and fixed all stale path references

### Phase 8: Memory system
- Created MEMORY.md index, user_bill.md, project_plus_one.md, feedback_agent_architecture.md

### Marketplace improvements
- Full-page layout (broke out of 1200x800 demo frame)
- Split home-redesign into 7 individual entries (Redesigned Homepage, Tutor Admin, Sessions, Session Reflection, Lessons Simulator, Research Assistant Chat, Monthly Reports)
- Added grid/list view toggle using DS ButtonGroup component
- Replaced raw HTML (input, button) with DS components (Input, Button)
- Added 6 missing prototypes from Victor and Bryan
- Removed DevIndexPage (marketplace handles navigation)
- Total: 25 prototype cards

## Prevention & Best Practices

1. **AGENTS.md is the single entry point** — never put agent instructions only in platform-specific files. All platforms point to AGENTS.md.
2. **Skills go under `.agent/skills/`** — not `.claude/skills/`. Must be agent-agnostic.
3. **All docs under `docs/`** — no separate `guidelines/`, `references/`, or `docs/` directories. One home for documentation.
4. **Flat playground** — project-oriented, not creator-oriented. Creator info is metadata, not directory structure.
5. **FA Free only** — no Pro icons (fa-light, fa-thin, fa-sharp, fa-duotone, fa-grid-2). Use fa-solid, fa-regular, fa-brands.
6. **Use DS components** — never raw HTML when a PLUS component exists. Check PLUS_CHEAT_SHEET.md first.
7. **Compound loop** — after significant work, document in `docs/solutions/`. Periodically extract patterns into AGENTS.md forbidden patterns and conventions.md gotchas.

## Files Created/Modified

| Action | Count | Description |
|--------|-------|-------------|
| Created | 40+ | AGENTS.md, docs/project/*, docs/foundations/*, docs/design-system/*, .agent/skills/*, docs/solutions/* |
| Modified | 90+ | vite configs, storybook, scripts, agent docs, asset JSONs, marketplace, App.jsx |
| Deleted | 33 | .agent/references/*, docs/design-system/*, design-system/src/specs/*, playground/Bill/* |
| Moved | 1100+ | packages/plus-ds → design-system (git mv), playground flatten |

## Commits

14 commits total:
1. `refactor: flatten packages/plus-ds to design-system + add product docs`
2. `refactor: flatten playground to project-oriented structure`
3. `feat: add AGENTS.md cross-agent entry point, rewire all platform files`
4. `docs: add project context, conventions, setup guide, foundations, compound loop`
5. `docs: consolidate design system knowledge into docs/design-system/`
6. `feat: create mode skills, workflow skills for agent system`
7. `chore: remove superseded files, fix all stale path references`
8. `chore: fix remaining stale paths, remove empty packages/`
9. `fix: marketplace landing page + add 6 missing prototypes`
10. `feat: full-page marketplace + split home-redesign into 7 prototypes`
11. `feat: marketplace list view + remove DevIndexPage`
12. `fix: use DS ButtonGroup for view toggle, fix missing grid icon`
13. `fix: replace raw HTML with DS components, document FA Free constraint`
14. `docs: compound learning — repo restructure solution doc`
