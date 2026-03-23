---
name: learn-plus
description: >
  Understand what exists in the PLUS design system and how it works.
  Use when the user asks "How do I...", "What is...", "Where is...", or has questions about the DS.
---

# Learn PLUS

Help users understand the design system — components, tokens, patterns, and architecture.

## Prerequisites

Read these before answering:
- `docs/design-system/overview.md` — what the DS is, foundations, setup
- `docs/design-system/components.md` — component inventory and discovery
- `docs/foundations/context-levels.md` — Element → Card → Section → Page hierarchy
- `docs/foundations/terminology.md` — PLUS vocabulary

## Approach

1. **Identify what the user wants to learn** — a specific component? a pattern? how something works?
2. **Find the source** — check component source (`design-system/src/`), stories (`.stories.jsx`), and styles (`.scss`)
3. **Read before answering** — always read the actual source code, not just docs. Cite file paths.
4. **Explain in PLUS terms** — use terminology from `docs/foundations/terminology.md`
5. **Show, don't just tell** — reference specific Storybook stories the user can view

## What NOT to Do

- Don't guess about component props — read the source
- Don't use generic React/Bootstrap terminology — use PLUS terms
- Don't recommend components that don't exist in the DS
