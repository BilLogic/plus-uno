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
| **Design system** | `design-system/src/` | The components, patterns and tokens. Published as Storybook. |
| **Prototypes** | `prototypes/` | Standalone Vite apps, one per idea. `skills/uno-prototype/scripts/scaffold-prototype.sh` writes a new one. |
| **The harness** | `AGENTS.md`, `skills/`, `agents/`, `docs/` | What agents read. Not shipped to users. |
| **uno-bot** | `agents/uno-bot/` | The Slack embodiment — a Cloudflare Worker, deployed separately. |

## Working on the design system

Read `design-system/guidelines/overview.md` first — it routes to the fourteen
foundations, the component guidance, composition, and the Figma protocol.
Setup specifics (aliases, package structure, token workflow) are
`docs/engineering/setup.md`.

Two rules that will bite you otherwise:

- Import from the barrel — `import { Button } from '@/components'` — never deep-import from `design-system/src/`.
- Every color, space, radius and shadow comes from a token. `design-system/agent-views/tokens/tokens.md` is the generated list of names.

## Working on the harness

`INDEX.md` routes by task. `AGENTS.md` is the constitution every agent loads
first. Changes to what agents read go through `skills/uno-maintain`.

## Deploying

A PR gets a Netlify deploy preview; a merge to `main` does not publish. The
app and Storybook reach production only when a release is called, through
`.github/workflows/netlify-production-deploy.yml` run by hand. uno-bot deploys
separately, on every push to `main`: `.github/workflows/uno-bot-deploy.yml`
runs `npm run deploy` in `agents/uno-bot/`, which runs its checks, tests and
the harness bake before it ships anything.
