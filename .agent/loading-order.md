# Three-Tier Context Loading Contract

This document defines what loads when, with token budgets and tier membership.

## Tier 1: Always-Loaded (Session Start)

AGENTS.md itself is the always-loaded document: **94 lines, under the 200-line budget.**

It contains plain "See" references to these Tier 1 context files. "See" references are **lazy-loaded** — agents read them on first relevant mention, not all at session start. This keeps the initial context small while making authoritative context discoverable.

| Reference | File | ~Lines | ~Tokens | Marker |
|-----------|------|--------|---------|--------|
| Identity | `docs/context/agent-persona.md` | 35 | 200 | Tier 1 |
| Product | `docs/context/product/plus-app.md` | 70 | 400 | Tier 1 |
| Conventions | `docs/context/conventions/coding.md` | 100 | 500 | Tier 1 |
| Terminology | `docs/context/conventions/terminology.md` | 40 | 200 | Tier 1 |
| Principles | `docs/context/design-system/foundations/principles.md` | 35 | 200 | Tier 1 |
| Knowledge Index | `docs/knowledge/INDEX.md` | 30 | 150 | Tier 1 |
| **Total available** | | **~310** | **~1,650** | |

These files are marked `<!-- Tier: 1 -->` and are the authoritative product/conventions/identity truth. They differ from Tier 2 in that they are referenced from AGENTS.md (always-visible) rather than from skill SKILL.md files (skill-triggered).

## Tier 2: On-Demand (Skill-Triggered)

Loaded when a skill is invoked. Each skill declares its Tier 2 context.

| Skill | Context Files | Budget |
|-------|--------------|--------|
| uno-research | `docs/context/product/*`, `docs/knowledge/INDEX.md` → domain files, `references/component-discovery.md`, `references/learning.md`; **Figma audit:** `design-system/figma/component-registry.json`, `token-registry.json` | ~3K |
| uno-plan | `docs/context/design-system/foundations/*`, `docs/context/conventions/tech-stack.md`, handoff brief; **Figma input:** `design-system/figma/component-registry.json`, `token-registry.json` | ~4K |
| uno-prototype | `design-system/figma/component-registry.json`, `token-registry.json` (MANDATORY), `references/figma-registry-mandatory-load.md`, `design-system/docs/discovery.md` → task docs, `references/figma-mcp-guide.md`, handoff plan | ~5K |
| uno-review | `docs/context/design-system/foundations/accessibility.md`, `docs/context/design-system/foundations/content-voice.md`, `docs/knowledge/preferences.md`; **Figma-derived work:** `design-system/figma/component-registry.json`, `token-registry.json` | ~3K |
| uno-post | `references/marketplace-schema.md`, `references/deployment-guide.md` | ~1K |
| uno-compound | `docs/knowledge/INDEX.md`, target domain lesson file, `references/solution-schema.md` | ~3K |

**Per-skill cap:** 5K tokens. **Combined Tier 2 cap:** 25K tokens.

Skills reference shared context (e.g., `design-system/docs/discovery.md`) via absolute repo-relative paths. This is shared infrastructure, not a cross-skill dependency.

## Tier 3: Ephemeral (Context Window + Handoffs)

- **Context window:** Tool outputs, exploration results, intermediate reasoning. Does NOT survive compaction.
- **Handoff bridge:** `.agent/handoffs/` — structured artifacts written before `/compact`, read by next skill.
  - Format: YAML frontmatter (`from`, `to`, `created`, `status`) + markdown body
  - Lifecycle: pending → consumed → cleaned up by uno-compound
  - **Gitignored** — local-only session state
  - TTL: 7 days, then pruned

## Tier Membership Markers

Each file in `docs/context/` and `docs/knowledge/` has a tier marker comment in its first line:

- `<!-- Tier: 1 -->` — referenced by AGENTS.md, loaded at session start
- `<!-- Tier: 2 -->` — loaded by skills on demand

`docs/knowledge/INDEX.md` is Tier 1. All other knowledge files are Tier 2.

## Loading Rules

1. Load the minimum context needed for the current task
2. Do not bulk-load all Tier 2 files — load per skill trigger
3. Once a reference is loaded in the current session, do not re-read it
4. After skill selection, context from other skills is irrelevant
5. If context window exceeds ~25K tokens of loaded docs, suggest `/compact`

## Figma Registry Mandatory Load

When any skill touches Figma implement-design, design-to-code mapping, or write-back:

1. **MUST** read `design-system/figma/component-registry.json`
2. **MUST** read `design-system/figma/token-registry.json`
3. Load `.agent/skills/uno-prototype/references/figma-registry-mandatory-load.md` for the gate checklist

Applies to: `uno-prototype` (always Phase 3), `uno-plan` (Figma input), `uno-research` (Figma audit), `uno-review` (Figma-derived prototypes). Skipping registries and guessing imports/tokens is a forbidden pattern (see `AGENTS.md` #16).
