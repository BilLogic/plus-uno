<!-- Tier: 2 -->
# plus-uno — Repository Overview

This repo is the design system, prototyping workspace, and agent infrastructure for the PLUS tutoring platform.

## What This Is

- **Design System** (`design-system/src/`) — 46 components, 61 form elements, 11 data viz, 10 composite specs, 9 token categories, 11 style files. Published internally as `@plus-ds` alias.
- **Prototyping Workspace** (`playground/`) — 21 flat project directories for feature prototypes. Discoverable via the Marketplace at `/market`.
- **Storybook** (`.storybook/`) — Interactive component documentation and visual testing. Deployed to Netlify.
- **Agent Harness** (`AGENTS.md`, `skills/`, `agents/`) — the constitution, six dual-face skills, and the agent roster incl. the uno-bot Slack Worker (`agents/uno-bot/`).
- **Product Documentation** (`docs/`) — context (descriptive), conventions (normative), evals, knowledge, plans.

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.2.1 | UI framework |
| React-Bootstrap | 2.10.10 | Component primitives |
| Bootstrap | 5.3.3 | CSS foundation |
| Vite | 8.0.1 | Build + dev server (Rolldown-powered) |
| Storybook | 10.2.7 | Component documentation |
| SASS | 1.77.8 | CSS preprocessing |
| Highcharts | 12.5.0 | Data visualization |
| TypeScript | 5.9.3 | Type support (playground prototypes) |
| Framer Motion | 12.33.0 | Animations |
| @assistant-ui/react | 0.12.3 | AI chat interface |

## Directory Layout

```
plus-vibe-coding-starting-kit/
├── AGENTS.md                  The constitution (Tier 1 #1)
├── loading-order.md           The loading contract (Tier 1 #2)
├── design-system/             Design system source (was packages/plus-ds/)
│   └── src/                   Components, forms, DataViz, specs, tokens, styles
├── playground/                21 prototype projects (flat, project-oriented)
├── src/                       Vite app entry (App.jsx, main.jsx, index.css)
├── skills/                    Six dual-face skills (SKILL.md + bot.md + references/method.md)
├── agents/                    researchers/ · reviewers/ · writers/ · uno-bot/ (Worker)
├── docs/
│   ├── context/               Descriptive — product, design-system foundation, onboarding
│   ├── conventions/           Normative — notion, figma-workspace, slack, supabase, writing-style, automations
│   ├── evals/                 rubrics/ + scenarios/ + runs/ (one quality loop)
│   ├── knowledge/             Long-term memory (lessons, ADRs, changelog, archive/)
│   └── plans/                 Dated implementation plans
├── .storybook/                Storybook configuration
├── scripts/                   Multi-consumer tooling: Actions codegen (prompts/, lib/), token sync, link guard
└── .claude/                   Claude Code settings
```

## Team

| Role | People |
|------|--------|
| Design Lead | Bill |
| Designers | Ashley, Victor, Bryan + rotating semester designers |
| Product | Shiv (lead), Suraj (PM) |
| Engineering | Jose, Ishan, Max, Zach, Cindy |

## Design System Inventory

| Category | Count | Location |
|----------|-------|----------|
| Components | 46 | `design-system/src/components/` |
| Forms | 61 | `design-system/src/forms/` |
| DataViz | 11 | `design-system/src/DataViz/` |
| Specs | 10 | `design-system/src/specs/` |
| Tokens | 9 | `design-system/src/tokens/` |
| Styles | 11 | `design-system/src/styles/` |

## Deployment

All deployments use **Netlify** exclusively. No other hosting providers (Vercel, etc.) are used.

| Target | URL | Config |
|--------|-----|--------|
| **Prototype Marketplace** | https://plus-uno.netlify.app | `netlify.toml` — builds `dist/` via `npm run build:all` |
| **Storybook** | https://plus-uno.netlify.app/storybook/ | Static build at `dist/storybook/` via `build:all` |
| **Standalone prototypes** | Per-prototype Netlify deploys (optional) | Individual `dist/` folders via Netlify CLI |

**Environment variables (Netlify dashboard):**
| Variable | Purpose |
|----------|---------|
| `VITE_STORYBOOK_URL` | Deployed Storybook URL for FAB nav and StorybookEmbed |

## Integrations

| Integration | Purpose |
|-------------|---------|
| Figma MCP | Design-to-code: `get_design_context`, `get_screenshot`, `get_variable_defs` |
| Stitch MCP | Wireframe generation for consulting/iteration |
| Playwright MCP | Browser automation tests |
| GitHub Actions | Token sync automation (planned — not yet created) |
