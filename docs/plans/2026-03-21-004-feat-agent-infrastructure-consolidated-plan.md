---
title: "feat: Consolidated agent infrastructure — AGENTS.md, docs, skills, compound loop"
type: feat
status: active
date: 2026-03-21
supersedes:
  - docs/plans/2026-03-21-001-feat-agents-md-compound-loop-agent-skills-plan.md
  - docs/plans/2026-03-21-002-feat-skill-taxonomy-and-reference-mapping-plan.md
  - docs/plans/2026-03-21-003-refactor-docs-directory-consolidation-plan.md
---

# Consolidated Agent Infrastructure for plus-one

## Overview

Consolidate all agent documentation, design system knowledge, and project context into a single `docs/` tree. Eliminate the current three-way split (`packages/plus-ds/guidelines/`, `.agent/references/`, proposed `docs/agent-context/`). Add AGENTS.md as the cross-agent entry point, agent-agnostic skills under `.agent/skills/`, and the compound learning loop.

## Problem Statement

Design system knowledge lives in three overlapping locations:

| Location | Files | Purpose |
|----------|-------|---------|
| `packages/plus-ds/guidelines/` | 16 files | Human-readable DS docs |
| `.agent/references/` | 16 files | Agent-optimized DS guidance |
| Proposed `docs/agent-context/` | New files | Project context for agents |

Key overlaps:
- `guidelines/overview-components.md` ↔ `references/components-guide.md`
- `guidelines/design-tokens/*.md` ↔ `references/tokens-guide.md`
- `guidelines/guides/figma-workflow.md` ↔ `references/integrations-guide.md`
- `guidelines/guides/Storybook.md` ↔ `references/implementation-guide.md`
- `guidelines/develop-README.md` ↔ `references/local-preview-runbook.md`

Additionally:
- No AGENTS.md cross-agent entry point
- No compound loop (no `docs/solutions/`)
- No invocable skills (no `/po:xxx` commands)
- No memory system
- `.agent/AGENT.md` and `.agent/SKILL.md` are separate files that should be one
- **No product landscape documentation** — agents have zero context about PLUS users (tutors, students, supervisors), features (sessions, reflections, training, admin dashboards), user flows, or domain terminology. This is critical for making good naming, structure, and UX decisions.

## Proposed Solution

### Target Architecture

```
AGENTS.md                           (THE entry point — all agents read this)
CLAUDE.md                           (@AGENTS.md pointer)
cursorrules.md                      (AGENTS.md pointer)

docs/
├── design-system/                  (ALL DS knowledge — single source of truth)
│   ├── overview.md                 (what the DS is, foundations, setup)
│   ├── components.md               (inventory, discovery process, import conventions)
│   ├── tokens.md                   (token system, values, sync workflow)
│   ├── modes/                      (agent workflow modes)
│   │   ├── learning.md
│   │   ├── maintaining.md
│   │   ├── consulting.md
│   │   ├── iteration.md
│   │   └── finalization.md
│   ├── guides/                     (how-to references)
│   │   ├── figma-workflow.md
│   │   ├── storybook.md
│   │   ├── implementation.md
│   │   └── local-preview.md
│   ├── maintenance/                (keeping the DS healthy)
│   │   ├── runbook.md              (from references/maintenance.md — alignment runbook)
│   │   ├── sync-checklist.md
│   │   └── scripts.md
│   ├── workflows/                  (consumer + contributor guides)
│   │   ├── consumer.md
│   │   └── contributor.md
│   ├── layout-grid.md
│   ├── icons.md
│   └── packaging.md
├── project/                        (project-wide context)
│   ├── product-landscape.md        (users, features, flows, domain terms, metrics, direction)
│   ├── conventions.md              (file naming, imports, git, gotchas)
│   └── setup-guide.md             (onboarding: recommended CE skills, MCP setup, platform config)
├── solutions/                      (compound loop)
│   └── README.md                   (template + categories)
├── plans/                          (existing — unchanged)
└── ideation/                       (existing — unchanged)

.agent/
├── skills/                         (agent-agnostic invocable skills)
│   ├── po-prototype/
│   │   ├── SKILL.md
│   │   ├── references/
│   │   ├── examples/
│   │   └── scripts/
│   ├── po-compound/
│   │   ├── SKILL.md
│   │   ├── references/
│   │   ├── examples/
│   │   └── scripts/
│   ├── po-review/
│   │   ├── SKILL.md
│   │   ├── references/
│   │   ├── examples/
│   │   └── scripts/
│   └── po-post/
│       ├── SKILL.md
│       ├── references/
│       ├── examples/
│       └── scripts/
└── assets/                         (JSON indexes — unchanged)
    ├── README.md                   (asset policy)
    ├── components-index.json
    ├── tokens-index.json
    ├── foundations-index.json
    ├── examples-index.json
    ├── patterns-index.json
    ├── integrations-index.json
    └── index-manifest.json
```

