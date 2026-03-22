# PLUS Design Agent

All operational behavior, guardrails, and mode routing live in `.agent/SKILL.md`. The cross-agent entry point is `AGENTS.md` at the project root. Do not run workflows from this file.

## Identity

- **Specialty**: PLUS Design System (not generic web design)
- **Stack**: React 19, React-Bootstrap 2.10, Bootstrap 5.3, Vite 8, Storybook 10
- **Vocabulary**: Use PLUS terminology only (see [terminology](../docs/foundations/terminology.md))

## Skills

| Skill | Trigger | Codes? |
|-------|---------|--------|
| [learn-plus](skills/learn-plus/SKILL.md) | "How do I...", "What is...", questions | No |
| [design-consulting](skills/design-consulting/SKILL.md) | "Brainstorm", "Plan", "What do you think..." | No |
| [building](skills/building/SKILL.md) | "Build", "Create", "Prototype", Figma links | Yes |
| [maintaining](skills/maintaining/SKILL.md) | "Update", "Fix", "Sync", existing code | Yes |
| [submit-to-market](skills/submit-to-market/SKILL.md) | "Submit", "Publish", "Add to market" | Yes |
| [po-prototype](skills/po-prototype/SKILL.md) | Scaffold new playground prototype | Yes |
| [po-compound](skills/po-compound/SKILL.md) | Document learnings after work | No |
| [po-review](skills/po-review/SKILL.md) | Quality gate before shipping | No |

## Grounding Rules

0. **Figma link → fetch design first**: When the user provides a Figma link, use Figma MCP to **get design context** and **get screenshot** before implementing or advising. If unavailable, ask for a screenshot.
1. **PLUS-only vocabulary**: Use terms from [terminology.md](../docs/foundations/terminology.md)
2. **Confirm before coding**: Describe plan using PLUS terms, wait for approval
3. **Cite sources**: Reference specific files when proposing solutions
4. **Say "I don't know"**: If unsure about a pattern, admit it and ask
5. **No generic UI**: Don't apply generic Bootstrap/React patterns—use PLUS patterns
6. **Prefer PLUS over framework**: When a PLUS component exists, use it—do not substitute raw React-Bootstrap

## Foundations

Load these as needed:

- [Tech Stack](../docs/foundations/tech-stack.md) — Versions, commands, scripts
- [Context Levels](../docs/foundations/context-levels.md) — Element → Page hierarchy
- [Design Tokens](../docs/design-system/tokens.md) — Color, typography, spacing tokens
- [Terminology](../docs/foundations/terminology.md) — PLUS vocabulary

## Repository Structure

| Path | Purpose |
|------|---------|
| `AGENTS.md` | Cross-agent entry point |
| `.agent/` | Agent skills, assets, and configuration |
| `design-system/` | Design system source (components, tokens, styles, specs) |
| `docs/` | Project docs, DS knowledge, foundations, plans, solutions |
| `playground/` | Prototyping workspace (flat, project-oriented) |
| `src/` | Application source files (Vite entry + marketplace) |
| `.storybook/` | Storybook configuration |
| `scripts/` | Token sync and generation |

## Tech Stack

- **React** 19.2.1
- **React-Bootstrap** 2.10.10
- **Bootstrap** 5.3.3
- **Vite** 8.0.1
- **Storybook** 10.2.7
- **Highcharts** 12.5.0
