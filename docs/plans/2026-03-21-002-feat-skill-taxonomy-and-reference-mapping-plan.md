---
title: "feat: Design /po:xxx skill taxonomy with reference mapping for plus-uno"
type: feat
status: active
date: 2026-03-21
origin: docs/plans/2026-03-21-001-feat-agents-md-compound-loop-agent-skills-plan.md
---

# Design /po:xxx Skill Taxonomy with Reference Mapping

## Overview

This plan designs the 4 `/po:xxx` skills for plus-uno: their purpose, phases, directory structure, references, and validation gates. Each skill is a user-invocable workflow triggered with `/po:xxx`, orthogonal to the DS mode router (`docs/design-system/router.md`).

**Key architectural insight:**
- **Modes** (`docs/design-system/router.md`) = HOW to approach work (learning, maintaining, consulting, iteration, finalization)
- **Skills** (`/po:xxx`) = WHAT lifecycle workflow to follow (prototype, compound, review, post)
- **References** (`docs/design-system/`, `docs/agent-context/`) = shared knowledge base loaded by BOTH

## Skill Directory Structure

Every skill follows the same structure:

```
.agent/skills/po-{name}/
├── SKILL.md           # Entrypoint with YAML frontmatter, phases, validation gates
├── references/        # Skill-specific reference docs (NOT shared DS guides)
├── examples/          # Example outputs, templates, sample artifacts
└── scripts/           # Validation scripts, automation helpers
```

- `SKILL.md` is the entrypoint. It references shared docs (`docs/design-system/`, `docs/agent-context/`) and skill-specific files in its own `references/` and `examples/`.
- `references/` holds guidance specific to THIS skill that doesn't belong in shared docs.
- `examples/` holds example outputs so agents know what good looks like.
- `scripts/` holds validation or automation scripts the skill can invoke.

## The 4 Skills

### Why These 4

| Workflow | Skill? | Reasoning |
|----------|--------|-----------|
| **Prototyping** | `/po:prototype` | Not covered by any mode. Project-level workflow. Done frequently by Bill, Ashley, Victor. |
| **Compound learning** | `/po:compound` | Not covered by any mode. The loop that makes everything else improve. |
| **Quality review** | `/po:review` | Cross-cuts all modes. "Automatic validation is the most valuable pattern." |
| **Marketplace posting** | `/po:post` | Not covered by any mode. Distinct lifecycle for the recently set up project marketplace. |
| Component dev | No — Maintaining mode | Already well-served by `maintaining.md` Workflows A/B/C. |
| Figma impl | No — Finalization mode | Already well-served by `finalization.md` + Figma MCP. |
| Token sync | No — Maintaining mode Workflow A | Already documented step-by-step in `maintaining.md`. |
| Planning | No — `/ce:plan` | Already handled by compound engineering plugin. |

---

## Skill 1: `/po:prototype`

**Purpose:** Scaffold and build a new playground prototype. Guides users through what tools to use when, and how to think about tackling problems at each phase.

### Directory Structure

```
.agent/skills/po-prototype/
├── SKILL.md
├── references/
│   └── template-selection-guide.md    # Which template for which use case
├── examples/
│   ├── vite-config-example.js         # Standard prototype vite.config.js with @ alias
│   └── package-json-script-example.md # How to add dev:xxx script to root package.json
└── scripts/
    └── validate-prototype.sh          # Checks imports, tokens, dev server startup
```

### SKILL.md Content

```yaml
---
name: po-prototype
description: >
  Scaffold and build a new playground prototype using the plus-uno design system.
  Guides you through template selection, tool choices, DS component integration,
  and validation. Use when creating new feature prototypes or experiments.
argument-hint: [owner/feature-name]
---
```

### Phases

| Phase | What Happens | Tools & Thinking | Gate |
|-------|-------------|-----------------|------|
| 1. Scope | Clarify feature purpose, owner, fidelity. | **Think:** What user problem does this solve? What fidelity — wireframe (Consulting), variations (Iteration), or production (Finalization)? **Tools:** Browse `playground/` for similar work. Figma MCP `get_screenshot` if design exists. Check `docs/solutions/` for past learnings. | Present plan, wait for approval |
| 2. Scaffold | Copy template → vite config → dev script → src/ structure | **Think:** Which template is closest? (See `references/template-selection-guide.md`). Single-page or routing needed? **Tools:** `ls playground/templates/`. Copy from `examples/vite-config-example.js`. | Files exist, dev server starts |
| 3. Build | Implement with DS components, tokens, pattern rules | **Think:** What components exist? Check index before building custom. Which mode fits the build? **Tools:** `.agent/assets/components-index.json` for lookup. Figma MCP for design. Stitch MCP for wireframes. `npm run storybook` for component reference. | Code compiles, renders |
| 4. Validate | Run validation checklist | **Think:** Would this pass `/po:review`? **Tools:** `scripts/validate-prototype.sh`. Dev server. Grep for catch patterns. | All checks pass |
| 5. Ship | Update docs, consider `/po:compound` and `/po:post` | **Think:** Did we learn anything worth compounding? Should this go on the marketplace? | Docs updated |

