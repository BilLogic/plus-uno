---
summary: This repo as a product — who runs it, what it deploys where, and what it connects to; the surface map itself is README.md
---

<!-- Tier: 2 -->
# plus-uno — Repository Overview

plus-uno is the PLUS design team's agentic design-ops workspace: the design system, the prototypes built from it, and uno, the agent that works on both from the IDE and from Slack. The map of its surfaces, with links and commands, is [`README.md`](../../README.md) § How it fits together; this page keeps what the README does not: who runs it, where each surface deploys, and what it connects to.

## Team

| Role | People |
|------|--------|
| Design Lead | Bill |
| Designers | Ashley, Victor, Bryan + rotating semester designers |
| Product | Shiv (lead), Suraj (PM) |
| Engineering | Jose, Ishan, Max, Zach, Cindy |

## Tech stack

React on Bootstrap, built with Vite, documented in Storybook, styled with SCSS and design tokens. New interactive behavior is built on Base UI (`@base-ui/react`, ADR-037). Highcharts draws the data visualizations and Motion the animation. uno-bot is TypeScript on Cloudflare Workers.

**Versions live in `package.json`.** They are not restated here: a mirrored table is correct only until the next bump, and nothing makes it fail when it stops being correct.

## Design system inventory

Counts are not kept here; they went stale every time a component landed. The generated index is the count and the existence law: [`design-system/agent-views/components/index.md`](../../design-system/agent-views/components/index.md), regenerated with `npm run generate:agent`.

| Part | Location |
|------|----------|
| Components, grouped by job | `design-system/src/components/` |
| Patterns: page structure, overlays, AI chat | `design-system/src/patterns/` |
| Data visualizations, by question type | `design-system/src/dataviz/` |
| Tokens (generated, never hand-edited) | `design-system/src/tokens/` |
| Guidelines | `design-system/guidelines/` |

## Deployment

Netlify hosts the site, configured in `netlify.toml`. A PR gets a deploy preview; production publishes only on a release, through `.github/workflows/netlify-production-deploy.yml` run by hand.

| Target | URL | Built from |
|--------|-----|------------|
| **Storybook** | https://plus-uno.netlify.app/storybook/ (also the site root) | `npm run build:all` → `dist/storybook/` |
| **Hosted DS MCP** | https://plus-uno.netlify.app/mcp/ds (team key) | `netlify/functions/ds-mcp/` |
| **PLUS Uno Blueprint** (the blueprint app) | https://plus-uno.netlify.app/blueprint/ | Its own Netlify site (`plus-uno-blueprint`), proxied by a forced rewrite in `netlify.toml` |
| **Experiments** | Deploy previews or standalone Netlify sites | Feature branches; cataloged in the Notion Prototype Marketplace |

The Specs screens, the Vibe app and the Full Demo Walkthrough are on the `archive/legacy-ds` branch; their old URLs (`/home`, `/app`, `/demo`) redirect to Storybook.

uno-bot is not on Netlify: it is a Cloudflare Worker, deployed by `.github/workflows/uno-bot-deploy.yml` on every push to `main` (`agents/uno-bot/README.md` § Deploy).

## Integrations

| Integration | Purpose |
|-------------|---------|
| Storybook MCP | Component docs and story previews from a running Storybook (`docs/connectors/storybook-mcp.md`) |
| `plus-ds` MCP | The design-system lookup, local and hosted (`docs/connectors/ds-mcp.md`) |
| Figma MCP | Design-to-code and the write-back gate (`design-system/guidelines/figma/`) |
| Notion | Roadmap cards, PRDs, the Prototype Marketplace (`docs/connectors/notion/`) |
| Supabase | uno-blueprint, the current service journey (`docs/connectors/supabase/`) |
| GitHub Actions | The PR gate (`check-harness.yml`), uno-bot deploys, Figma snapshot refreshes, the release deploy |
