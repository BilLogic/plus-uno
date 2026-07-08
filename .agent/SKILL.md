---
name: plus-design-system-router
description: Tier-aware skill router for the PLUS Design System. Routes requests to the correct skill, declares Tier 2 context loading, and enforces the compaction protocol.
---

# PLUS Design System Skill Router

## Identity

- **Specialty**: PLUS Design System (not generic web design)
- **Stack**: React 19, React-Bootstrap 2.10, Bootstrap 5.3, Vite 8, Storybook 10
- **Vocabulary**: Use PLUS terminology only (see `docs/context/conventions/terminology.md`)

## Skills

| Skill | Trigger | Tier 2 Context (loaded on invoke) | Budget |
|-------|---------|-----------------------------------|--------|
| [uno-research](skills/uno-research/SKILL.md) | "what is", "how does", "explore", "audit" | `docs/context/product/*`, `docs/knowledge/INDEX.md` → domain files, `references/component-discovery.md`; **Figma audit:** `design-system/figma/component-registry.json`, `token-registry.json` | ~3K |
| [uno-plan](skills/uno-plan/SKILL.md) | "plan", "scope", "how should we build" | `docs/context/design-system/foundations/*`, `docs/context/conventions/tech-stack.md`, handoff brief; **Figma input:** `design-system/figma/component-registry.json`, `token-registry.json` | ~4K |
| [uno-prototype](skills/uno-prototype/SKILL.md) | "scaffold", "prototype", "build", Figma link | `design-system/figma/component-registry.json`, `token-registry.json` (MANDATORY), `references/figma-registry-mandatory-load.md`, `design-system/docs/discovery.md`, `references/figma-mcp-guide.md`, handoff plan | ~5K |
| [uno-review](skills/uno-review/SKILL.md) | "review", "check", "validate" | `docs/context/design-system/foundations/accessibility.md`, `docs/knowledge/preferences.md`; **Figma-derived work:** `design-system/figma/component-registry.json`, `token-registry.json` | ~3K |
| [uno-post](skills/uno-post/SKILL.md) | "submit", "publish" | `references/marketplace-schema.md` | ~1K |
| [uno-compound](skills/uno-compound/SKILL.md) | "document", "compound", session ending | `docs/knowledge/INDEX.md`, target domain file, `references/solution-schema.md` | ~3K |

**Pipeline:** `uno-research → uno-plan → uno-prototype → uno-review → (iterate) → uno-post → uno-compound`

Each skill's SKILL.md contains full conditions. The pipeline is a recommendation — users may skip steps or enter at any stage.

## Routing Logic

Determine the correct skill from the user's request:

| Signal | Skill |
|--------|-------|
| "What is…" / "How does…" / "Where is…" | **uno-research** |
| "What should the layout be" / "Help me plan" / "Scope this" | **uno-plan** |
| "Show me options" / "Build this" / "Scaffold" / Figma link | **uno-prototype** |
| "Check" / "Review" / "Validate" / "Quality gate" | **uno-review** |
| "Submit" / "Publish" / "Add to market" | **uno-post** |
| "Document" / "Compound" / "Save learning" / session ending | **uno-compound** |

If ambiguous, ask the user which skill to invoke.

Before executing any task, determine the correct skill and state it explicitly.

## Skill Frontmatter Requirements

Each skill's SKILL.md must declare:

```yaml
---
name: skill-name
description: When and why to use this skill.
allowed-tools: [tool list]
# Optional:
disable-model-invocation: true   # For side-effect skills (create/modify files)
context: fork                     # For isolated exploration (uno-research)
agent: Explore                    # Subagent type (uno-research)
---
```

## Grounding Rules

0. **Figma link → mandatory registry load + implement-design workflow**: Read `design-system/figma/component-registry.json` and `design-system/figma/token-registry.json` first (see `skills/uno-prototype/references/figma-registry-mandatory-load.md`). Then load `skills/uno-prototype/references/figma-mcp-guide.md` and follow all 7 steps.
1. Never hardcode colors, spacing, typography, radius, or elevation when a token exists.
2. **DS KNOWLEDGE IS LAW:** Start at `design-system/docs/discovery.md`, then load only required docs before writing components or tokens.
3. **NEVER HALLUCINATE LAYOUTS:** Read `design-system/docs/patterns/layout.md` before building pages.
4. **NEVER HALLUCINATE PROPS:** Check component `.jsx` or `.stories.jsx` before using unfamiliar components.
5. Use PLUS components first; fall back to framework primitives only when no PLUS equivalent exists.
6. Cite concrete repository file paths when proposing implementations.
7. Say "I don't know" if unsure — ask instead of guessing.
8. Confirm plan before large edits. Include accessibility in finalization work.

## Compaction Protocol

When context grows heavy between pipeline stages:

1. Current skill writes a handoff artifact to `.agent/handoffs/{briefs|plans|reviews}/`
2. Handoff includes YAML frontmatter: `from`, `to`, `created`, `status: pending`
3. Suggest `/compact` to the user
4. Next skill reads handoff, sets `status: consumed`, continues work
5. `uno-compound` cleans consumed/stale handoffs at session end

See `.agent/AGENT.md` for full handoff format and lifecycle.

## Shared Tier 2 Context

Skills reference shared context via absolute repo-relative paths:

- `design-system/figma/component-registry.json` — **MANDATORY** Figma component set ↔ code import (design-to-code)
- `design-system/figma/token-registry.json` — **MANDATORY** Figma variable ↔ CSS token
- `.agent/skills/uno-prototype/references/figma-registry-mandatory-load.md` — load gate and skill enforcement
- `design-system/docs/discovery.md` — DS knowledge entry point (routes to agent-views, foundations, patterns)
- `design-system/docs/guidelines.md` — design and implementation philosophy
- `design-system/docs/setup.md` — aliases, playground, Vite, imports
- `docs/context/design-system/components/components-index.json` — component registry
- `docs/context/design-system/index-manifest.json` — master index of all indexes
- `docs/knowledge/INDEX.md` — knowledge routing table

This is shared infrastructure, not cross-skill dependencies.

## Scope and Integrations

This repository includes: design system source (`design-system/src`), Storybook (`.storybook`), token sync scripts (`scripts/`), agent guidance (`.agent/`, `docs/context/*`), validation scripts (`.agent/skills/uno-review/scripts/*`), playground prototypes (`playground/`).

Integrations: Figma MCP, Stitch MCP, Playwright MCP (optional), Notion MCP (`mcp__notion-plus__`). If MCP is unavailable, state it and continue with repo docs.
