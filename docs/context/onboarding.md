# Onboarding — humans start here

New designer, PM, developer, or intern: this page + the six skills are all you memorize. (Agents entering the repo read `AGENTS.md` instead.)

## Quick start

```bash
git clone https://github.com/BilLogic/plus-uno.git && cd plus-uno && npm install
npm run dev          # Vite (4100) + Storybook (4200)
```

## The one thing to learn: six skills

You talk to **uno** (in the IDE, or @uno-bot in Slack) in terms of what you want. Either name the skill or just describe the task — the agent routes.

| Say / invoke | When you want |
|---|---|
| `uno-research` | context gathered: user studies, Slack history, analytics, codebase |
| `uno-synthesize` | findings turned into takeaways and a PRD |
| `uno-prototype` | a prototype built from a PRD (it picks the right fidelity) |
| `uno-publish` | work shared for feedback, or handed off to dev (Handoff Spec + bundle) |
| `uno-review` | design-system / product-intent / accessibility review, or Design QA vs the Figma spec |
| `uno-maintain` | something's off — file it; small fixes auto-apply, big ones become PR + PRD |

You never invoke agents directly — skills summon them (that's the `agents/` folder; internal machinery).

## Where things live

- **Product truth** → uno-blueprint (Supabase); ask via a skill, don't trust stale docs.
- **Design-system truth** → Storybook (plus-uno.netlify.app/storybook) + `design-system/` source.
- **Team conventions** → `docs/conventions/` in this repo (canonical); legacy Notion playbook pages are superseded.
- **Project docs** → each project's Notion hub (TLDR → People → Now/Next/Blocked → …).
- **This repo's history** → `docs/knowledge/` (lessons, ADRs); superseded things in `archive/`, never deleted.

## Tooling

MCP servers used by the agent: Figma (required for design work), Notion, Slack (via uno-bot), Supabase. Setup lives with each tool's row in `docs/conventions/integrations.md`. Compound-engineering skills (`/ce:plan`, `/ce:work`, `/ce:review`, `/ce:compound`) remain useful for repo development work.

## Your first week test

If you can't self-serve from a project's Notion hub + this page, that's a documentation bug — file it via `uno-maintain`.
