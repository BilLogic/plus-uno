# plus-uno

[![Netlify Status](https://api.netlify.com/api/v1/badges/9808dbb9-70ab-438e-b3c3-69d18441f0d4/deploy-status)](https://app.netlify.com/projects/plus-uno/deploys)

Design system, prototyping workspace, and agent infrastructure for the [PLUS tutoring platform](https://tutors.plus/).

**Live site:** [plus-uno.netlify.app](https://plus-uno.netlify.app) (Marketplace + Storybook)

## Quick Start

```bash
git clone https://github.com/BilLogic/plus-uno.git
cd plus-uno
npm install
npm run dev          # Vite (4100) + Storybook (4200) concurrent
```

Open [localhost:4100](http://localhost:4100) for the Prototype Marketplace, [localhost:4200](http://localhost:4200) for Storybook.

## Repository Structure

```
plus-uno/
├── AGENTS.md                      # Single source of truth for all AI agents
├── design-system/src/             # Component library (44 components, 74 forms, 9 DataViz, 8 specs)
├── playground/                    # 22 prototype projects — browse at /market
├── src/                           # Vite app entry + Prototype Marketplace
├── .storybook/                    # Storybook 10 configuration
├── scripts/                       # Token sync, Figma automation, preview generation
│
├── docs/
│   ├── context/                   # Descriptive — product, design-system foundations, onboarding
│   │   ├── product/               # PLUS app landscape, users, features, flows
│   │   └── design-system/         # Foundations, components, styles
│   ├── conventions/               # Normative rules — tool mirrors, voice, automations registry
│   ├── evals/                     # Quality loop — rubrics, scenarios, runs
│   ├── knowledge/                 # Append-only — lessons, ADRs, research, archive
│   └── plans/                     # Dated implementation plans
│
├── skills/                        # HOW — six capabilities, each with SKILL.md (IDE) + bot.md (Worker)
│   ├── uno-research/              # Gather context, instrument-first
│   ├── uno-synthesize/            # Findings → PRD; blueprint updates
│   ├── uno-prototype/             # PRD → prototype, fidelity-routed
│   ├── uno-publish/               # Share-out bundle · handoff · marketplace
│   ├── uno-review/                # DS / UNO / a11y lenses · Design QA
│   └── uno-maintain/              # Intake · Tier 1/2 · sync · knowledge capture
│
├── agents/                        # WHO — researchers/ · reviewers/ · writers/ + uno-bot/ (Worker)
│
└── AGENTS.md                      # Read natively by Claude Code, Cursor, Windsurf, Copilot — no pointer files
```

## Agent System

All AI coding agents (Claude Code, Cursor, Windsurf, GitHub Copilot — all read the AGENTS.md standard natively) read **`AGENTS.md`** — the single constitution: identity, the six-skill roster, forbidden patterns. No rules are duplicated anywhere. Loading tiers and budgets: `loading-order.md`.

**The interaction contract: humans speak in skills · skills summon agents · agents obey conventions.**

You invoke (or just describe your intent and get routed to) one of six skills — `uno-research` · `uno-synthesize` · `uno-prototype` · `uno-publish` · `uno-review` · `uno-maintain`. The canonical table with Use-when triggers lives in `AGENTS.md` § Skills — deliberately not duplicated here (single-source rule). Skills summon internal agents (`agents/` — researchers · reviewers · writers, plus the uno-bot Slack Worker); the conventions they obey live in `docs/conventions/`. New here? Start at `docs/context/onboarding.md`.

### Knowledge Compounding

After significant work, lessons land in `docs/knowledge/` via `uno-maintain` — patterns that worked, pitfalls, ADRs. Future sessions check this base before starting, so institutional memory compounds.

## Prototype Marketplace

The Marketplace at `/market` is the central hub for all design prototypes. Each prototype is a standalone Vite app under `playground/`.

### For Interns: Creating a New Prototype

1. Copy `playground/starter/` as your template
2. Build your prototype (use the design system components!)
3. Invoke `uno-publish` to register it in the Marketplace
4. Open a PR against `main` — Netlify auto-generates a **Deploy Preview** link
5. Share the preview link for feedback — no merge needed

### Browsing Prototypes

- **Local:** `npm run dev` → [localhost:4100/market](http://localhost:4100/market)
- **Live:** [plus-uno.netlify.app/market](https://plus-uno.netlify.app/market)

Prototypes are filterable by fidelity stage (Low/Mid/High-fi) and product pillar (Admin, Home, Toolkit, Training, etc.).

## Design System

The component library lives in `design-system/src/` with 44 components, 74 form elements, 9 DataViz wrappers, and 8 page specs.

**Key rules for agents and contributors:**
- Use PLUS components first — only fall back to React-Bootstrap when no PLUS equivalent exists
- Never hardcode colors, spacing, or typography — use design tokens
- Read the cheat sheet (`docs/context/design-system/components/cheat-sheet.md`) before building
- No Tailwind, Material UI, or Ant Design in components or prototypes (Bootstrap + SCSS only)

Browse the component library at [localhost:4200](http://localhost:4200) (Storybook).

## Deployment

| Environment | URL | Trigger |
|-------------|-----|---------|
| **Production** | [plus-uno.netlify.app](https://plus-uno.netlify.app) | Push to `main` |
| **Deploy Preview** | `deploy-preview-{PR#}--plus-uno.netlify.app` | Open a PR against `main` |

Hosted on Netlify (free tier). Build: `npm run build:all` (Vite + Storybook). Deploy previews are automatic on every PR — no manual deploy needed.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | React 19 + React-Bootstrap 2.10 + Bootstrap 5.3 |
| Build | Vite 8 |
| Component Docs | Storybook 10 |
| Styling | SCSS modules + design tokens |
| Charts | Highcharts 12 |
| Icons | Font Awesome Free 7.2 |
| Deployment | Netlify |
| Figma Sync | Custom scripts (`scripts/sync-figma-tokens.js`, `scripts/poll-figma-library.js`) |

## Commands

| Command | What |
|---------|------|
| `npm run dev` | Vite + Storybook concurrent (ports 4100 + 4200) |
| `npm run dev:vite` | Vite only (port 4100) |
| `npm run storybook` | Storybook only (port 4200) |
| `npm run build` | Production build |
| `npm run build:all` | Build app + Storybook |
| `npm run test` | Run component tests |
| `npm run sync:tokens` | Sync tokens from Figma |
| `npm run generate:tokens` | Generate SCSS from token source |
| `npm run generate:previews` | Generate prototype preview images |
| `npm run dev:home-redesign` | Home redesign prototype |
| `npm run dev:monthly-report` | Monthly report prototype |
| `npm run dev:toolkit-ia-revision` | Toolkit IA prototype |

## Documentation

| Document | What |
|----------|------|
| `docs/context/onboarding.md` | Onboarding — the six skills + where things live |
| `docs/context/product/plus-app.md` | PLUS product landscape (mission, users, features, flows) |
| `docs/context/product/plus-uno.md` | This repo's structure and inventory |
| `docs/conventions/coding.md` | File naming, imports, git conventions |
| `docs/context/design-system/` | DS foundations, components, styles |
| `docs/conventions/terminology.md` | PLUS domain terminology |
| `docs/conventions/tech-stack.md` | Full tech stack with versions |
| `docs/knowledge/INDEX.md` | Knowledge base index (lessons, decisions, preferences) |
| `agents/README.md` | Agent roster, anatomy, creation rule |

## Contributing

1. Create a feature branch from `main`
2. Make your changes (follow `AGENTS.md` conventions)
3. Open a PR — Netlify will auto-build a Deploy Preview
4. Share the preview link for review
5. After approval, merge to `main` — production auto-deploys