### What Gets Eliminated

| File/Directory | Action |
|----------------|--------|
| `.agent/AGENT.md` | Removed — replaced by AGENTS.md |
| `.agent/SKILL.md` | Removed — mode routing moves to AGENTS.md, mode details to `docs/design-system/modes/` |
| `.agent/references/` (entire directory) | Removed — content merged into `docs/design-system/` |
| `packages/plus-ds/guidelines/` | Removed — content merged into `docs/design-system/` |

### What Gets Created

| File | Source | Purpose |
|------|--------|---------|
| `AGENTS.md` | New + SKILL.md mode routing | Cross-agent entry point |
| `CLAUDE.md` | New | `@AGENTS.md` pointer |
| `docs/design-system/overview.md` | Merge: `guidelines/Guidelines.md` + `guidelines/overview-setup.md` + `references/foundations-guide.md` | DS foundations |
| `docs/design-system/components.md` | Merge: `guidelines/overview-components.md` + `references/components-guide.md` + `guidelines/reference/component-index.md` | Component inventory + discovery |
| `docs/design-system/tokens.md` | Merge: `guidelines/design-tokens/*.md` + `references/tokens-guide.md` | Token system (all values + workflow) |
| `docs/design-system/modes/*.md` | Move from `references/` | 5 mode guides (cleaned up) |
| `docs/design-system/guides/figma-workflow.md` | Merge: `guidelines/guides/figma-workflow.md` + `references/integrations-guide.md` | Figma integration |
| `docs/design-system/guides/storybook.md` | From `guidelines/guides/Storybook.md` | Storybook workflow |
| `docs/design-system/guides/implementation.md` | From `references/implementation-guide.md` | Implementation patterns + approach selection |
| `docs/design-system/guides/local-preview.md` | Merge: `guidelines/develop-README.md` + `references/local-preview-runbook.md` | Dev server + preview |
| `docs/design-system/maintenance/sync-checklist.md` | Move from `references/` | Token sync procedure |
| `docs/design-system/maintenance/scripts.md` | Move from `references/script-inventory.md` | Script reference |
| `docs/design-system/maintenance/runbook.md` | Move from `references/maintenance.md` | DS alignment runbook |
| `docs/design-system/workflows/consumer.md` | Move from `guidelines/workflows/workflow-consumer.md` | Using the DS as a consumer |
| `docs/design-system/workflows/contributor.md` | Move from `guidelines/workflows/workflow-contributor.md` | Contributing to the DS |
| `docs/design-system/layout-grid.md` | Move from `guidelines/` | Grid system |
| `docs/design-system/icons.md` | Move from `guidelines/overview-icons.md` | Icon usage |
| `docs/design-system/packaging.md` | Move from `guidelines/` | Build/publish |
| `docs/project/product-landscape.md` | New (from Notion research) | Product overview, users, features, flows, domain terms |
| `docs/project/conventions.md` | New | File naming, imports, git, gotchas |
| `docs/project/setup-guide.md` | New + from `references/platform-integration.md` | Onboarding: CE skills, MCP setup, platform config |
| `docs/solutions/README.md` | New | Compound loop template |

---

## AGENTS.md Design

~100-120 lines. Contains:

### Sections

