---
title: "refactor: Three-Tier Context Architecture — Docs, Knowledge, and Agent Infrastructure"
type: refactor
status: completed
date: 2026-04-11
deepened: 2026-04-11
---

# Three-Tier Context Architecture — Docs, Knowledge, and Agent Infrastructure

## Enhancement Summary

**Deepened on:** 2026-04-11 (2 rounds)
**Round 1 agents:** architecture-strategist, agent-native-architecture, create-agent-skills, spec-flow-analyzer, best-practices-researcher
**Round 2 agents:** spec-flow-analyzer (2nd pass), content-outline-validator, merge-spec-validator
**Fresh critique:** independent reviewer (post-round-1)

### Critical Fixes Applied
1. **Tier 1 budget tightened from 500 → 200 lines** — Anthropic guidance says CLAUDE.md/AGENTS.md should be under 200 lines. Since we use plain "See" references (not `@import`), only AGENTS.md itself counts.
2. **`components-index.json` shared-access conflict resolved** — Forbidden Pattern #11 requires prototype to check it, but plan only placed it in uno-research. Now placed in `docs/context/design-system/` as shared Tier 2 context.
3. **`docs/design-system/components.md` disposition added** — merge into `docs/context/design-system/components/inventory.md`
4. **Existing skill reference files explicitly preserved** — each skill keeps its current references alongside incoming files
5. **Handoff artifact format defined** — YAML frontmatter spec with `from`, `to`, `created`, `status` fields
6. **Handoffs gitignored** — `.agent/handoffs/` is local-only session state, not committed
7. **Entry count corrected** — 21 entries across 4 files (not 23; 2 findings are conventions that merge into coding.md)
8. **Phase 0 added** — commit untracked files before starting
9. **Commit strategy: 3 commits** — moves (A), rewrites+refs+cleanup (B), knowledge content (C)
10. **Copy-paste error fixed** — `learning.md` correctly assigned to `uno-research`, not listed under uno-review header

### Key Architecture Refinements
- **Handoff lifecycle**: gitignored, TTL-based, cleaned by uno-compound
- **Mode-routing disambiguation preserved** in SKILL.md as routing-logic section
- **Skill frontmatter specified**: `allowed-tools`, `disable-model-invocation: true` for side-effect skills, `context: fork` for uno-research
- **SKILL.md 300-line budget** added to prevent bloat after mode absorption
- **loading-order.md becomes three-tier contract doc** — not a routing table (skills own their loading)
- **INDEX.md auto-maintained by uno-compound** — not manually curated
- **Knowledge file split threshold**: domain files split at ~15 entries
- **Tier membership markers**: add `<!-- Tier: 1 -->` or `<!-- Tier: 2 -->` comment to each context file header
- **Post-Phase-9 validation script** added to programmatically verify all path references resolve

### New Considerations Discovered
- `cursorrules.md` and `.cursor/rules/plus-agent.mdc` need path updates (they reference AGENTS.md which is safe, but may contain internal path refs)
- `playground/storybook-ai-agent/` (non-LLM variant) also has hardcoded doc paths — needs Phase 9 coverage
- `context: fork` is appropriate for `uno-research` (isolated exploration) but NOT for `uno-prototype`/`uno-compound` (need conversation history)
- Plain "See" references in AGENTS.md confirmed correct over `@import` for cross-agent compatibility and lazy loading
- `docs/design-system/layout-grid.md` → merge into `foundations/layout.md` (decision made, no longer ambiguous)

---

## Overview

Restructure the plus-uno design kit's documentation, knowledge management, and agent infrastructure to implement a three-tier context loading architecture grounded in research from Anthropic, OpenAI, Google ADK, JetBrains, CrewAI, Phil Schmid, Blake Crosley, and the Compound Designing article.

This plan covers **docs + knowledge + agent structure only**. Skill content revamp (uno-research, uno-plan, pipeline rewrite, compaction protocol) is a separate follow-up.

## Problem Statement

The current `docs/` structure mixes always-loaded context with on-demand references and session artifacts in the same hierarchy. The agent cannot distinguish essential product truth from supplementary guides. Knowledge accumulates in `docs/solutions/` but nothing distills it into indexed, loadable memory. `.agent/assets/` and `.agent/references/` are shared dumping grounds that fight progressive disclosure — files only used by one skill load at the same level as cross-cutting context.

**Symptoms:**
- Agent loads unnecessary context (modes, guides, maintenance docs) when it only needs product truth
- No knowledge compounding — 10 solution docs accumulate but nothing surfaces patterns
- No handoff mechanism between pipeline stages — context window bloats across phases
- `.agent/assets/` referenced 40+ times from scattered locations, creating a fragile web

## Proposed Solution

Implement the three-tier context loading model:

| Tier | What | Where | Loaded | Survives Compact |
|------|------|-------|--------|-----------------|
| **Always-loaded** | Identity, conventions, principles, knowledge index | AGENTS.md plain "See" references to `docs/context/` | Session start | Yes (re-injected) |
| **On-demand** | Skills, detailed context, design system, knowledge entries | `docs/context/`, `docs/knowledge/`, `.agent/skills/*/references/` | Triggered by skill | Partially (5K/skill, 25K cap) |
| **Ephemeral** | Tool outputs, exploration, intermediate reasoning | Context window + `.agent/handoffs/` as bridge | During use | No (observation-masked) |

## Technical Approach

### Phase 0: Prepare Working Tree

Commit the 2 untracked files before any restructuring begins:

```bash
git add design-system/src/specs/Toolkit/in-session/elements/SessionControlsConsolidated/
git add docs/ideation/2026-03-25-skill-documentation-revision-ideation.md
git commit -m "chore: commit untracked files before restructure"
```

**Acceptance:**
- [ ] Git working tree is clean
- [ ] No untracked files remain

### Phase 1: Create Target Directory Structure (No Content Yet)

Create all new directories so subsequent phases can move files into them.

```bash
# docs/context/ tree
mkdir -p docs/context/product
mkdir -p docs/context/design-system/foundations
mkdir -p docs/context/design-system/styles
mkdir -p docs/context/design-system/components
mkdir -p docs/context/conventions

# docs/knowledge/ tree
mkdir -p docs/knowledge/lessons
mkdir -p docs/knowledge/decisions

# .agent/handoffs/ tree (gitignored — local session state)
mkdir -p .agent/handoffs/briefs
mkdir -p .agent/handoffs/plans
mkdir -p .agent/handoffs/reviews
echo ".agent/handoffs/" >> .gitignore

# New skill directories (empty — content in follow-up)
mkdir -p .agent/skills/uno-research/references
mkdir -p .agent/skills/uno-research/examples
mkdir -p .agent/skills/uno-plan/references
mkdir -p .agent/skills/uno-plan/examples
```

