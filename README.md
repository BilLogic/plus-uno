# plus-uno

[![Netlify Status](https://api.netlify.com/api/v1/badges/9808dbb9-70ab-438e-b3c3-69d18441f0d4/deploy-status)](https://app.netlify.com/projects/plus-uno/deploys)

Design system, prototyping workspace, and agent infrastructure for the [PLUS tutoring platform](https://tutors.plus/) (500+ college tutors, 3,000+ K-12 students). This is a **prototype builder and design workspace — not a production app**.

**Live site:** [plus-uno.netlify.app](https://plus-uno.netlify.app) (Prototype Marketplace + Storybook)

## Quick Start

```bash
git clone https://github.com/BilLogic/plus-uno.git
cd plus-uno
npm install
npm run dev          # Vite (4100) + Storybook (4200) concurrent
```

Open [localhost:4100](http://localhost:4100) for the Prototype Marketplace, [localhost:4200](http://localhost:4200) for Storybook.

## What is uno?

**uno** is the PLUS design team's AI agent — one identity that shows up in three places:

| Embodiment | Where you meet it | What it's for |
|---|---|---|
| **In-IDE agent** | Claude Code, Cursor, Windsurf, Copilot — any tool that reads `AGENTS.md` | The full-capability face: research, synthesis, prototyping, review, repo edits |
| **uno-bot** | `@uno-bot` in Slack | Grounded Q&A + gated actions (file PRDs, trigger builds) — see [`agents/uno-bot/README.md`](agents/uno-bot/README.md) |
| **Headless runs** | GitHub Actions (`Implement Design`, `Implement Figma Changes`) | Figma-to-code builds that open draft PRs |

All three read the same brain: [`AGENTS.md`](AGENTS.md) (the constitution — identity, skill roster, forbidden patterns) plus [`loading-order.md`](loading-order.md) (what loads when). Push a doc change to `main` and every embodiment picks it up — no code deploy needed for guidance changes.

**The interaction contract: humans speak in skills · skills summon agents · agents obey conventions.**

### The six skills (what you invoke)

You either name a skill or just describe what you want — uno routes. In plain terms:

| Skill | You want… |
|---|---|
| `uno-research` | context gathered: user studies, Slack history, analytics, codebase |
| `uno-synthesize` | findings turned into takeaways and a PRD |
| `uno-prototype` | a prototype built from a PRD or Figma design (fidelity-routed: low / mid / hi-fi) |
| `uno-publish` | work shared for feedback, handed off to dev, or registered in the Marketplace |
| `uno-review` | design-system / product-intent / accessibility review, or Design QA vs the Figma spec |
| `uno-maintain` | something's off — file it; small fixes auto-apply, big ones become PR + PRD |

The canonical routing table (Use-when triggers + which agents each skill summons) lives in `AGENTS.md` § Skills — single source, deliberately not restated here. Each skill folder has two faces: `SKILL.md` (IDE) and `bot.md` (Slack Worker), both built on the same `references/method.md`.

### The agents (what skills summon — internal, never invoked by users)

`agents/` holds three plain kinds plus one embodiment: **researchers/** gather (explorer · source-miner · people-scout), **reviewers/** judge (ds-lens · uno-lens · a11y-lens · design-qa · rubric-applier · auditor), **writers/** are the only roles allowed to write to external estates (notion · figma · blueprint), and **uno-bot/** is the Slack embodiment (persona + Cloudflare Worker). Roster and rules: [`agents/README.md`](agents/README.md).

### Knowledge compounding

After significant work, lessons land in `docs/knowledge/` via `uno-maintain` — patterns that worked, pitfalls, ADRs. Future sessions check this base before starting, so institutional memory compounds.

## Repository Structure

```
plus-uno/
├── AGENTS.md                      # Tier 1 — the agent constitution (read this first)
├── loading-order.md               # Tier 1 — what loads when, and token budgets
├── design-system/
│   ├── src/                       # Component library source + Storybook MDX
│   ├── docs/                      # Hand-authored DS knowledge (discovery, patterns, token-mapping)
│   ├── agent-views/               # Generated agent views (DO NOT EDIT BY HAND)
│   └── figma/                     # Figma registries + alignment runbooks
├── playground/                    # ~20 feature prototypes (+ starter/, templates/, test-*) — browse at /market
├── src/                           # Vite app entry + Prototype Marketplace
├── .storybook/                    # Storybook 10 configuration
├── scripts/                       # Token sync, Figma automation, Actions codegen, preview generation
│
├── docs/
│   ├── context/                   # Descriptive — product, design-system foundations, onboarding
│   ├── conventions/               # Normative rules — notion, figma, slack, supabase, writing style, automations
│   ├── evals/                     # Quality loop — rubrics, scenarios, runs
│   ├── knowledge/                 # Append-only — lessons, ADRs, research, archive
│   └── plans/                     # Dated implementation plans
│
├── skills/                        # HOW — six capabilities, each with SKILL.md (IDE) + bot.md (Worker)
└── agents/                        # WHO — researchers/ · reviewers/ · writers/ + uno-bot/ (Slack Worker)
```

## Prototype Marketplace

The Marketplace at `/market` is the central hub for all design prototypes. Each prototype is a standalone Vite app under `playground/`.

### Creating a new prototype

1. Copy `playground/starter/` as your template
2. Build your prototype (use the design system components!)
3. Invoke `uno-publish` to register it in the Marketplace
4. Open a PR against `main` — Netlify auto-generates a **Deploy Preview** link
5. Share the preview link for feedback — no merge needed

### Browsing prototypes

- **Local:** `npm run dev` → [localhost:4100/market](http://localhost:4100/market)
- **Live:** [plus-uno.netlify.app/market](https://plus-uno.netlify.app/market)

Prototypes are filterable by fidelity stage (Low/Mid/High-fi) and product pillar (Admin, Home, Toolkit, Training, etc.).

## Design System

The component library lives in `design-system/src/`: **44 components, 20 form components, 42 DataViz charts (6 categories), and page specs for 7 product areas** — full inventory in [`docs/context/product/plus-uno.md`](docs/context/product/plus-uno.md). Browse it at [localhost:4200](http://localhost:4200) (Storybook) or [live](https://plus-uno.netlify.app/storybook/).

**Key rules for agents and contributors:**
- Use PLUS components first — only fall back to React-Bootstrap when no PLUS equivalent exists
- Never hardcode colors, spacing, or typography — use design tokens
- Start at `design-system/docs/discovery.md` before building UI
- After editing component MDX or token-mapping: `npm run generate:agent`
- No Tailwind, Material UI, or Ant Design in components or prototypes — Bootstrap + SCSS only. (Tailwind appears in devDependencies solely for the internal Storybook docs pages under `design-system/src/storybook-docs/`; it is off-limits in DS components and playground prototypes.)

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
| Icons | Font Awesome Free 7.2 (no Pro icons — enforced) |
| Deployment | Netlify |
| Slack bot runtime | Cloudflare Worker (`agents/uno-bot/`) |
| Figma Sync | Custom scripts (`scripts/sync-figma-tokens.js`, `scripts/poll-figma-library.js`) |

## Commands

| Command | What |
|---------|------|
| `npm run dev` | Vite + Storybook concurrent (ports 4100 + 4200) |
| `npm run dev:vite` | Vite only (port 4100) |
| `npm run storybook` | Storybook only (port 4200) |
| `npm run build` | Production build |
| `npm run build:all` | Build app + Storybook |
| `npm run build-storybook` | Build Storybook static site only |
| `npm run test` | Run component tests |
| `npm run sync:tokens` | Sync tokens from Figma |
| `npm run generate:tokens` | Generate SCSS from token source |
| `npm run generate:agent` | Regenerate agent-views + Figma registries + audit |
| `npm run generate:figma-links` | Regenerate the component ↔ Figma links spreadsheet |
| `npm run generate:previews` | Generate prototype preview images |
| `npm run dev:<slug>` | Run a single prototype (e.g. `dev:home-redesign`, `dev:monthly-report`) |

## Documentation

| Document | What |
|----------|------|
| [`docs/context/onboarding.md`](docs/context/onboarding.md) | **New here? Start with this** — the six skills + where things live |
| [`AGENTS.md`](AGENTS.md) | Agent constitution — identity, skill roster, forbidden patterns |
| [`loading-order.md`](loading-order.md) | The loading-tier contract (what loads when) |
| [`docs/context/product/plus-app.md`](docs/context/product/plus-app.md) | PLUS product landscape (mission, users, features, flows) |
| [`docs/context/product/plus-uno.md`](docs/context/product/plus-uno.md) | This repo's structure and inventory |
| [`docs/conventions/`](docs/conventions/) | Normative rules — coding, terminology, tech stack, Notion/Figma/Slack/Supabase, writing style |
| [`docs/knowledge/INDEX.md`](docs/knowledge/INDEX.md) | Knowledge base index (lessons, decisions, preferences) |
| [`agents/README.md`](agents/README.md) | Agent roster, anatomy, creation rule |
| [`agents/uno-bot/README.md`](agents/uno-bot/README.md) | The Slack bot — architecture, setup, capabilities |

## Contributing

1. Create a feature branch from `main`
2. Make your changes (follow `AGENTS.md` conventions)
3. Open a PR — Netlify will auto-build a Deploy Preview
4. Share the preview link for review
5. After approval, merge to `main` — production auto-deploys