1. **Voice** — personality, push-back permission, cite-sources culture
2. **Product Context** — points to `docs/project/product-landscape.md`
3. **Design System** — brief mode routing (the 5 modes with inference signals), points to `docs/design-system/` for details
4. **Conventions** — points to `docs/project/conventions.md`
5. **Forbidden Patterns** (inline — adapted from SKILL.md's 11 critical rules):
   - Never hardcode colors, spacing, typography, radius, or elevation — use tokens
   - Never skip reading component source + story + styles before using unfamiliar components
   - Never reach for generic framework primitives when a PLUS component/spec exists
   - Never implement from Figma without fetching design context + screenshot first
   - Never install packages without user approval
   - Never introduce non-Bootstrap UI frameworks
   - Never deep-import from `packages/plus-ds/src/` — use barrel exports via `@tutors.plus/design-system`
   - Never duplicate existing components — check `.agent/assets/components-index.json`
   - Never edit generated token files — run `npm run generate:tokens` after changes
   - Never skip Storybook validation when component behavior is touched
   - Always confirm implementation plan before large or risky edits
6. **Skills** — table of `/po:xxx` skills with descriptions
7. **Learnings** — check `docs/solutions/` before work, document after
8. **Recommended Setup** — points to `docs/project/setup-guide.md`
9. **Commands** — table of npm scripts:

| Command | What it does |
|---------|-------------|
| `npm run dev` | Vite dev server (port 3000) |
| `npm run storybook` | Storybook dev server (port 6006) |
| `npm run build` | Production build (Vite) |
| `npm run build-storybook` | Build static Storybook site |
| `npm run sync:tokens` | Sync tokens from Figma |
| `npm run generate:tokens` | Generate SCSS/JS from token source |
| `npm run dev:home-redesign` | Home redesign prototype server |
| `npm run dev:monthly-report` | Monthly report prototype server |

> Note: No `lint` script exists yet. `test` is a placeholder. These should be added as the project matures.

### Progressive Loading

AGENTS.md includes a loading order table (adapted from current SKILL.md):

| Trigger | Load |
|---------|------|
| Any work | `docs/project/product-landscape.md` (skim for domain context) |
| Design system work | `docs/design-system/overview.md` + relevant mode file |
| Token/color/spacing questions | `docs/design-system/tokens.md` |
| Figma link or MCP tools | `docs/design-system/guides/figma-workflow.md` |
| Component selection | `docs/design-system/components.md` |
| Build/preview questions | `docs/design-system/guides/local-preview.md` |
| Exact file paths needed | `.agent/assets/*-index.json` |
| Before starting work | `docs/solutions/` (check for relevant past learnings) |

---

## Skills Design

### `/po:prototype` — Scaffold and build a playground prototype

**When to use**: Creating new feature prototypes or experiments in `playground/`

**Skill-specific references** (in `references/`):
- `tool-selection-guide.md` — When to use Figma MCP vs Stitch MCP vs hand-code. Decision tree for fidelity level → tool choice
- `problem-approach.md` — How to think about tackling prototype problems: start with structure, then data, then interaction, then polish

**Examples** (in `examples/`):
- Example prototype directory structure
- Example vite.config.js with aliases

**Scripts** (in `scripts/`):
- Scaffold script (copy template, set up config)

**Phases**:
1. **Scope** — Feature purpose, owner, fidelity. Check `playground/templates/` for starters
2. **Plan** — Which DS components? What data shape? What interactions?
3. **Build** — Scaffold from template, implement with DS components + tokens
4. **Validate** — Imports resolve? Tokens used? No hardcoded values? Storybook preview works?
5. **Document** — Update prototype registry

### `/po:compound` — Document learnings after work

**When to use**: After fixing bugs, discovering gotchas, or completing significant work

**Skill-specific references** (in `references/`):
- `solution-template.md` — YAML frontmatter template with categories
- `extraction-guide.md` — How to decide if a learning should escalate to AGENTS.md forbidden patterns or `conventions.md` gotchas

**Examples** (in `examples/`):
- Example solution doc

**Phases**:
1. **Capture** — What was done, what broke, what was learned
2. **Write** — Create solution doc in `docs/solutions/{category}/` with frontmatter
3. **Escalate** — Check if learning warrants updating AGENTS.md or conventions.md
4. **Update** — Apply escalations if warranted

### `/po:review` — Review work against DS conventions

**When to use**: Before shipping, as a quality gate

**Skill-specific references** (in `references/`):
- `review-checklist.md` — Token compliance, component reuse, import patterns, accessibility, forbidden pattern check

**Scripts** (in `scripts/`):
- Lint/validation script that checks for hardcoded colors, wrong imports, etc.

**Phases**:
1. **Scan** — Identify changed files
2. **Check** — Run checklist against each file
3. **Report** — Pass/fail with specific line references
4. **Fix** — Auto-fix what's possible, escalate what isn't

### `/po:post` — Post project to marketplace

**When to use**: After completing a prototype or feature, post it to the marketplace for team visibility

**Skill-specific references** (in `references/`):
- `marketplace-format.md` — Required fields, screenshot specs, description guidelines
- `marketplace-api.md` — How to submit (endpoint, format, auth)

**Examples** (in `examples/`):
- Example marketplace entry

**Phases**:
1. **Gather** — Collect project metadata, screenshots, description
2. **Format** — Structure for marketplace requirements
3. **Preview** — Show formatted entry for approval
4. **Submit** — Post to marketplace
5. **Verify** — Confirm listing is live

---

## `docs/project/product-landscape.md` Design

The product landscape is the most critical doc — it gives agents the domain context to make good naming, structure, and UX decisions. Built from Notion research (Phase 0) + codebase exploration.

### Preliminary Sections

**1. What is PLUS?**
- Tutoring management platform connecting tutors with students through structured sessions
- Core loop: schedule sessions → track attendance/engagement → reflect → improve through training
- Serves schools/organizations with supervisor oversight and analytics

**2. Users & Roles**

| Role | Primary Goal | Key Workflows |
|------|-------------|---------------|
| **Tutor** | Deliver effective tutoring | Manage sessions, track attendance/engagement, complete reflections, take training |
| **Student** | Receive tutoring | Attend sessions, get tracked on engagement |
| **Supervisor** | Monitor tutor quality | View performance dashboards, handle alerts, track training progress |
| **Admin** | Manage platform | Group/school management, system-wide reporting, tutor/student assignment |

**3. Feature Map**

| Area | Features | Status |
|------|----------|--------|
| **Home** | Skills radar, weekly load, student momentum, personalized training | Prototyped |
| **Toolkit > Sessions** | Session list, detail, attendance, engagement, student dashboard | Prototyped |
| **Toolkit > Reflections** | Post-session reflection, archive, filters | Prototyped |
| **Toolkit > Students** | Cross-session student roster, student detail | Planned (IA revision) |
| **Training** | Lessons, onboarding modules, progress tracking | Spec'd |
| **Admin > Tutor Performance** | Attendance/sign-up rate, sortable table, export | Prototyped |
| **Admin > Training Progress** | By-tutor/by-lesson toggle, completion/accuracy metrics | Prototyped |
| **Admin > Status & Warnings** | Alert indicators, at-risk tutors | Spec'd |
| **Admin > Session/Group/Student** | Session scheduling, group management, student admin | Spec'd |

**4. Core User Flows**
- **Session Lifecycle**: Create session → Assign tutors/students → In-session tracking → Post-session reflection
- **Training Progression**: Onboarding → Lessons → Badge completions → Performance improvement
- **Performance Monitoring**: Dashboard overview → Drill-down by tutor → Alerts → Intervention
- **Toolkit Navigation**: Sidebar categories → Spawned sub-tabs for detail views → Dismissible on session end

**5. Domain Terminology**

| Term | Meaning |
|------|---------|
| Session | A scheduled tutoring appointment with assigned tutor(s) and student(s) |
| Reflection | Post-session guided self-assessment by tutor |
| Call-Off | Session cancellation with reason tracking |
| Sign-Up | Recurring or one-time session registration |
| Toolkit | Primary workspace hub: sessions, students, reflections |
| Engagement | In-session student participation (1-5 scale) |
| Badge | Training achievement earned upon lesson completion |

**6. Key Metrics**
- Attendance rate (%), Sign-up rate (%), Completion rate (training), Engagement scale (1-5), Tutoring load (hours/week), Badge completions

**7. Product Direction** (from ideation docs + Notion)
- Sidebar IA revision: hierarchical navigation with spawned sub-tabs
- AI Research Assistant: embedded analytics chat for supervisors
- Multi-tier Reflections: micro-notes → guided chat → archive
- Docked Student Context Panel: replace modal with persistent side panel

**8. Notion Sources** (authoritative, fetch during Phase 0)
- Design HQ: `https://www.notion.so/plus-tutors/Design-HQ-7965d76a998e47c19f11aef21ae1ab80`
- Design Cards DB: `https://www.notion.so/plus-tutors/e3ef0e5a323c4a39a706f2842164bdc3?v=6360bd0ad95347ce91b1355a0d14a502`
- Tutor Onboarding: `https://plus-tutors.notion.site/Tutor-Onboarding-Material-26fb7cca49828000952fd7b346d1b09c`

> **Note**: This is the preliminary structure. Phase 0 will enrich every section with authoritative data from Notion. The codebase prototypes provide implementation context but Notion is the source of truth for product intent.

---

## `docs/project/setup-guide.md` Design

This is the onboarding doc. Sections:

### Recommended Compound Engineering Skills
```
Install these CE skills for the full workflow:
- /ce:plan     — Create implementation plans
- /ce:work     — Execute plans
- /ce:review   — Multi-agent code review
- /ce:compound — Document learnings
- /ce:brainstorm — Explore requirements
```

### MCP Server Setup
```
Required:
- Figma MCP — Design-to-code workflows (get_design_context, get_screenshot)

Recommended:
- Stitch MCP — Wireframe generation for consulting/iteration
- Playwright MCP — Browser automation and testing
```

### Platform Configuration
```
Claude Code:  CLAUDE.md → @AGENTS.md (already set up)
Cursor:       cursorrules.md → AGENTS.md pointer (already set up)
Windsurf:     Create .windsurfrules → AGENTS.md pointer
```

---

## Migration Plan

### Phase 0: Product Research (Notion)
**Goal**: Build the product landscape doc from authoritative Notion sources — this is the foundation everything else references.

1. Fetch and review the Design HQ hub: `https://www.notion.so/plus-tutors/Design-HQ-7965d76a998e47c19f11aef21ae1ab80`
2. Fetch and review every design card from the design DB: `https://www.notion.so/plus-tutors/e3ef0e5a323c4a39a706f2842164bdc3?v=6360bd0ad95347ce91b1355a0d14a502`
3. Fetch and review Tutor Onboarding Material: `https://plus-tutors.notion.site/Tutor-Onboarding-Material-26fb7cca49828000952fd7b346d1b09c`
4. Cross-reference with existing codebase prototypes (`playground/prototyping/`) and specs (`packages/plus-ds/src/specs/`) for implementation status

**Extract and document**:
- **Users & Roles**: Tutors, Students, Supervisors/Admins — what each role does, their primary workflows
- **Core Entities**: Sessions, Reflections, Training/Lessons, Groups, Sign-Ups, Call-Offs, Reports
- **Feature Map**: All platform features organized by area (Home, Toolkit, Training, Admin) with current status (spec'd, prototyped, shipped)
- **User Flows**: Key end-to-end journeys (session lifecycle, reflection flow, training progression, admin monitoring)
- **Domain Terminology**: Canonical terms and their meanings (e.g., "Call-Off" = session cancellation, "Toolkit" = sessions/students/reflections hub)
- **Product Direction**: Upcoming changes (sidebar IA revision, AI research assistant, multi-tier reflections)
- **Key Metrics**: What the platform measures (attendance rate, sign-up rate, completion rate, engagement scale)

**Output**: `docs/project/product-landscape.md` — the single authoritative product context doc for all agents.

### Phase 1: Create new structure
1. Create `AGENTS.md` at project root
2. Create `CLAUDE.md` (`@AGENTS.md`)
3. Create `docs/project/product-landscape.md` (from Phase 0 research)
4. Create `docs/project/conventions.md`
5. Create `docs/project/setup-guide.md`
6. Create `docs/solutions/README.md`

### Phase 2: Merge design system docs
7. Create `docs/design-system/` directory structure
8. Merge `packages/plus-ds/guidelines/*` + `.agent/references/*` into `docs/design-system/`
   - Consolidate overlapping content (prefer the more detailed version, add agent-specific token estimates)
   - Each merged file keeps the `<!-- ~NNN tokens -->` comment for progressive loading
9. Move mode files to `docs/design-system/modes/`

### Phase 3: Create skills
10. Create `.agent/skills/po-prototype/` with full structure
11. Create `.agent/skills/po-compound/` with full structure
12. Create `.agent/skills/po-review/` with full structure
13. Create `.agent/skills/po-post/` with full structure

### Phase 4: Clean up and rewire
14. Remove `.agent/AGENT.md`
15. Remove `.agent/SKILL.md`
16. Remove `.agent/references/` (entire directory)
17. Remove `packages/plus-ds/guidelines/` (entire directory)
18. Update `cursorrules.md` to point to AGENTS.md
19. Create `.windsurfrules` pointing to AGENTS.md (for Windsurf compatibility)
20. Update `.agent/assets/README.md` if it references `.agent/references/` paths
21. Update `.agent/assets/index-manifest.json` if it references old paths
22. Grep for any remaining cross-references to removed paths and fix them

### Phase 5: Initialize memory system
23. Create memory files in `~/.claude/projects/` for user profile, project context, agent architecture feedback

---

## Acceptance Criteria

### Entry Point
- [ ] `AGENTS.md` exists at project root with voice, mode routing, forbidden patterns, commands, skills table, progressive loading order
- [ ] `CLAUDE.md` exists as `@AGENTS.md` pointer
- [ ] `cursorrules.md` points to AGENTS.md

### Docs Consolidation
- [ ] `docs/design-system/` is the single home for ALL design system knowledge
- [ ] No design system docs remain in `packages/plus-ds/guidelines/`
- [ ] No design system docs remain in `.agent/references/`
- [ ] Each doc has `<!-- ~NNN tokens -->` comment for progressive loading
- [ ] Zero content loss — all knowledge from guidelines/ and references/ is preserved in docs/

### Project Context
- [ ] `docs/project/product-landscape.md` covers: users & roles, feature map with status, core user flows, domain terminology, key metrics, product direction, Notion source links
- [ ] `docs/project/conventions.md` covers file naming, imports, git, docs pipeline, gotchas
- [ ] `docs/project/setup-guide.md` covers CE skills, MCP setup, platform config

### Skills
- [ ] `.agent/skills/po-prototype/` has SKILL.md + references/ + examples/ + scripts/
- [ ] `.agent/skills/po-compound/` has SKILL.md + references/ + examples/ + scripts/
- [ ] `.agent/skills/po-review/` has SKILL.md + references/ + examples/ + scripts/
- [ ] `.agent/skills/po-post/` has SKILL.md + references/ + examples/ + scripts/

### Compound Loop
- [ ] `docs/solutions/README.md` documents template, categories, escalation rules

### Cleanup
- [ ] `.agent/AGENT.md` removed
- [ ] `.agent/SKILL.md` removed
- [ ] `.agent/references/` removed
- [ ] `packages/plus-ds/guidelines/` removed

### Verification
- [ ] Fresh Claude Code session auto-loads CLAUDE.md → AGENTS.md with correct context
- [ ] `/po:prototype` skill is invocable
- [ ] Mode routing still works (ask "help me learn about Button component" → Learning mode)
- [ ] Progressive loading works (token questions load tokens.md, not everything)

## Sources & References

### Internal
- Existing `.agent/SKILL.md`: mode routing, progressive loading, critical rules
- Existing `.agent/references/`: 16 guide files to merge
- Existing `packages/plus-ds/guidelines/`: 16 guideline files to merge
- Existing `docs/ideation/2026-03-17-toolkit-ia-revision-ideation.md`: product direction
- Existing `playground/prototyping/`: feature prototypes revealing product features

### Product (Notion — to fetch in Phase 0)
- Design HQ: https://www.notion.so/plus-tutors/Design-HQ-7965d76a998e47c19f11aef21ae1ab80
- Design Cards DB: https://www.notion.so/plus-tutors/e3ef0e5a323c4a39a706f2842164bdc3?v=6360bd0ad95347ce91b1355a0d14a502
- Tutor Onboarding: https://plus-tutors.notion.site/Tutor-Onboarding-Material-26fb7cca49828000952fd7b346d1b09c

### External
- Coding Agent Grounding Playbook: `docs/solutions/agent-infrastructure/coding-agent-grounding-playbook.md` (from cornerstone)
- Compound Engineering: https://every.to/guides/compound-engineering
- Anthropic best practices: Claude Code skills structure, CLAUDE.md patterns, context engineering

---

## Review Notes (2026-03-21)

### Issues Found & Fixed

1. **Content loss: `workflows/workflow-consumer.md` and `workflows/workflow-contributor.md`** — These 2 guideline files were not accounted for in the target architecture. Added `docs/design-system/workflows/` directory.

2. **Duplicate merge source: `references/implementation-guide.md`** — Was listed as merging into BOTH `guides/storybook.md` AND `guides/implementation.md`. Fixed: storybook.md comes from `guidelines/guides/Storybook.md` only; implementation.md comes from `references/implementation-guide.md` only.

3. **Missing file: `references/maintenance.md`** — This is the DS alignment runbook (distinct from `maintaining.md` which is the Maintaining Mode guide). Added `docs/design-system/maintenance/runbook.md`.

4. **Forbidden patterns too few** — Plan had 6 rules but SKILL.md has 11 critical rules. Expanded to 11 items covering: token usage, component reading, PLUS-first, Figma-first, package approval, no non-Bootstrap frameworks, barrel exports, no duplicates, token generation, Storybook validation, confirm before risky edits.

5. **Commands table inaccurate** — Plan listed `npm run lint` (doesn't exist) and missed `npm run storybook`, `npm run build-storybook`. Fixed with actual script inventory. Added note that lint/test are placeholders.

6. **AGENTS.md line estimate** — 80 lines is too low given 11 forbidden patterns + commands table + progressive loading + skills table + mode routing. Updated to ~100-120 lines.

7. **Target tree annotation stale** — `product-landscape.md` description said "team, stack, deployment" but actual content is "users, features, flows, domain terms, metrics, direction". Fixed.

8. **Missing `.agent/assets/README.md`** — Asset policy file was not listed in target tree. Added.

9. **Missing `.windsurfrules`** — Setup guide mentions creating one but migration plan didn't include the step. Added to Phase 4.

10. **Missing cross-reference cleanup** — After removing `.agent/references/` and `packages/plus-ds/guidelines/`, any files that reference those paths need updating. Added grep-and-fix step to Phase 4.

11. **Progressive loading table missing product context** — Added "Any work → product-landscape.md" and "Before starting work → docs/solutions/" triggers.

### Verified Correct

- File counts: 16 guidelines, 16 references ✓
- Superseded plans: all 3 exist on disk ✓
- Overlap claims: all 5 pairs confirmed via file listing ✓
- Mode names: Learning, Maintaining, Consulting, Iteration, Finalization ✓
- Asset files: 7 JSON + 1 README ✓
- Import conventions: `@` → `packages/plus-ds/src`, `@tutors.plus/design-system` for public ✓
- Token scripts: `sync:tokens` and `generate:tokens` confirmed ✓
- `.agent/AGENT.md` and `.agent/SKILL.md` both exist ✓
- `.agent/maintaining.md` ≠ `.agent/maintenance.md` (mode guide vs runbook) ✓

### Open Questions for Implementation

1. **Skill naming convention**: Should skills use hyphens (`po-prototype`) or colons (`po:prototype`) in the `name:` frontmatter? Colons match the `/ce:plan` convention but may have filesystem implications for the directory name. Directory should use hyphens; YAML `name:` field can use colons.

2. **`references/index.md` replacement**: The current index.md is a TOC of all references. After migration, do we need an equivalent `docs/design-system/index.md`? Recommended: yes, create one as a loading guide for agents.

3. **`packages/plus-ds/guidelines/` removal — BLOCKER**: `packages/plus-ds/package.json` includes `"guidelines"` in its `files` field, meaning guidelines/ is **published with the npm package**. Options:
   - (a) Remove `"guidelines"` from `files` and move everything to `docs/design-system/` — consumers lose bundled docs
   - (b) Keep `guidelines/` as thin pointers/symlinks to `docs/design-system/` — maintains npm compat
   - (c) Keep `guidelines/` as-is for the npm package but treat `docs/design-system/` as the canonical agent-facing version — accepts the duplication as a packaging concern
   - **Recommended**: Option (a) — guidelines are dev docs, not runtime. Consumers can read docs/ from the repo.

4. **`.agent/assets/*.json` path references**: Multiple asset index files reference `packages/plus-ds/guidelines/` and `.agent/references/` paths:
   - `integrations-index.json` → references `guidelines/guides/figma-workflow.md` and `references/integrations-guide.md`
   - `foundations-index.json` → references `guidelines/`
   - `components-index.json` → references `guidelines/overview-components.md` and `guidelines/reference/component-index.md`
   - `patterns-index.json` → references `references/tokens-guide.md`, `guidelines/guides/Storybook.md`, `guidelines/guides/figma-workflow.md`
   - `README.md` → references `.agent/references/`
   - **All of these must be updated to `docs/design-system/` paths during Phase 4.**
