<!-- Tier: 2 -->
# plus-uno — Repository Overview

This repo is the design system, prototyping workspace, and agent infrastructure for the PLUS tutoring platform.

## What This Is

- **Design System** (`design-system/src/`) — 57 UI components (forms grouped under `components/forms-and-inputs/`), 42 DataViz charts, 7 spec areas, generated token SCSS. Counts come from `design-system/agent-views/` — regenerate with `npm run generate:agent` rather than trusting the numbers below. Published internally as `@plus-ds` alias. (Exact counts: § Design System Inventory below.)
- **Prototypes** (`prototypes/`) — on `main`: live app + Full Demo Walkthrough (`/demo/demo.html`, id `1028`) via `home-redesign/` (+ content modules). Branch experiments catalogued in Notion.
- **Storybook** (`.storybook/`) — Interactive component documentation. Site landing at `/storybook/`.
- **Agent Harness** (`AGENTS.md`, `skills/`, `agents/`) — the constitution, six dual-face skills, and the agent roster incl. the uno-bot Slack Worker (`agents/uno-bot/`).
- **Product Documentation** (`docs/`) — context (descriptive), conventions (normative), evals, knowledge, plans.

## Tech Stack

Mirrors `package.json` as of 2026-07-30; `docs/conventions/tech-stack.md` is the normative copy — read `package.json` before asserting a version.

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.2.1 | UI framework |
| React-Bootstrap | 2.10.10 | Component primitives |
| Bootstrap | 5.3.3 | CSS foundation |
| Vite | ^8.0.1 | Build + dev server (Rolldown-powered) |
| Storybook | ^10.5.0 | Component documentation |
| SASS | 1.77.8 | CSS preprocessing |
| Highcharts | ^12.4.0 | Data visualization |
| TypeScript | 5.9.3 | Type support (prototypes) |
| Framer Motion | ^12.38.0 | Animations |
| @assistant-ui/react | 0.12.3 | AI chat interface |

## Directory Layout

```
plus-vibe-coding-starting-kit/
├── AGENTS.md                  The constitution (Tier 1 #1)
├── loading-order.md           The loading contract (Tier 1 #2)
├── design-system/             Design system source (was packages/plus-ds/)
│   └── src/                   Components, forms, DataViz, specs, tokens, styles
├── prototypes/                home-redesign (live app) + branch experiment folders
├── src/                       Vite SPA entry (Storybook redirect + live app routes)
├── skills/                    Six dual-face skills (SKILL.md + bot.md + references/method.md)
├── agents/                    researchers/ · reviewers/ · writers/ · uno-bot/ (Worker)
├── docs/
│   ├── context/               Descriptive — product, design-system foundation, onboarding
│   ├── conventions/           Normative — notion, figma-workspace, slack, supabase, writing-style, automations
│   ├── evals/                 rubrics/ + scenarios/ + runs/ (one quality loop)
│   ├── knowledge/             Long-term memory (lessons, ADRs, changelog, archive/)
│   └── plans/                 Dated implementation plans
├── .storybook/                Storybook configuration
└── scripts/                   Multi-consumer tooling: Actions codegen (prompts/, lib/), token sync, link guard
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
| UI components | 57 | `design-system/src/components/` — seven groups: actions, forms-and-inputs, layout-and-structure, messaging, navigation, overlays, status-and-loading (plus `_internal/`) |
| DataViz | 42 charts (25 exported wrappers) | `design-system/src/dataviz/` — 6 categories |
| Specs | 7 product areas | `design-system/src/specs/` (Home, Universal, Training, Admin, Profile, Toolkit, Login) |
| Tokens | 6 SCSS files + `source/` | `design-system/src/tokens/` (generated — never hand-edit) |
| Styles | 14 files | `design-system/src/styles/` |

<!-- Counts are a SNAPSHOT, not a source of truth. `design-system/agent-views/` is generated (`npm run generate:agent`) and AGENTS.md § Forbidden patterns makes it authoritative — "if a component is not listed, it does not exist". Re-read the agent-views before quoting a number to anyone; keep README.md § Design System in sync. Last checked 2026-07-30. -->

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
