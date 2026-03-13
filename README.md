# PLUS Vibe Coding Starting Kit

## 🚨 FOR AI AGENTS (READ FIRST) 🚨

AI Agents must IMMEDIATELY load and follow the instructions in:
**`.agent/SKILL.md`**

Go there now. Do not guess implementation.

Starter workspace for PLUS design-system prototyping and implementation.

## What This Repo Contains

- Design system package source: `packages/plus-ds/`
- Storybook configuration and stories: `.storybook/`, `packages/plus-ds/src/**/*.stories.jsx`
- Agent instruction system: `.agent/`
- Prototyping workspace: `playground/`

## Quick Start

```bash
npm install
npm run dev
```

Useful commands:

```bash
npm run storybook
npm run build
npm run build-storybook
npm run preview:react
npm run sync:tokens
npm run generate:tokens
```

## Agent Workflow

For AI coding agents:

1. Read `.agent/AGENT.md`
2. Route through `.agent/SKILL.md`
3. Select one mode:
   - `learning`
   - `maintaining`
   - `consulting`
   - `iteration`
   - `finalization`

Core references:

- `.agent/references/index.md`
- `.agent/references/tokens-guide.md`
- `.agent/references/components-guide.md`
- `.agent/references/patterns-guide.md`

### For Designers: When to Start a New Chat

To prevent the AI agent from getting confused or forgetting its instructions (token bloat), start a **new chat window** in these scenarios:

1. **Major Phase Shifts:** When moving from messy exploration (consulting/iteration) to strict execution (finalization).
2. **Context Window Degradation:** If the agent starts hallucinating component names or ignoring rules like the PLUS Cheat Sheet.
3. **Task Switching:** When you finish one feature/bug and move to an entirely unrelated one.
4. **Codebase State Desync:** If you manually refactor a lot of code yourself, or the agent gets stuck in a "death loop" trying to fix the same bug repeatedly.

## Design System Guidance

Primary DS documentation is under:

- `packages/plus-ds/guidelines/overview-components.md`
- `packages/plus-ds/guidelines/design-tokens/`
- `packages/plus-ds/guidelines/guides/figma-workflow.md`
- `packages/plus-ds/guidelines/guides/Storybook.md`

## Prototyping

- Use `playground/templates/` for reusable starts.
- Use `playground/prototyping/` for designer/feature experiments.
- Keep implementation tokenized and aligned with DS component usage.

## Notes

- This repo uses Vite + Storybook; outdated CSS-watch/server workflows are removed.
- Keep instruction docs centralized in `.agent/`.