**Acceptance:**
- [ ] All directories exist
- [ ] No existing files modified

### Phase 2: Move Product Context → `docs/context/product/`

| Source | Destination | Action |
|--------|------------|--------|
| `docs/project/plus-app.md` | `docs/context/product/plus-app.md` | Move, then slim to ~60-80 line index |
| `docs/project/plus-app-users.md` | `docs/context/product/users.md` | Move + rename |
| `docs/project/plus-app-features.md` | `docs/context/product/features.md` | Move + rename |
| `docs/project/plus-app-flows.md` | `docs/context/product/flows.md` | Move + rename |
| `docs/project/plus-uno.md` | `docs/context/product/plus-uno.md` | Move (repo overview, deployment, team) |
| `docs/project/setup-guide.md` | `docs/setup-guide.md` | Move to docs root (standalone onboarding) |

**Slim `plus-app.md`:** Extract platform integrations table and current product direction into the body of the existing file but trim to essentials — mission (3 sentences), service system diagram, AI+Human loop summary, integrations table, and pointer links to users/features/flows/plus-uno. Remove Notion source links (queried live via MCP). Target: ~60-80 lines.

**Acceptance:**
- [ ] `docs/context/product/` contains 5 files
- [ ] `docs/setup-guide.md` exists at docs root
- [ ] `docs/project/` is empty (delete folder)
- [ ] `plus-app.md` is under 80 lines

### Phase 3: Move Design System Context → `docs/context/design-system/`

#### 3a: Foundations (Layer 0-2: Principles + Rules + Primitives)

| Source | Destination | Action |
|--------|------------|--------|
| NEW | `docs/context/design-system/foundations/principles.md` | Create (see content outline below) |
| NEW | `docs/context/design-system/foundations/accessibility.md` | Create (see content outline below) |
| NEW | `docs/context/design-system/foundations/content-voice.md` | Create (see content outline below) |
| `docs/design-system/architecture.md` | `docs/context/design-system/foundations/layout.md` | Rework (see merge spec below) |
| `docs/design-system/tokens.md` | `docs/context/design-system/foundations/tokens.md` | Rework (see merge spec below) |
| `docs/foundations/context-levels.md` | Merge into `layout.md` | Content absorbed into layout.md |
| `docs/design-system/layout-grid.md` | Merge into `layout.md` | Grid system content absorbed into layout.md |

**Merge spec — `foundations/layout.md`:**
- **Base file:** `docs/design-system/architecture.md`
- **Keep from architecture.md:** Context-level heuristic with token naming (lines 14-19), communication heuristic (lines 21-23), font families table (lines 62-67)
- **Keep from architecture.md:** Shared baseline rules (lines 10-12) — terminology consistency, context-level-first approach
- **Drop from architecture.md:** Setup/installation section (lines 25-95) → moves to `docs/setup-guide.md`
- **Drop from architecture.md:** `<!-- Load for: ... -->` header (lines 1-8) → loading triggers move to loading-order.md
- **Absorb from context-levels.md:** Atomic hierarchy definitions + table (lines 1-16), composition rules (lines 50-58: "start from top, compose upward, never skip levels")
- **Drop from context-levels.md:** Spec directory structure (lines 18-48) → move to `docs/setup-guide.md` as repo orientation
- **Drop from context-levels.md:** Storybook alignment conventions (lines 60-67) → move to `uno-review/references/storybook.md` or `conventions/coding.md`
- **Absorb from layout-grid.md:** Grid system dimensions, column reference values, content width calculation, responsive breakpoints
- **Target:** ~70-90 lines (3 sources combined have ~240 lines; aggressive pruning keeps essential spatial/structural rules)

**Merge spec — `foundations/tokens.md`:**
- **Base file:** `docs/design-system/tokens.md` (currently a 21-line index)
- **Keep:** Non-negotiable rules (lines 12-15), semantic layer decision tree (lines 17-21)
- **Update:** Replace links to `tokens/tokens-color.md` etc. → point to `styles/color.md` etc.
- **Drop:** Nothing — this file is already lean
- **Target:** ~25-30 lines as an overview + decision tree linking to styles/

#### 3b: Styles (Layer 3: Visual Expression)

| Source | Destination | Action |
|--------|------------|--------|
| `docs/design-system/tokens/tokens-color.md` | `docs/context/design-system/styles/color.md` | Move + rename |
| `docs/design-system/tokens/tokens-typography.md` | `docs/context/design-system/styles/typography.md` | Move + rename |
| `docs/design-system/tokens/tokens-elevation.md` | `docs/context/design-system/styles/elevation.md` | Move + rename |
| `docs/design-system/tokens/tokens-spacing.md` | `docs/context/design-system/styles/spacing.md` | Move + rename |
| `docs/design-system/icons.md` | `docs/context/design-system/styles/iconography.md` | Move + rename |

#### 3c: Components (Layer 4-5: Building Blocks + Patterns)

| Source | Destination | Action |
|--------|------------|--------|
| `docs/design-system/component-inventory.md` + `docs/design-system/components.md` | `docs/context/design-system/components/inventory.md` | Move + merge (see merge spec below) |

**Merge spec — `components/inventory.md`:**
- **Base file:** `docs/design-system/component-inventory.md` (351 lines — the comprehensive catalog)
- **Absorb from components.md:** Pattern Pack categorization from Master Component Index (lines 117-178) — adds grouping metadata (Elements, Modals, Cards, Sections, Surfaces, Tables) not present in inventory
- **Absorb from components.md:** "When to Use Each Component" quick-reference table (lines 108-116)
- **Drop from components.md:** Discovery Workflow + anti-hallucination rule (lines 1-22) → already covered by AGENTS.md Forbidden Patterns #4, #5, #11
- **Drop from components.md:** Individual component details (lines 23-107) → duplicates inventory content. On prop conflicts (e.g., Button `style` vs `fill`), **inventory.md is authoritative** — verify against actual `.jsx` source if uncertain
- **Target:** ~370-400 lines (base 351 + Pattern Pack table + "When to Use" table, minus duplicate header content)
- **Note:** This is intentionally a large file — it is THE authoritative component catalog. Size is justified.
| NEW | `docs/context/design-system/components/patterns.md` | Create (see content outline below) |
| `.agent/assets/PLUS_CHEAT_SHEET.md` | `docs/context/design-system/components/cheat-sheet.md` | Move |
| `.agent/assets/PLUS_LAYOUT_CHEAT_SHEET.md` | `docs/context/design-system/components/layout-cheat-sheet.md` | Move |

