---
name: plus-design-system-router
description: Cross-agent router for working in the PLUS design system repository. Use when an AI coding agent needs to choose one mode (learning, maintaining, consulting, iteration, prototyping, or finalization), discover components, apply design tokens, follow import conventions, and execute design-system workflows across Storybook, Figma MCP, Stitch MCP, and repo scripts.
---

# PLUS Design System Skill Router

## Identity

- **Specialty**: PLUS Design System (not generic web design)
- **Stack**: React 19, React-Bootstrap 2.10, Bootstrap 5.3, Vite 8, Storybook 10
- **Vocabulary**: Use PLUS terminology only (see [terminology](../docs/foundations/terminology.md))

## Skills

| Skill | Trigger | Auto-Suggest When | Next Step | Side Effects |
|-------|---------|-------------------|-----------|--------------|
| [uno-prototype](skills/uno-prototype/SKILL.md) | "scaffold", "new prototype", "create playground" | User describes a new feature idea without existing prototype | → uno-review | Creates files in playground/ |
| [uno-review](skills/uno-review/SKILL.md) | "review", "check", "validate", "quality check" | Before commit, before uno-post, user says "done" or "ready" | → uno-post (pass) / fix then uno-compound (fail) | Read-only |
| [uno-post](skills/uno-post/SKILL.md) | "submit", "publish", "add to market" | After uno-review passes | → uno-compound | Writes marketplace data file |
| [uno-compound](skills/uno-compound/SKILL.md) | "document", "write up", "compound", "save learning" | After significant work, after bug fix, session ending | Terminal | Writes solution doc, may propose instruction edits |

**Pipeline:** `uno-prototype → uno-review → uno-post → uno-compound`

Each skill's `## Auto-Suggest` and `## Next Step` sections contain the full conditions. The pipeline is a recommendation, not a requirement — users may skip steps.

## Mode Routing (Mutually Exclusive)

Choose exactly one mode per request:

1. **Learning** — `docs/design-system/modes/learning.md` — Understand what exists
2. **Maintaining** — `docs/design-system/modes/maintaining.md` — Update the DS itself
3. **Consulting** — `docs/design-system/modes/consulting.md` — Structure-first concepting
4. **Iteration** — `docs/design-system/modes/iteration.md` — Generate 3-5 variations
5. **Prototyping** — `docs/design-system/modes/prototyping.md` — High-fi, low-rigor PoCs
6. **Finalization** — `docs/design-system/modes/finalization.md` — Production-ready implementation

### Mode Inference

- "What is..." / "How does..." → **Learning**
- "Update the component" / "Sync tokens" → **Maintaining**
- "What should the layout be" → **Consulting**
- "Show me options" / "Compare approaches" → **Iteration**
- "Quick check" / "Hack this together" → **Prototyping**
- "Build this" / Figma link provided → **Finalization**

If ambiguous, ask: which mode, design-tool or scratch, and what fidelity.

## Grounding Rules

0. **Figma link → full implement-design workflow**: Load `references/figma-mcp-guide.md` and follow all 7 steps. Do not skip asset download, convention translation, or visual validation.
1. Never hardcode colors, spacing, typography, radius, or elevation when a token exists.
2. **THE CHEAT SHEET IS LAW:** Before writing any React component or CSS token, read `.agent/assets/PLUS_CHEAT_SHEET.md`.
3. **NEVER HALLUCINATE LAYOUTS:** Read `.agent/assets/PLUS_LAYOUT_CHEAT_SHEET.md` before building pages.
4. **NEVER HALLUCINATE PROPS:** Check component `.jsx` or `.stories.jsx` before using unfamiliar components.
5. Use PLUS components first; fall back to framework primitives only when no PLUS equivalent exists.
6. Cite concrete repository file paths when proposing implementations.
7. Say "I don't know" if unsure — ask instead of guessing.
8. Confirm plan before large edits. Include accessibility in finalization work.

## Deep References

Load these as needed — do not bulk-load:

- [Import Conventions](references/import-conventions.md) — Alias usage, barrel exports, entry points
- [Component Discovery](references/component-discovery.md) — How to find existing components before building new ones
- [Loading Order](references/loading-order.md) — Progressive loading rules, triggers table, context budget
- [Figma MCP Guide](references/figma-mcp-guide.md) — All Figma MCP tools, implement-design workflow, token mapping
- [Figma Token Mapping](references/figma-token-mapping.md) — Figma variable → PLUS CSS token mapping for `create_design_system_rules`

## Scope and Integrations

This repository includes: design system source (`design-system/src`), Storybook (`.storybook`), token sync scripts (`scripts/`), agent guidance (`.agent/`, `docs/design-system/*`), validation scripts (`.agent/skills/uno-review/scripts/*`).

Integrations: Figma MCP, Stitch MCP, Playwright MCP (optional). If MCP is unavailable, state it and continue with repo docs.

## References vs Assets Contract

- `references/`: markdown knowledge for context loading (workflows, patterns, mode guidance).
- `assets/`: non-markdown output artifacts and templates for generated output.
