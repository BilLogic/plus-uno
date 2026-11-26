---
embodiment: ide
summary: Clone, install, run, and find your way around — without reading the constitution first.
---

# Setup

Getting plus-uno running, and knowing where you are once it is. If you want the
rules an agent works under, that is `AGENTS.md`; if you want the estate's
vocabulary, that is `GLOSSARY.md`. Neither is required to get a dev server up.

## Run it

```bash
git clone https://github.com/BilLogic/plus-uno.git
cd plus-uno
npm install
npm run dev          # Storybook (4200)
```

| Where | What you get |
|-------|--------------|
| [localhost:4200](http://localhost:4200) | Storybook — the design system, and the source of truth for what a component does |

Every command lives in `package.json`. It is the only place a command or a
version is stated — if a doc lists one, the doc is wrong.

## What you are looking at

Four things share this repo, and knowing which one you are in saves most of the
confusion:

| Thing | Where | What it is |
|-------|-------|------------|
| **Design system** | `design-system/src/` | Components, templates, data visualizations (`src/dataviz/`) and tokens (`src/tokens/`, generated, never hand-edited), with guidelines in `design-system/guidelines/`. Published as Storybook. |
| **Prototypes** | `prototypes/` | Standalone Vite apps, one per idea. `skills/uno-prototype/scripts/scaffold-prototype.sh` writes a new one. |
| **The harness** | `AGENTS.md`, `skills/`, `agents/`, `docs/` | What agents read. Not shipped to users. |
| **uno-bot** | `agents/uno-bot/` | The Slack embodiment — a Cloudflare Worker, deployed separately. |

## Where things live

- **Product truth** is uno-blueprint (Supabase); ask through a skill rather than trusting a stale doc.
- **Design-system truth** is Storybook plus the `design-system/` source.
- **Team conventions** are `docs/conventions/` in this repo; legacy Notion playbook pages are superseded.
- **Project docs** are each project's Notion hub (TLDR, People, Now/Next/Blocked).
- **This repo's history** is `docs/adr/` for decisions, and git history plus closed GitHub issues for everything that landed.

## Your first week

You talk to **uno** in the IDE, or as `@le goat` in Slack, and either name a skill or describe the task; the agent routes. The six skills are in [`README.md`](README.md) § uno skills, and skills summon the agents in `agents/`, so you never invoke an agent directly.

The MCP servers the agent uses are Figma (required for design work), Notion, Slack (through uno-bot) and Supabase; each tool's setup is its row in `docs/connectors/overview.md`. The compound-engineering skills (`/ce:plan`, `/ce:work`, `/ce:review`, `/ce:compound`) help with repo development.

If you cannot self-serve from a project's Notion hub plus this page, that is a documentation bug: file it through `uno-maintain`.

## Working on the design system

Read `design-system/guidelines/overview.md` first — it routes through the five
build stages (Template, Blocks, Pieces, Polish, Motion) and the Figma protocol.
Setup specifics (aliases, package structure, token workflow) are
`docs/engineering/setup.md`.

Two rules that will bite you otherwise:

- Import from the barrel — `import { Button } from '@/components'` — never deep-import from `design-system/src/`.
- Every color, space, radius and shadow comes from a token. `design-system/agent-views/tokens/tokens.md` is the generated list of names.

## Working on the harness

`INDEX.md` routes by task. `AGENTS.md` is the constitution every agent loads
first. Changes to what agents read go through `skills/uno-maintain`.

## Deploying

A PR gets a Netlify deploy preview; production publishes only on a release. Targets and workflows: [`README.md`](README.md) § Deployment.