### Validation Checklist (Phase 4)

- [ ] Imports resolve (no broken `@` aliases)
- [ ] Token-driven styling (no hardcoded colors/spacing/typography)
- [ ] DS components used (no generic Bootstrap where PLUS equivalent exists)
- [ ] No duplicate components (checked against `.agent/assets/components-index.json`)
- [ ] Dev server starts without errors
- [ ] Storybook preview loads (if stories added)

### Shared References Loaded

| Reference | When | Why |
|-----------|------|-----|
| `docs/agent-context/product-landscape.md` | Phase 1 | Product context for feature scoping |
| `docs/agent-context/conventions.md` | Phase 2 | Playground structure, naming, dev script pattern |
| `docs/design-system/router.md` (mode section) | Phase 3 | Which mode to use during build |
| `docs/design-system/components-guide.md` | Phase 3 | Which DS components to use |
| `docs/design-system/tokens-guide.md` | Phase 3 | Styling with design tokens |
| `docs/design-system/implementation-guide.md` | Phase 3 | Pattern rules, example selection |
| `docs/design-system/integrations-guide.md` | Phase 3 (conditional) | When Figma/Stitch MCP input provided |
| `.agent/assets/components-index.json` | Phase 4 | Exhaustive component lookup |
| `docs/design-system/local-preview-runbook.md` | Phase 4 | Dev server and Storybook verification |
| `docs/solutions/` | Phase 1, 5 | Past learnings; compound new ones |

---

## Skill 2: `/po:compound`

**Purpose:** Capture what was learned from work just completed. Creates a searchable solution doc and updates shared docs if patterns emerge. The skill that makes everything else improve over time.

### Directory Structure

```
.agent/skills/po-compound/
├── SKILL.md
├── references/
│   └── solution-doc-guide.md          # When to compound, how to categorize, what to propagate
├── examples/
│   └── solution-doc-template.md       # Complete example with filled-in YAML frontmatter
└── scripts/
    └── create-solution-doc.sh         # Creates file with correct path, frontmatter, and date
```

### SKILL.md Content

```yaml
---
name: po-compound
description: >
  Document a solution or learning from work just completed. Creates a searchable
  solution doc and updates shared docs if patterns emerge. Use after completing
  significant work, fixing non-trivial bugs, or discovering gotchas.
argument-hint: [brief-description]
---
```

### Phases

| Phase | What Happens | Gate |
|-------|-------------|------|
| 1. Summarize | Review what was done, what broke, what was learned. Identify category. | Summary approved |
| 2. Document | Create solution doc in `docs/solutions/{category}/` using `scripts/create-solution-doc.sh` | File created with correct template (see `examples/solution-doc-template.md`) |
| 3. Evaluate | Check if learning warrants updating AGENTS.md forbidden patterns or conventions.md gotchas | Decision made |
| 4. Propagate | If warranted: update AGENTS.md and/or conventions.md, citing the solution doc | Docs updated consistently |

### Solution Doc Template (in examples/)

```markdown
---
title: "[Description]"
category: [ui-bugs|integration-issues|agent-infrastructure|token-issues]
date: YYYY-MM-DD
tags: [relevant, tags]
symptom: "What the user/agent saw"
root_cause: "Why it happened"
---

# [Title]

## Problem
[What went wrong]

## Solution
[How it was fixed, with code examples]

## Prevention
[How to avoid this in the future]

## Files Modified
[Table of affected files]
```

### Shared References Loaded

| Reference | When | Why |
|-----------|------|-----|
| `docs/agent-context/conventions.md` | Phase 2 | Solution doc naming convention, gotcha table format |
| `docs/solutions/README.md` | Phase 2 | Category list, template reference |
| `AGENTS.md` | Phase 3 | Current forbidden patterns to check against |

---

