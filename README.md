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
│   ├── context/                   # Tier 1 — product, conventions, design system foundations
│   │   ├── product/               # PLUS app landscape, users, features, flows
│   │   ├── conventions/           # Coding standards, tech stack, terminology
│   │   └── design-system/         # Foundations, components, styles
│   ├── knowledge/                 # Compound loop — lessons, decisions, preferences
│   ├── plans/                     # Implementation plans
│   └── setup-guide.md             # Full onboarding guide
│
├── .agent/                        # Agent infrastructure
│   ├── SKILL.md                   # Skill router — 6 skills, routing logic
│   ├── AGENT.md                   # Pipeline orchestration, compaction protocol
│   ├── loading-order.md           # Three-tier loading contract
│   └── skills/                    # Tier 2 — on-demand skill contexts
│       ├── uno-research/          # Explore design system, components, patterns
│       ├── uno-plan/              # Scope and plan implementation
│       ├── uno-prototype/         # Build prototypes with DS conventions
│       ├── uno-review/            # Quality gate before shipping
│       ├── uno-post/              # Submit to Prototype Marketplace
│       └── uno-compound/          # Document learnings for future sessions
│
└── Cross-agent pointers           # One source of truth, multiple editors
    ├── CLAUDE.md                  # Claude Code → @AGENTS.md
    ├── .cursor/rules/plus-agent.mdc   # Cursor → AGENTS.md
    ├── .windsurf/rules/agent.md       # Windsurf → AGENTS.md
    └── .github/copilot-instructions.md # GitHub Copilot → AGENTS.md
```

## Agent System

All AI coding agents (Claude Code, Cursor, Windsurf, GitHub Copilot) read **`AGENTS.md`** as the entry point. Each platform has a thin pointer file that redirects to it — no rules are duplicated.

### Three-Tier Context Architecture

| Tier | What | When Loaded | Budget |
|------|------|-------------|--------|
| **Tier 1** | Identity, conventions, principles, forbidden patterns | Always (via `AGENTS.md` "See" refs) | < 200 lines |
| **Tier 2** | Skill-specific references (cheat sheets, indexes, guides) | On skill trigger | 3K–5K tokens per skill |
| **Tier 3** | Handoff artifacts between skills | Ephemeral, gitignored | Session-only |

### Skills Pipeline

```
uno-research → uno-plan → uno-prototype → uno-review → (iterate) → uno-post → uno-compound
```

| Skill | Trigger | What It Does |
|-------|---------|-------------|
| `uno-research` | "What is…", "How does…" | Explore DS components, patterns, conventions |
| `uno-plan` | "Plan", "scope", "how should we build" | Create structured implementation plans |
| `uno-prototype` | Build/scaffold work | Prototype with DS conventions and tokens |
| `uno-review` | Quality check | Validate against DS rules before shipping |
| `uno-post` | "Submit", "publish" | Register prototype in the Marketplace |
| `uno-compound` | After significant work | Document learnings for future sessions |

### Knowledge Compounding

After completing work, agents document lessons in `docs/knowledge/` — patterns that worked, pitfalls to avoid, architecture decisions. Future sessions check this knowledge base before starting, so the team's institutional memory grows over time.

## Prototype Marketplace

The Marketplace at `/market` is the central hub for all design prototypes. Each prototype is a standalone Vite app under `playground/`.

### For Interns: Creating a New Prototype

1. Copy `playground/starter/` as your template
2. Build your prototype (use the design system components!)
3. Run `/uno:post` to register it in the Marketplace
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
| `docs/setup-guide.md` | Full onboarding guide (recommended CE skills, MCP servers) |
| `docs/context/product/plus-app.md` | PLUS product landscape (mission, users, features, flows) |
| `docs/context/product/plus-uno.md` | This repo's structure and inventory |
| `docs/context/conventions/coding.md` | File naming, imports, git conventions |
| `docs/context/design-system/` | DS foundations, components, styles |
| `docs/context/conventions/terminology.md` | PLUS domain terminology |
| `docs/context/conventions/tech-stack.md` | Full tech stack with versions |
| `docs/knowledge/INDEX.md` | Knowledge base index (lessons, decisions, preferences) |
| `.agent/platform-integration.md` | Cross-agent pointer file architecture |

## Contributing

1. Create a feature branch from `main`
2. Make your changes (follow `AGENTS.md` conventions)
3. Open a PR — Netlify will auto-build a Deploy Preview
4. Share the preview link for review
5. After approval, merge to `main` — production auto-deploys
