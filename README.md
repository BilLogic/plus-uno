# plus-uno

Design system, prototyping workspace, and agent infrastructure for the [PLUS tutoring platform](https://tutors.plus/).

## Quick Start

```bash
npm install
npm run dev          # Vite (4100) + Storybook (4200) concurrent
npm run dev:vite     # Vite only → localhost:4100
npm run storybook    # Storybook only → localhost:4200
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
- Product context → `docs/context/product/`
- Design system modes → `.agent/SKILL.md`
- Forbidden patterns, skills, commands, progressive loading

See `docs/setup-guide.md` for full onboarding.

## Tech Stack

React 19 · React-Bootstrap 2.10 · Bootstrap 5.3 · Vite 8 · Storybook 10 · SASS · Highcharts 12 · Font Awesome Free 7.2

## Commands

| Command | What |
|---------|------|
| `npm run dev` | Vite + Storybook concurrent (ports 4100 + 4200) |
| `npm run dev:vite` | Vite only (port 4100) |
| `npm run storybook` | Storybook only (port 4200) |
| `npm run build` | Production build |
| `npm run build-storybook` | Storybook static site |
| `npm run sync:tokens` | Sync tokens from Figma |
| `npm run generate:tokens` | Generate SCSS from token source |
| `npm run dev:home-redesign` | Home redesign prototype |
| `npm run dev:monthly-report` | Monthly report prototype |

## Documentation

- `docs/context/product/plus-app.md` — PLUS product landscape (mission, users, features, flows)
- `docs/context/product/plus-uno.md` — This repo's structure and inventory
- `docs/context/conventions/coding.md` — File naming, imports, git, gotchas
- `docs/context/design-system/` — DS foundations, components, styles, conventions
- `docs/context/conventions/terminology.md` — PLUS terminology
- `docs/context/conventions/tech-stack.md` — Tech stack
- `docs/knowledge/lessons/` — Compound loop (documented learnings)