#### Content Outlines for NEW Files

**`foundations/principles.md`** (~30-40 lines) — **Author with Bill** (most content is new, not extractable):
- PLUS design philosophy: AI augments human judgment, never replaces it *(new — Bill to confirm)*
- Information density: tutors are time-pressured, every pixel earns its place *(new — Bill to confirm)*
- Progressive disclosure: show what matters now, reveal detail on demand *(new)*
- Bootstrap-first: DS components before custom; never introduce non-Bootstrap UI frameworks *(extract from AGENTS.md Forbidden Pattern #6, #9)*
- Compound designing: each iteration should make the next one easier *(from Compound Designing article, external)*
- **Fallback if Bill unavailable:** extract the 15 Forbidden Patterns from AGENTS.md and reframe as positive principles ("Use DS components first" → "Consistency over novelty")

**`foundations/accessibility.md`** (~30-40 lines) — **Author based on WCAG 2.1 AA** (no existing a11y doc in repo to extract from):
- WCAG 2.1 AA as the minimum bar *(new standard declaration — referenced but never codified in repo)*
- Tutor-facing context: used during live sessions, on laptops, often with screenshare *(derivable from product docs)*
- Color contrast: minimum 4.5:1 for text, 3:1 for large text and UI components
- Touch targets: minimum 44x44px for interactive elements
- Keyboard navigation: all interactive elements must be keyboard-accessible
- Screen reader: semantic HTML, ARIA labels for custom components
- Motion: respect `prefers-reduced-motion`, no essential info conveyed only through animation
- Focus management: visible focus indicators on all interactive elements
- **Source:** WCAG 2.1 AA spec applied to PLUS context. Only existing reference: SKILL.md grounding rule #8 ("Include accessibility in finalization work") and `finalization.md` ("Accessibility is mandatory").

**`foundations/content-voice.md`** (~30-40 lines) — **Author with Bill** (no existing voice/tone doc in repo):
- Voice: warm, direct, encouraging — tutors are college students, not enterprise users *(new — Bill to confirm)*
- Tone shifts by context: instructional (training), supportive (in-session), professional (admin) *(new)*
- Action-oriented labels: "Start Session" not "Session Initiation", "Call Off" not "Request Absence" *(derivable from playground prototypes by inspection)*
- Error messages: say what happened, what to do, no blame *(new)*
- Terminology: use PLUS vocabulary (see `docs/context/conventions/terminology.md`) *(valid cross-ref)*
- Capitalization: sentence case for UI labels, title case for page titles only *(new)*
- **Note:** This file requires original authorship. An implementer cannot write it without design leadership input. Mark as draft and iterate.

**`components/patterns.md`** (~60-80 lines) — **Extract from existing code + LAYOUT_CHEAT_SHEET.md:**
- Page layout pattern: `<PageLayout>` wrapper with sidebar + content area *(extract from PLUS_LAYOUT_CHEAT_SHEET.md)*
- Card-based content: `StudentCard`, data cards, info cards — bounded containers *(extract from `design-system/src/specs/`)*
- Form patterns: single-column forms, inline validation, required field indicators *(inspect playground prototypes)*
- Table patterns: sortable columns, pagination, row actions, empty state *(inspect TutorPerformancePage, GroupPerformancePage)*
- Empty state pattern: illustration + message + primary action *(inspect playground prototypes)*
- Loading pattern: skeleton screens for cards, spinners for actions *(inspect playground prototypes)*
- Navigation: sidebar tree nav (3 categories: Toolkit, Training, Admin) *(from ideation/2026-03-17-toolkit-ia-revision)*
- Modal pattern: confirmation dialogs, detail panels, form overlays *(inspect specs/Universal)*
- Responsive behavior patterns *(inspect breakpoint usage across playgrounds)*
- **Source files to examine:** `PLUS_LAYOUT_CHEAT_SHEET.md` (primary), `design-system/src/specs/Universal/`, `design-system/src/specs/Toolkit/`, playground prototypes

**`agent-persona.md`** (~30-40 lines) — **Mostly extractable** (4/8 bullets have direct sources):
- Name: PLUS Design Agent *(new naming decision — confirm with Bill)*
- Specialty: PLUS Design System, not generic web design *(extract: SKILL.md line 10)*
- Stack: React 19, React-Bootstrap 2.10, Bootstrap 5.3, Vite 8, Storybook 10 *(extract: SKILL.md line 11)*
- Vocabulary: use PLUS terminology only *(extract: SKILL.md line 12)*
- Behavioral rules: be precise, cite sources, push back respectfully *(extract: AGENTS.md line 5)*
- Operates via skill pipeline: research → plan → prototype → review → post → compound *(new — from this plan)*
- What it's NOT for: production backend code, deployment, database work *(new — Bill to confirm scope boundary)*
- Decision authority: can make DS-compliant decisions autonomously; escalate product direction changes *(new governance — Bill to confirm)*
- **Source:** AGENTS.md lines 3-5, .agent/SKILL.md lines 8-12. Bullets 6-8 require authorship.

**Acceptance:**
- [ ] `foundations/` has 5 files (principles, accessibility, content-voice, layout, tokens)
- [ ] `styles/` has 5 files (color, typography, elevation, spacing, iconography)
- [ ] `components/` has 4 files (inventory, patterns, cheat-sheet, layout-cheat-sheet)
- [ ] All token files updated to remove `<!-- Load for: ... -->` headers (those move to loading-order.md)
- [ ] Each NEW file covers all bullet points from its content outline

### Phase 4: Move Conventions → `docs/context/conventions/`

| Source | Destination | Action |
|--------|------------|--------|
| `docs/foundations/tech-stack.md` | `docs/context/conventions/tech-stack.md` | Move |
| `docs/project/conventions.md` + 2 others | `docs/context/conventions/coding.md` | Merge (see merge spec below) |
| `docs/foundations/terminology.md` | `docs/context/conventions/terminology.md` | Move |

**Merge spec — `conventions/coding.md`:**
- **Base file:** `docs/project/conventions.md` (82 lines — most comprehensive)
- **Keep from conventions.md:** File naming (lines 3-8), git conventions (lines 38-42), docs pipeline (lines 44-53), known gotchas table (lines 72-82)
- **Keep from conventions.md:** Playground prototype conventions (lines 31-37) → new "## Playground" section
- **Keep from conventions.md:** Token workflow (lines 54-62: Figma → sync → generate → commit) → new "## Token Workflow" section
- **Drop from conventions.md:** Icons section (lines 64-70) — already in AGENTS.md Forbidden Pattern #15
- **Drop from conventions.md:** Import Patterns (lines 10-29) — replaced by import-conventions.md content below
- **Absorb from import-conventions.md:** `@` alias rules, barrel export rules, deep-import prohibition, explicit entry point list (lines 17-19) → new "## Imports" section. Use conventions.md code examples as format, add entry point list from import-conventions.md
- **Absorb from conventions-quick-ref.md:** Token usage correct/incorrect examples (lines 5-36) → new "## Token Usage" section. Drop maintenance rule (line 37-38) — covered by Token Workflow section.
- **Target:** ~90-110 lines

**Acceptance:**
- [ ] `docs/context/conventions/` has 4 files (tech-stack, coding, terminology, integrations)
- [ ] `docs/foundations/` is empty (delete folder)
- [ ] `coding.md` has sections for: File Naming, Imports, Token Usage, Playground, Token Workflow, Git, Docs Pipeline, Known Gotchas

### Phase 5: Create Agent Persona

| Source | Destination | Action |
|--------|------------|--------|
| AGENTS.md voice section + `.agent/SKILL.md` identity section | `docs/context/agent-persona.md` | Create: extract agent identity, specialty, stack, vocabulary, behavioral rules |

This consolidates the scattered identity fragments into one Tier 1 file.

**Acceptance:**
- [ ] `docs/context/agent-persona.md` exists
- [ ] Under 50 lines
- [ ] Covers: what the agent is, what it's good at, what it's not for, behavioral rules

### Phase 6: Create Knowledge Base (executes LAST — see Execution Order Summary)

#### 6a: Seed knowledge/lessons/ from docs/solutions/

Distill 23 findings from the learnings research into 4 domain-grouped files. Each entry follows the atomic format:

```markdown
---
domain: ds-compliance
type: lesson
confidence: high
created: 2026-04-11
tags: [tokens, review]
---

## [2026-03-23] Token drift is real and silent
- **Pattern**: 6 semantic token values drifted from Figma. CSS silently ignores undefined custom properties — no errors, just wrong values.
- **Fix**: Use `get_variable_defs` MCP to spot-check. Grep for old naming patterns to find ghosts.
- **Source**: docs/solutions/integration-issues/design-system-token-audit-figma-code-drift.md
```

| Destination | Entries | Source Findings |
|------------|---------|-----------------|
| `lessons/ds-compliance.md` | 5 | Forbidden patterns, token drift, token workflow, demo frame dimensions, file naming |
| `lessons/integration.md` | 4 | Storybook MDX, Netlify redirects, iframe embedding, Figma MCP constraints |
| `lessons/agent-patterns.md` | 6 | AGENTS.md entry point, progressive loading, agent-agnostic skills, compound loop, skill improvements, rename checklist |
| `lessons/ui-patterns.md` | 4 | React Router v6, Vite over Next.js, marketplace architecture, toolkit IA direction |

Note: 4 findings (mode routing, docs pipeline, file naming conventions, token workflow) are conventions that merge into `docs/context/conventions/coding.md` rather than becoming lesson entries. Total: 19 lesson entries + 4 convention merges = 23 original findings.

#### 6b: Create knowledge/decisions.md

Distill 12 architectural decisions from plans and solutions:

```markdown
## ADR-001: AGENTS.md as single cross-agent entry point
- **Date**: 2026-03-21
- **Status**: Active
- **Context**: Multiple agent platforms (Claude, Cursor, Windsurf) need consistent instructions
- **Decision**: All platforms point to AGENTS.md. Platform-specific files only contain `@AGENTS.md`.
- **Source**: docs/plans/2026-03-21-004-feat-agent-infrastructure-consolidated-plan.md
```

#### 6c: Create remaining knowledge files

| File | Content |
|------|---------|
| `knowledge/INDEX.md` | Routing table: domain, file path, entry count, last updated, top tags |
| `knowledge/preferences.md` | Seed with: "FA Free only", "iframe over proxy", "Vite not Next.js for prototypes", "4-digit numeric IDs not slugs", "cheat sheet is law" |
| `knowledge/ideations.md` | Consolidate from `docs/ideation/` — toolkit IA revision ideas + skill documentation revision ideas |
| `knowledge/changelog.md` | Seed with this restructuring as entry #1 |

**Acceptance:**
- [ ] `knowledge/INDEX.md` exists, lists all knowledge files, and is auto-maintained by `uno-compound`
- [ ] `lessons/` has 4 files with 19 total atomic entries (5+4+6+4; split at ~15 entries per file in future)
- [ ] `decisions.md` has 12 ADR entries (single file, split to folder at 15+)
- [ ] `preferences.md` has 5+ entries
- [ ] `ideations.md` consolidates both ideation files
- [ ] `changelog.md` documents this restructuring
- [ ] All entries have YAML frontmatter (domain, type, confidence, created, tags)

### Phase 7: Redistribute .agent/assets/ and .agent/references/ → Skills

Each asset/reference moves to the skill that uses it. After this phase, `.agent/assets/` and `.agent/references/` are empty.

**Shared index files → `docs/context/design-system/` (Tier 2 shared context, not skill-specific):**

`components-index.json` is referenced by Forbidden Pattern #11 ("check components-index.json first") and needed by BOTH `uno-research` (audit what exists) and `uno-prototype` (verify before building). It is shared context, not a skill reference.

| Source | Destination | Reason |
|--------|------------|--------|
| `.agent/assets/components-index.json` | `docs/context/design-system/components/` | Shared: used by research + prototype + forbidden pattern |
| `.agent/assets/index-manifest.json` | `docs/context/design-system/` | Shared: master index of all indexes |

**→ uno-research/references/ (discovery and audit assets):**

| Source | Destination |
|--------|------------|
| `.agent/assets/foundations-index.json` | `.agent/skills/uno-research/references/` |
| `.agent/assets/patterns-index.json` | `.agent/skills/uno-research/references/` |
| `.agent/references/component-discovery.md` | `.agent/skills/uno-research/references/` |

**→ uno-plan/references/ (consulting mode):**

| Source | Destination |
|--------|------------|
| `docs/design-system/modes/consulting.md` | `.agent/skills/uno-plan/references/` |

**→ uno-prototype/references/ (build assets + modes + guides):**

| Source | Destination |
|--------|------------|
| `.agent/assets/cheat-components.md` | `.agent/skills/uno-prototype/references/` |
| `.agent/assets/cheat-forms.md` | `.agent/skills/uno-prototype/references/` |
| `.agent/assets/cheat-tokens.md` | `.agent/skills/uno-prototype/references/` |
| `.agent/assets/examples-index.json` | `.agent/skills/uno-prototype/references/` |
| `.agent/assets/tokens-index.json` | `.agent/skills/uno-prototype/references/` |
| `.agent/assets/integrations-index.json` | `.agent/skills/uno-prototype/references/` |
| `.agent/references/figma-mcp-guide.md` | `.agent/skills/uno-prototype/references/` |
| `.agent/references/figma-token-mapping.md` | `.agent/skills/uno-prototype/references/` |
| `docs/design-system/modes/prototyping.md` | `.agent/skills/uno-prototype/references/` |
| `docs/design-system/modes/finalization.md` | `.agent/skills/uno-prototype/references/` |
| `docs/design-system/modes/iteration.md` | `.agent/skills/uno-prototype/references/` |
| `docs/design-system/guides/implementation.md` | `.agent/skills/uno-prototype/references/` |
| `docs/design-system/guides/figma-workflow.md` | `.agent/skills/uno-prototype/references/` |
| `docs/design-system/guides/local-preview.md` | `.agent/skills/uno-prototype/references/` |

**→ uno-review/references/ (validation + guides):**

| Source | Destination |
|--------|------------|
| `docs/design-system/guides/storybook.md` | `.agent/skills/uno-review/references/` |

**→ uno-research/references/ (learning mode):**

| Source | Destination |
|--------|------------|
| `docs/design-system/modes/learning.md` | `.agent/skills/uno-research/references/` |

**→ .agent/ root (agent infrastructure meta-docs):**

| Source | Destination |
|--------|------------|
| `docs/design-system/platform-integration.md` | `.agent/platform-integration.md` |
| `docs/design-system/integrations.md` | `docs/context/conventions/integrations.md` |

**→ uno-compound/references/ (maintenance + escalation):**

| Source | Destination |
|--------|------------|
| `docs/design-system/modes/maintaining.md` | `.agent/skills/uno-compound/references/` |
| `docs/design-system/maintenance/runbook.md` | `.agent/skills/uno-compound/references/` |
| `docs/design-system/maintenance/scripts.md` | `.agent/skills/uno-compound/references/` |
| `docs/design-system/maintenance/sync-checklist.md` | `.agent/skills/uno-compound/references/` |

**IMPORTANT: ALL existing skill files are PRESERVED.** Each skill already has references, examples, and scripts that stay alongside incoming files:

| Skill | Existing references/ (keep) | Existing examples/ (keep) | Existing scripts/ (keep) |
|-------|---------------------------|--------------------------|-------------------------|
| `uno-compound` | `escalation-rules.md`, `solution-doc-guide.md`, `solution-schema.md` | `solution-doc-template.md` | — |
| `uno-review` | `catch-ds-compliance.md`, `catch-patterns.md`, `catch-structural.md` | `review-output-example.md` | `run-review-checks.sh` |
| `uno-prototype` | `template-selection-guide.md` | `vite-config-example.js` | `validate-prototype.sh` |
| `uno-post` | `deployment-guide.md`, `marketplace-schema.md` | `marketplace-entry-example.md` | — |

**Also keep:** `.agent/scripts/validate-doc-links.sh` — stays at `.agent/scripts/` (not inside any skill; it's a cross-cutting validation tool)

**Acceptance:**
- [ ] `.agent/assets/` is deleted (index files moved to shared context or skills)
- [ ] `.agent/references/` is deleted (`loading-order.md` moves to `.agent/` root)
- [ ] Each skill's `references/` contains both its existing AND incoming files
- [ ] Shared index files (`components-index.json`, `index-manifest.json`) live in `docs/context/design-system/`
- [ ] No cross-skill reference dependencies (skills reference shared Tier 2 context by absolute path, not each other)

### Phase 8: Rewrite Agent Infrastructure Files

#### 8a: AGENTS.md — Tier 1 Manifest

Rewrite as the always-loaded context manifest using content references (not @imports — keep current plain-path style for cross-agent compatibility):

```markdown
# PLUS Design Agent

## Identity
See docs/context/agent-persona.md

## Product
See docs/context/product/plus-app.md

## Conventions
See docs/context/conventions/coding.md
See docs/context/conventions/terminology.md

## Design Principles
See docs/context/design-system/foundations/principles.md

## Knowledge Index
See docs/knowledge/INDEX.md

## Forbidden Patterns
[Keep existing 15 inline rules — these are Tier 1, always loaded]

## Skills
[Update skill table to 6 skills: research, plan, prototype, review, post, compound]

## Pipeline
See .agent/SKILL.md for skill routing, tier-aware loading, and compaction protocol.

## Progressive Loading
[Update trigger table with new paths]
```

#### 8b: .agent/SKILL.md — Router with Tier-Aware Loading

**Budget: under 300 lines.** Overflow goes to skill references.

Rewrite to include:

**1. Skill trigger table with Tier 2 declarations:**

```markdown
| Skill | Trigger | Tier 2 Context (loaded on invoke) | Budget |
|-------|---------|-----------------------------------|--------|
| uno-research | "research", "explore", "what do we know" | `docs/context/product/*`, `docs/knowledge/INDEX.md` → domain files, `references/component-discovery.md` | ~3K |
| uno-plan | "plan", "scope", "how should we build" | `docs/context/design-system/foundations/*`, `docs/context/conventions/tech-stack.md`, handoff brief | ~4K |
| uno-prototype | "scaffold", "prototype", "build", Figma link | `docs/context/design-system/components/cheat-sheet.md`, `references/figma-mcp-guide.md`, handoff plan | ~5K |
| uno-review | "review", "check", "validate" | `docs/context/design-system/foundations/accessibility.md`, `docs/context/design-system/foundations/content-voice.md`, `docs/knowledge/preferences.md` | ~3K |
| uno-post | "submit", "publish" | `references/marketplace-schema.md` | ~1K |
| uno-compound | "document", "compound", session ending | `docs/knowledge/INDEX.md`, target domain lesson file, `references/solution-schema.md` | ~3K |
```

**2. Routing logic (preserves mode disambiguation):**

```markdown
## Routing Logic
- "What is..." / "How does..." → uno-research (absorbs Learning mode)
- "What should the layout be" / "Help me plan" → uno-plan (absorbs Consulting mode)
- "Show me options" / "Build this" / Figma link → uno-prototype (absorbs Prototyping/Finalization/Iteration modes)
- "Check" / "Review" / "Validate" → uno-review
- "Submit" / "Publish" → uno-post
- "Document" / "Compound" / session ending → uno-compound (absorbs Maintaining mode)
```

**3. Skill frontmatter requirements (each skill's SKILL.md):**

```yaml
# Side-effect skills (create/modify files):
---
name: uno-prototype
description: Scaffold playground prototypes with PLUS DS integration. Use when...
disable-model-invocation: true  # Requires explicit user invocation
allowed-tools: Read, Write, Bash(npm run *), Bash(mkdir *)
---

# Read-only / analysis skills:
---
name: uno-review
description: Quality gate before shipping. Use when...
allowed-tools: Read, Bash(bash .agent/skills/uno-review/scripts/*), Grep
---

# Isolated exploration skills:
---
name: uno-research
description: Discover context, audit assets, surface prior knowledge. Use when...
context: fork          # Runs in isolated subagent
agent: Explore         # Uses Explore subagent type
allowed-tools: Read, Grep, Glob
---
```

**4. Compaction protocol section** (in SKILL.md)

**5. Shared Tier 2 context referencing rule:**
Skills reference shared context via absolute repo-relative paths (e.g., `docs/context/design-system/components/cheat-sheet.md`). This is NOT a cross-skill dependency — Tier 1/2 context is shared infrastructure, not owned by any skill.

#### 8c: .agent/loading-order.md → moved to `.agent/loading-order.md` (already at root)

**Role change:** No longer a routing table (skills own their loading). Becomes the **three-tier contract document:**

- **Tier 1 manifest:** Exactly which files AGENTS.md references, with line counts and token estimates. Target: under 200 lines resolved.
- **Tier 2 per-skill table:** Which skill loads which context (mirrors the table in SKILL.md, but with token budgets).
- **Tier 3 rules:** Handoff format, expiry, gitignore status.
- **Budget caps:** Total Tier 1 < 200 lines, per-skill Tier 2 < 5K tokens, combined Tier 2 < 25K tokens.
- **Tier membership markers:** Each file in `docs/context/` and `docs/knowledge/` should have a `<!-- Tier: 1 -->` or `<!-- Tier: 2 -->` comment in its first line so tier classification is intrinsic. `knowledge/INDEX.md` is Tier 1 (loaded by AGENTS.md). All other knowledge files are Tier 2.

#### 8d: .agent/AGENT.md — Pipeline + Compaction

Rewrite from current 2-line redirect to full pipeline orchestration:
- Pipeline: `research → plan → prototype → review → (iterate) → post → compound`
- Compaction protocol between stages
- Handoff artifact format:

```markdown
# Handoff Artifact Format

---
from: uno-research
to: uno-plan
created: 2026-04-11T14:30:00Z
status: pending    # pending | consumed | archived
---

## Summary
[3-5 bullet observation summary]

## Key Artifacts
[File paths created/modified]

## Decisions Made
[What was decided during this stage]

## Open Questions
[What the next skill should address]
```

- Handoff lifecycle:
  - `.agent/handoffs/` is **gitignored** (local-only session state)
  - Created by outgoing skill before suggesting `/compact`
  - `status` set to `consumed` by incoming skill after reading
  - Cleaned up by `uno-compound` at session end (archive or delete consumed handoffs)
  - Stale handoffs (>7 days) can be pruned

**Acceptance:**
- [ ] AGENTS.md is under 200 lines and references only `docs/context/` and `docs/knowledge/INDEX.md` paths
- [ ] SKILL.md is under 300 lines, has 6 skills with Tier 2 loading declarations and routing logic
- [ ] loading-order.md documents all three tiers with budgets
- [ ] AGENT.md describes full pipeline with compaction protocol and handoff format
- [ ] `.agent/handoffs/` added to `.gitignore`
- [ ] Skill frontmatter includes `allowed-tools` and `disable-model-invocation` where appropriate

### Phase 9: Update All Internal Cross-References

This is the highest-risk phase. **100+ path references** across the codebase must be updated.

**Priority order (by breakage severity):**

1. **AGENTS.md** — 20+ references (Tier 1 — breaks all agent behavior)
2. **CLAUDE.md** — `@AGENTS.md` (safe, AGENTS.md doesn't move)
3. **.agent/SKILL.md** — 10+ references (Tier 1 — breaks skill routing)
4. **.agent/skills/uno-*/SKILL.md** (4 files) — references to docs, assets, modes
5. **.agent/skills/uno-compound/references/*.md** — references to conventions, terminology
6. **Mode files** (now inside skills) — references to `.agent/assets/` → update to skill-relative paths
7. **Guide files** (now inside skills) — references to `.agent/references/` → update to skill-relative paths
8. **docs/design-system/overview.md** — delete or redirect (sub-files moved)
9. **docs/design-system/tokens.md** — becomes `foundations/tokens.md`, update links to styles/
10. **docs/design-system/integrations.md** — references to `.agent/references/figma-mcp-guide.md`
11. **docs/design-system/platform-integration.md** — update architecture hierarchy
12. **README.md** — 6+ references to old paths
13. **playground/storybook-ai-agent-llm-api/StorybookAIAgent.jsx** — hardcoded `docs/project/` paths
14. **playground/templates/*.md** — stale references (already broken, fix or delete)
15. **.agent/assets/README.md** — redirect or delete
16. **JSON index files** (now in skill references/) — self-references, path patterns

**Strategy:** After all moves complete, run a comprehensive grep for every old path pattern and fix all matches:

```bash
# Old patterns to search for (comprehensive — includes patterns found by spec-flow analysis)
grep -r "docs/project/" --include="*.md" --include="*.jsx" --include="*.json" --include="*.mdc"
grep -r "docs/foundations/" --include="*.md" --include="*.mdc"
grep -r "docs/design-system/modes/" --include="*.md"
grep -r "docs/design-system/guides/" --include="*.md"
grep -r "docs/design-system/maintenance/" --include="*.md"
grep -r "docs/design-system/tokens/" --include="*.md"
grep -r "docs/design-system/overview.md" --include="*.md"
grep -r "docs/design-system/conventions-quick-ref" --include="*.md"
grep -r "docs/design-system/packaging" --include="*.md"
grep -r "docs/design-system/workflows/" --include="*.md"
grep -r "docs/design-system/components.md" --include="*.md"  # Note: this file merges into inventory.md
grep -r "\.agent/assets/" --include="*.md" --include="*.json"
grep -r "\.agent/references/" --include="*.md"
grep -r "\.agent/AGENT.md" --include="*.md"  # References to the old 2-line redirect
grep -r "docs/solutions/" --include="*.md"
grep -r "docs/ideation/" --include="*.md"

# Also check platform-specific files:
grep -r "docs/" cursorrules.md 2>/dev/null
grep -r "docs/" .cursor/rules/ 2>/dev/null

# Check BOTH playground agent variants:
grep -r "docs/" playground/storybook-ai-agent/ --include="*.jsx" 2>/dev/null
grep -r "docs/" playground/storybook-ai-agent-llm-api/ --include="*.jsx" 2>/dev/null
```

**Post-Phase-9 validation script** (run after all reference updates):

```bash
#!/bin/bash
# validate-refs.sh — Verify all markdown path references resolve to existing files
echo "Validating AGENTS.md references..."
grep -oP '(?:See |@)\K[^\s)]+\.md' AGENTS.md | while read ref; do
  [ ! -f "$ref" ] && echo "BROKEN: AGENTS.md -> $ref"
done

echo "Validating SKILL.md references..."
grep -oP '\[[^\]]*\]\(\K[^)]+' .agent/SKILL.md | while read ref; do
  resolved=$(cd .agent && realpath --relative-to=. "$ref" 2>/dev/null || echo "$ref")
  [ ! -f ".agent/$resolved" ] && [ ! -f "$ref" ] && echo "BROKEN: SKILL.md -> $ref"
done

echo "Validating skill SKILL.md references..."
for skill in .agent/skills/*/SKILL.md; do
  dir=$(dirname "$skill")
  grep -oP '\[[^\]]*\]\(\K[^)]+' "$skill" | while read ref; do
    [ ! -f "$dir/$ref" ] && [ ! -f "$ref" ] && echo "BROKEN: $skill -> $ref"
  done
done

echo "Validation complete."
```

**Acceptance:**
- [ ] Zero grep matches for any old path pattern in active files (excluding `_archive/`)
- [ ] All links in AGENTS.md resolve to existing files
- [ ] All links in SKILL.md resolve to existing files
- [ ] All links in skill SKILL.md files resolve to existing files

### Phase 10: Cleanup and Archive

| Action | Target | Reason |
|--------|--------|--------|
| Delete | `docs/project/` | Emptied — all content moved to `docs/context/product/` |
| Delete | `docs/foundations/` | Emptied — content moved to `docs/context/conventions/` and `foundations/layout.md` |
| Delete | `.agent/assets/` | Emptied — distributed to skills and `docs/context/design-system/` |
| Delete | `.agent/references/import-conventions.md` | Merged into `docs/context/conventions/coding.md` |
| Delete | `.agent/references/component-discovery.md` | Moved to `uno-research/references/` |
| Delete | `.agent/references/figma-mcp-guide.md` | Moved to `uno-prototype/references/` |
| Delete | `.agent/references/figma-token-mapping.md` | Moved to `uno-prototype/references/` |
| Move | `.agent/references/loading-order.md` → `.agent/loading-order.md` | Moves to `.agent/` root, then rewritten in Phase 8c. Delete `.agent/references/` after move. |
| Delete | `docs/design-system/modes/` | All 6 modes absorbed into skills |
| Delete | `docs/design-system/guides/` | All 4 guides absorbed into skills |
| Delete | `docs/design-system/maintenance/` | All 3 files absorbed into uno-compound |
| Delete | `docs/design-system/workflows/` | Pure redirects, no unique content |
| Delete | `docs/design-system/packaging.md` | Stale — npm publishing is deferred |
| Delete | `docs/design-system/tokens/` | All 4 token files moved to `styles/` |
| Delete | `docs/design-system/architecture.md` | Reworked into `foundations/layout.md` |
| Delete | `docs/design-system/layout-grid.md` | Merged into `foundations/layout.md` |
| Delete | `docs/design-system/components.md` | Merged into `components/inventory.md` |
| Delete | `docs/design-system/conventions-quick-ref.md` | Merged into `conventions/coding.md` |
| Delete | `docs/design-system/icons.md` | Moved to `styles/iconography.md` |
| Delete | `docs/design-system/component-inventory.md` | Moved to `components/inventory.md` |
| Delete | `docs/design-system/tokens.md` | Reworked into `foundations/tokens.md` |
| Move | `docs/design-system/platform-integration.md` → `.agent/platform-integration.md` | Agent architecture meta-doc |
| Move | `docs/design-system/integrations.md` → `docs/context/conventions/integrations.md` | MCP integration procedures |
| Delete | `.agent/assets/README.md` | Directory being deleted; no destination needed |
| Archive | `docs/solutions/` → `_archive/solutions/` | Raw content preserved; distilled into `knowledge/lessons/` |
| Archive | `docs/ideation/` → `_archive/ideation/` | Consolidated into `knowledge/ideations.md` |
| Keep | `docs/plans/` | Historical plans stay as reference (not active handoffs) |
| Delete | `docs/design-system/overview.md` | Stub index — sub-files moved to new locations |

**Additional dispositions (resolved during deepening):**

| File | Action | Reason |
|------|--------|--------|
| `docs/design-system/components.md` | Merge into `docs/context/design-system/components/inventory.md` | Referenced in AGENTS.md but overlaps with component-inventory.md |
| `docs/design-system/layout-grid.md` | Merge into `docs/context/design-system/foundations/layout.md` | Grid system content belongs in foundations |
| `cursorrules.md` (repo root) | Update if it contains internal path refs beyond `@AGENTS.md` | Cross-agent compatibility file |
| `.cursor/rules/plus-agent.mdc` | Check for internal path refs and update | Platform-specific rule file |
| `playground/storybook-ai-agent/StorybookAIAgent.jsx` | Update hardcoded doc paths (same as LLM variant) | Both agent variants need path fixes |
| `.storybook/FORMS_DOCS_PLAN.md` | Keep (inside .storybook, not part of docs restructure) | Out of scope |
| `figma/plans-access-and-permissions.md` | Keep (standalone reference) | Out of scope |

**Remaining `docs/design-system/` files — final disposition:**
- `docs/design-system/integrations.md` → move to `docs/context/conventions/integrations.md` (MCP integration procedures are conventions)
- `docs/design-system/platform-integration.md` → move to `.agent/platform-integration.md` (meta about agent architecture, lives alongside loading-order.md)
- After these moves, `docs/design-system/` is empty → delete the directory

**Acceptance:**
- [ ] No empty directories remain
- [ ] `_archive/` contains solutions/ and ideation/ for reference
- [ ] `docs/design-system/` is fully deleted (all files moved, merged, or deleted above)
- [ ] `docs/project/` is fully deleted
- [ ] `docs/foundations/` is fully deleted
- [ ] `.agent/assets/` is fully deleted
- [ ] `.agent/references/` is fully deleted (loading-order.md moved to `.agent/` root)
- [ ] `git status` shows only expected changes

## System-Wide Impact

### Interaction Graph
- CLAUDE.md → AGENTS.md → docs/context/ + docs/knowledge/INDEX.md (Tier 1 chain)
- AGENTS.md → .agent/SKILL.md → .agent/skills/*/SKILL.md → skill references/ (Tier 2 chain)
- Skills → .agent/handoffs/ (Tier 3 bridge, write before compact)
- Skills → docs/knowledge/ (compound writes, research reads)

### Error Propagation
- Broken path in AGENTS.md → agent loses all context for that section (Tier 1 failure)
- Broken path in SKILL.md → skill fails to load, agent falls back to generic behavior (Tier 2 failure)
- Broken path in skill references → skill works but with degraded context (Tier 2 degraded)
- Phase 9 (cross-reference update) is the highest-risk phase — must be thorough

### State Lifecycle Risks
- Moving files with `git mv` preserves history but changes paths
- JSON index files contain hardcoded path patterns — must be updated
- StorybookAIAgent.jsx has hardcoded doc paths — runtime breakage if not updated

### API Surface Parity
- No API changes — this is infrastructure only
- Skill invocation paths (`/uno:prototype`, etc.) are unchanged
- The 2 new skill directories (uno-research, uno-plan) are empty scaffolds — content in follow-up

## Acceptance Criteria

### Functional Requirements
- [ ] Three-tier loading architecture is implemented: always-loaded, on-demand, ephemeral
- [ ] AGENTS.md is under 200 lines (plain "See" references, not @imports, for cross-agent compatibility)
- [ ] SKILL.md is under 300 lines (overflow in skill references/)
- [ ] Every file has exactly one home — no duplication across tiers
- [ ] (Optional) Context files have `<!-- Tier: 1 -->` or `<!-- Tier: 2 -->` markers — nice-to-have, not blocking
- [ ] Knowledge base seeded with 19 lesson entries + 12 ADRs from solutions/plans/ideation
- [ ] Handoffs directory exists for Tier 3 bridging, gitignored
- [ ] Handoff artifact format defined with YAML frontmatter spec

### Non-Functional Requirements
- [ ] Zero broken path references in active files
- [ ] Git history preserved for all moved files (use `git mv`)
- [ ] No changes to `design-system/src/` (source code untouched)
- [ ] No changes to `playground/` (except path reference fixes)
- [ ] No changes to `storybook-static/` or `node_modules/`

### Quality Gates
- [ ] Comprehensive grep for old paths returns zero matches in active files
- [ ] Post-Phase-9 validation script (`validate-refs.sh`) passes with zero BROKEN references
- [ ] AGENTS.md validates: every path it references exists on disk
- [ ] Each skill's SKILL.md validates: every path it references exists on disk
- [ ] README.md links all resolve
- [ ] Skill routing tested with Sonnet (not just Opus) to verify smaller models can follow

## Dependencies & Prerequisites

- Git working tree must be clean (confirmed: currently clean on `main`)
- No .claude/rules path-scoped rules to break (confirmed: none exist)
- 2 untracked files should be committed first:
  - `design-system/src/specs/Toolkit/in-session/elements/SessionControlsConsolidated/`
  - `docs/ideation/2026-03-25-skill-documentation-revision-ideation.md`

## Risk Analysis & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Broken cross-references after moves | High | High | Phase 9 comprehensive grep sweep; validate all AGENTS.md and SKILL.md paths |
| Git history loss on moves | Low | Medium | Use `git mv` for all file moves |
| Agent behavior regression | Medium | High | Test skill invocation after restructure; verify Tier 1 loads correctly |
| Knowledge distillation loses detail | Low | Low | Archive raw solutions/ in `_archive/`; atomic entries link back to source |
| New files (principles, a11y, patterns) are thin/low quality | Medium | Medium | Seed with content from AGENTS.md, article, and existing docs; iterate |

## Execution Order Summary

```
Phase 0:  Commit untracked files                 (prerequisite)
Phase 1:  Create directories                     (0 risk, scaffolding only)
Phase 2:  Move product context                   (low risk, 6 files)
Phase 3:  Move + create design system context    (medium risk, 14 files)
Phase 4:  Move conventions                       (low risk, 3-4 files merged)
Phase 5:  Create agent persona                   (low risk, 1 new file)
Phase 7:  Redistribute assets/references         (medium risk, 25+ files)
Phase 8:  Rewrite agent infrastructure           (high risk, 4 critical files)
Phase 9:  Update all cross-references            (highest risk, 100+ references)
Phase 10: Cleanup and archive                    (low risk, delete empties)
Phase 6:  Create knowledge base                  (low risk, 8 new files — additive, independent)
```

**Commit strategy: 3 commits** (balances atomicity with rollback granularity):

| Commit | Phases | State After | Rollback Value |
|--------|--------|-------------|----------------|
| **Commit A** | 0-5, 7 | All file moves + new file creation + asset redistribution. Paths are moved but AGENTS.md/SKILL.md still reference old locations. | Revert to undo all moves cleanly |
| **Commit B** | 8, 9, 10 | Infrastructure rewrites + all reference updates + cleanup. Repo is fully consistent, all paths resolve. Validation script passes. | Revert to undo rewrites while keeping moves (allows re-attempting refs) |
| **Commit C** | 6 | Knowledge base content — additive only, doesn't break references. Can iterate on content quality separately. | Independent — revert without affecting structure |

**Note:** Commit A leaves the repo with broken references until Commit B lands. These commits should happen in the same session without pause. If execution must stop, stop BEFORE Commit A (safe) or AFTER Commit B (safe), never between them.

## Sources & References

### Research (conducted in this session)
- Anthropic: context engineering, memory/CLAUDE.md patterns, skill authoring, agent orchestration
- OpenAI: Agents SDK memory/knowledge, context personalization, session memory
- Google ADK: context compaction, sliding window
- JetBrains: observation masking > LLM summarization
- CrewAI: unified memory, atomic extraction, hierarchical scopes
- Phil Schmid: hierarchical reduction, minimal effective context
- Blake Crosley: handoffs/, state/, compound engineering production patterns
- Factory.ai: anchored iterative summarization, structure forces preservation
- Material Design 3, Fluent UI, Carbon, Polaris, Atlassian: design system IA layering

### Internal References
- `AGENTS.md` — current Tier 1 manifest (100 lines)
- `.agent/SKILL.md` — current skill router (80 lines)
- `docs/solutions/` — 10 solution docs with 23 distillable findings
- `docs/plans/2026-03-21-004` — original infrastructure plan rationale
- `docs/plans/2026-03-21-007` — optimal repo structure plan

### Related Work
- Compound Designing article: `~/Desktop/Compound Designing/compound-designing-article-draft.md`
- Compound Designing spec: `~/Desktop/Compound Designing/compound-designing-article-spec.md`