## Skill 3: `/po:review`

**Purpose:** Quality validation gate. Reviews recent work against conventions, forbidden patterns, and DS rules. Catches drift before it compounds. Run after any work or before shipping.

### Directory Structure

```
.agent/skills/po-review/
├── SKILL.md
├── references/
│   └── catch-patterns.md              # Grep patterns for forbidden pattern detection
├── examples/
│   └── review-report-example.md       # What a pass/fail report looks like
└── scripts/
    └── run-catch-patterns.sh          # Automated grep for hardcoded values, bad imports, etc.
```

### SKILL.md Content

```yaml
---
name: po-review
description: >
  Quality validation gate for plus-uno. Reviews recent work against conventions,
  forbidden patterns, and design system rules. Run after completing implementation
  work or before shipping. Catches drift before it compounds.
argument-hint: [file-or-directory-to-review]
---
```

### Phases

| Phase | What Happens | Gate |
|-------|-------------|------|
| 1. Scope | Identify files changed (git diff or specified path). Classify work type. | Files identified |
| 2. Convention check | Validate file naming, imports, git conventions against `conventions.md` | Pass/fail per rule |
| 3. Forbidden pattern check | Run `scripts/run-catch-patterns.sh` — grep for hardcoded colors, pixel values, wrong imports | Pass/fail per pattern |
| 4. DS compliance check | Validate token usage, component duplication, barrel exports | Pass/fail per rule |
| 5. Report | Present pass/fail checklist. Auto-fix what's possible, escalate what isn't. Suggest `/po:compound` if new gotcha found. | All passes or action items listed |

### Catch Patterns (in references/catch-patterns.md and scripts/)

```bash
# Hardcoded hex colors
grep -rn '#[0-9a-fA-F]\{3,8\}' --include='*.jsx' --include='*.scss'

# Hardcoded pixel spacing
grep -rn '[0-9]\+px' --include='*.scss' --exclude-dir='tokens'

# Non-Bootstrap UI framework imports
grep -rn "from ['\"]@mui\|from ['\"]antd\|from ['\"]@chakra" --include='*.jsx'

# Deep imports bypassing barrel
grep -rn "from ['\"].*packages/plus-ds/src/" --include='*.jsx' --exclude-dir='plus-ds'

# New packages added
git diff HEAD package.json | grep '^\+'
```

### Shared References Loaded

| Reference | When | Why |
|-----------|------|-----|
| `AGENTS.md` | Phase 2-3 | Forbidden patterns |
| `docs/agent-context/conventions.md` | Phase 2 | File naming, imports, git conventions, gotchas |
| `docs/design-system/tokens-guide.md` | Phase 4 | Token enforcement rules |
| `docs/design-system/components-guide.md` | Phase 4 | Component duplication check |
| `docs/design-system/implementation-guide.md` | Phase 4 | Pattern rules and guardrails |
| `.agent/assets/components-index.json` | Phase 4 | Exhaustive component lookup |
| `docs/solutions/` | Phase 5 | Check if failure matches a known gotcha |

---

## Skill 4: `/po:post`

**Purpose:** Package and post a completed project to the plus-uno marketplace for displaying all projects. Handles screenshots, metadata, and publishing.

### Directory Structure

```
.agent/skills/po-post/
├── SKILL.md
├── references/
│   └── marketplace-format.md          # Required fields, image specs, metadata schema
├── examples/
│   └── marketplace-entry-example.md   # Complete example entry
└── scripts/
    └── capture-screenshots.sh         # Launches dev server, captures screenshots
```

### SKILL.md Content

```yaml
---
name: po-post
description: >
  Package and post a completed project to the plus-uno marketplace.
  Handles screenshots, metadata formatting, and publishing. Use after
  completing a prototype or significant feature work.
argument-hint: [project-path-or-name]
---
```

### Phases

| Phase | What Happens | Gate |
|-------|-------------|------|
| 1. Identify | Locate project. Gather: name, description, owner, tech used. | Project identified, metadata collected |
| 2. Package | Generate entry using `examples/marketplace-entry-example.md` as template. Capture screenshots via `scripts/capture-screenshots.sh`. | Entry formatted correctly |
| 3. Review | Preview the marketplace entry. Verify screenshots, description, links. | Author approves |
| 4. Publish | Post to marketplace. Update project index. | Entry live |

### Shared References Loaded

