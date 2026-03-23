# plus-uno

Design system, prototyping workspace, and agent infrastructure for the [PLUS tutoring platform](https://tutors.plus/).

## Quick Start

```bash
npm install
npm run storybook    # Component library → localhost:6006
npm run dev          # Marketplace app → localhost:3000
```

## What's In This Repo

| Directory | What |
|-----------|------|
| `design-system/src/` | Component source — 46 components, 61 forms, 11 DataViz, 10 specs, 9 token categories |
| `playground/` | 21 prototype projects (flat, project-oriented) — browse at `/market` |
| `docs/` | Project docs, DS knowledge, foundations, plans, compound loop |
| `.agent/` | Agent skills, assets, cheat sheets |
| `src/` | Vite app entry + Prototype Marketplace |
| `.storybook/` | Storybook configuration |
| `scripts/` | Token sync and generation |

## Agent Workflow

All coding agents (Claude Code, Cursor, Windsurf) read `AGENTS.md` as the entry point. It covers:
- Product context → `docs/project/`
- Design system modes → `.agent/SKILL.md`
- Forbidden patterns, skills, commands, progressive loading

See `docs/project/setup-guide.md` for full onboarding.

## Tech Stack

React 19 · React-Bootstrap 2.10 · Bootstrap 5.3 · Vite 6 · Storybook 10 · SASS · Highcharts 12 · Font Awesome Free 7.2

## Commands

| Command | What |
|---------|------|
| `npm run dev` | Vite dev server (port 3000) |
| `npm run storybook` | Storybook (port 6006) |
| `npm run build` | Production build |
| `npm run build-storybook` | Storybook static site |
| `npm run sync:tokens` | Sync tokens from Figma |
| `npm run generate:tokens` | Generate SCSS from token source |
| `npm run dev:home-redesign` | Home redesign prototype |
| `npm run dev:monthly-report` | Monthly report prototype |

## Documentation

- `docs/project/plus-app.md` — PLUS product landscape (mission, users, features, flows)
- `docs/project/plus-uno.md` — This repo's structure and inventory
- `docs/project/conventions.md` — File naming, imports, git, gotchas
- `docs/design-system/` — 23 consolidated DS docs (overview, components, tokens, modes, guides)
- `docs/foundations/` — PLUS terminology, tech stack, context levels
- `docs/solutions/` — Compound loop (documented learnings)