| Reference | When | Why |
|-----------|------|-----|
| `docs/agent-context/product-landscape.md` | Phase 1 | Product context and team for attribution |
| `docs/agent-context/conventions.md` | Phase 2 | Naming conventions for consistent formatting |
| `docs/design-system/local-preview-runbook.md` | Phase 2 | How to run project for screenshot capture |

**Note:** `references/marketplace-format.md` will be refined as the marketplace infrastructure matures.

---

## How Skills Interact with Modes

```
User invokes /po:prototype
  → Skill defines lifecycle (scope → scaffold → build → validate → ship)
  → During Build phase, agent may use Finalization mode patterns
  → During Validate phase, skill runs its own checklist

User invokes /po:review
  → Skill defines lifecycle (scope → conventions → forbidden → DS → report)
  → Not modal — reviews any work regardless of which mode produced it

User invokes /po:compound
  → Skill defines lifecycle (summarize → document → evaluate → propagate)
  → May trigger updates to AGENTS.md that affect future /po:review runs

User invokes /po:post
  → Skill defines lifecycle (identify → package → review → publish)
  → Natural follow-up after /po:prototype or Finalization mode work
```

Skills never conflict with modes — they operate at different levels.

---

## Reference Dependency Map

| Shared Reference | /po:prototype | /po:compound | /po:review | /po:post |
|-----------|:---:|:---:|:---:|:---:|
| `docs/agent-context/product-landscape.md` | Phase 1 | — | — | Phase 1 |
| `docs/agent-context/conventions.md` | Phase 2 | Phase 2 | Phase 2 | Phase 2 |
| `AGENTS.md` | — | Phase 3 | Phase 2-3 | — |
| `docs/solutions/README.md` | — | Phase 2 | — | — |
| `docs/solutions/*` | Phase 1,5 | — | Phase 5 | — |
| `docs/design-system/router.md` | Phase 3 | — | — | — |
| `docs/design-system/components-guide.md` | Phase 3 | — | Phase 4 | — |
| `docs/design-system/tokens-guide.md` | Phase 3 | — | Phase 4 | — |
| `docs/design-system/implementation-guide.md` | Phase 3 | — | Phase 4 | — |
| `docs/design-system/integrations-guide.md` | Phase 3* | — | — | — |
| `docs/design-system/local-preview-runbook.md` | Phase 4 | — | — | Phase 2 |
| `.agent/assets/components-index.json` | Phase 4 | — | Phase 4 | — |

*conditional — only when Figma/Stitch MCP input provided

---

## Acceptance Criteria

### Skill files (each with full directory structure)
- [ ] `.agent/skills/po-prototype/` has SKILL.md, references/, examples/, scripts/
- [ ] `.agent/skills/po-compound/` has SKILL.md, references/, examples/, scripts/
- [ ] `.agent/skills/po-review/` has SKILL.md, references/, examples/, scripts/
- [ ] `.agent/skills/po-post/` has SKILL.md, references/, examples/, scripts/

### Discoverability
- [ ] `AGENTS.md` Skills section lists all 4 with paths and descriptions
- [ ] `docs/design-system/router.md` Loading Triggers table includes skill triggers
- [ ] `docs/agent-context/setup-guide.md` documents how to discover and use skills per platform

### Functional
- [ ] `/po:prototype bill/test-feature` triggers prototype lifecycle
- [ ] `/po:compound "fixed storybook alias"` creates solution doc with correct template
- [ ] `/po:review src/` runs catch patterns and produces pass/fail report
- [ ] `/po:post playground/Bill/home-redesign` triggers marketplace posting

## Dependencies & Risks

- **Dependency**: Plan 001 must complete first (AGENTS.md, `docs/design-system/`, `docs/solutions/` must exist)
- **Risk**: 4 skills may be too many for early stage
  - **Mitigation**: Start with `/po:prototype` and `/po:compound`, add `/po:review` and `/po:post` after compound loop has surfaced patterns
- **Risk**: `/po:post` marketplace infrastructure is new and may change
  - **Mitigation**: Keep skill lightweight, refine `references/marketplace-format.md` as it matures

## Sources & References

### Origin
- **Origin document:** [docs/plans/2026-03-21-001](docs/plans/2026-03-21-001-feat-agents-md-compound-loop-agent-skills-plan.md) — This plan implements Phase 5 of the origin.

### External References
- Anthropic skills docs: https://code.claude.com/docs/en/skills
- Compound engineering playbook (cornerstone): "most projects need 1-3 skills, not 20"
- Compound engineering guide: https://every.to/guides/compound-engineering
