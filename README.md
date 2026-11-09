---
summary: The front page — what plus-uno is, every surface it ships (Storybook, the Vibe app, the demo, the design-system lookup, uno skills, uno-bot), and where each one's docs live.
---

# plus-uno

[![Netlify Status](https://api.netlify.com/api/v1/badges/9808dbb9-70ab-438e-b3c3-69d18441f0d4/deploy-status)](https://app.netlify.com/projects/plus-uno/deploys)

The agentic design-ops workspace of the [PLUS](https://tutors.plus/) design team. PLUS is a nonprofit tutoring program: 500+ college tutors working with 3,000+ K-12 students. One repo holds the design system, the prototypes built from it, and **uno**, the agent that researches, prototypes, reviews and maintains that work, in the IDE and in Slack.

It is a prototype estate, not a production app: nothing here serves tutors or students.

| | |
|---|---|
| **Storybook** | [plus-uno.netlify.app/storybook](https://plus-uno.netlify.app/storybook/) — the design system's docs |
| **Vibe app** | [plus-uno.netlify.app/home](https://plus-uno.netlify.app/home) — the product's screens, built from the design system |
| **Full Demo Walkthrough** | [plus-uno.netlify.app/demo/demo.html](https://plus-uno.netlify.app/demo/demo.html) — the recorded end-to-end flow |
| **uno-blueprint** | [plus-uno.netlify.app/blueprint](https://plus-uno.netlify.app/blueprint/) — the service as it runs today |
| **Prototype Marketplace** | [Notion catalog](https://app.notion.com/p/plus-tutors/397b7cca49828002826cc45e2baa8e4f) (PLUS workspace access) — every prototype and its deploy URL |
| **New here** | [`SETUP.md`](SETUP.md) to run it · [`AGENTS.md`](AGENTS.md) for how uno works · [`GLOSSARY.md`](GLOSSARY.md) for the words |

## How it fits together

People ask for work in **skills**. Skills summon **agents**. Agents follow **conventions**, and ground their claims in two live sources: the design system (Storybook) and the service journey (uno-blueprint).

| Surface | What it is | Where it lives | Docs |
|---|---|---|---|
| Design system | React components, patterns, AI UI, data-viz charts and tokens | `design-system/` | [Storybook](https://plus-uno.netlify.app/storybook/) · [`design-system/guidelines/overview.md`](design-system/guidelines/overview.md) |
| Design-system lookup | One lookup with three doors: the `ds` CLI, a local MCP server, a hosted MCP endpoint | `scripts/ds.mjs`, `scripts/ds-mcp.mjs`, `netlify/functions/ds-mcp/` | [`docs/connectors/ds-mcp.md`](docs/connectors/ds-mcp.md) |
| Vibe app and demo | The product's screens, and the recorded walkthrough | `prototypes/live-app/`, `prototypes/home-redesign/` | [`prototypes/README.md`](prototypes/README.md) |
| Prototypes and marketplace | Branch experiments, cataloged in Notion | `prototypes/`, `skills/uno-publish/` | [`docs/connectors/notion/marketplace-db.md`](docs/connectors/notion/marketplace-db.md) |
| uno skills and agents | Six IDE workflows and the agents they summon | `skills/`, `agents/` | [`skills/README.md`](skills/README.md) · [`agents/README.md`](agents/README.md) |
| uno-bot | uno in Slack, a Cloudflare Worker | `agents/uno-bot/` | [`agents/uno-bot/README.md`](agents/uno-bot/README.md) |
| uno-blueprint | The current service journey, in Supabase | [BilLogic/uno-blueprint](https://github.com/BilLogic/uno-blueprint) | [`docs/connectors/supabase/overview.md`](docs/connectors/supabase/overview.md) |

## Quick start

Node 22 or later.

```bash
git clone https://github.com/BilLogic/plus-uno.git
cd plus-uno
npm install
npm run dev          # the app shell on :4100 and Storybook on :4200
```

Storybook opens at [localhost:4200](http://localhost:4200) and the Vibe app at [localhost:4100/home](http://localhost:4100/home). `npm run dev:demo` runs the Full Demo Walkthrough. Every other script is in [`package.json`](package.json); [`SETUP.md`](SETUP.md) says which part of the repo you are in.

## Storybook

The design system's documentation, published at [plus-uno.netlify.app/storybook](https://plus-uno.netlify.app/storybook/). It is also where a component's behavior is decided: a story and its tests are the spec.

- **Get started**: design, develop, working with AI, content design.
- **Foundations**: tokens, color, typography, spacing, layout and grid, elevation, motion, iconography, accessibility.
- **Components**: grouped by job, from Forms and inputs to Overlays and layering.
- **Patterns**: the page structure (Frame, Sidebar, Page, Panel, Section), overlays and templates.
- **AI**: the AI chat and the components it is built from.
- **Data visualizations**: Highcharts-based charts by question type: comparison, distribution, part-to-whole, temporal and more.
- **Specs**: the product's screens, area by area.

The docs pages carry an AI assistant that answers from the design-system index (`netlify/functions/docs-agent/`). The existence rule for agents is the generated index, [`design-system/agent-views/components/index.md`](design-system/agent-views/components/index.md): a component missing from it does not exist.

## Design-system lookup: CLI and MCP

The same five tools answer from a shell, from an MCP client in the checkout, and over HTTPS. Start with `find`, finish with `check`.

```bash
npm run ds -- find "modal dialog"         # what exists for a task, name or alias
npm run ds -- get Button --section props  # import line and props
npm run ds -- tokens stack                # the token steps for a role, with intent
npm run ds -- check --code '<Button appearance="primary">Save</Button>' --path f.jsx
```

**Local MCP.** `plus-ds` is registered in [`.mcp.json`](.mcp.json), so Claude Code and Cursor start it from the checkout (`npm run ds:mcp`) and it matches the branch being edited. Its tools are `ds_find`, `ds_get`, `ds_tokens`, `ds_guide` and `ds_check`.

**Hosted MCP.** For people without the checkout, the same tools are served read-only at `https://plus-uno.netlify.app/mcp/ds`, behind a team key (`DS_MCP_KEY`; ask the design-system owner). It serves the released design system. Client config and key handling: [`docs/connectors/ds-mcp.md`](docs/connectors/ds-mcp.md) § Hosted.

**Storybook MCP.** `npm run storybook` also serves the Storybook MCP at `localhost:4200/mcp`, for component docs and story previews ([`docs/connectors/storybook-mcp.md`](docs/connectors/storybook-mcp.md)).

**No npm package.** The design system is not published to a registry. Code in this repo imports it from the barrel, `import { Button } from '@/components'`.

## uno skills

uno is the PLUS design team's agent. In the IDE (Claude Code, Cursor, any tool that reads `AGENTS.md`) you call it through six skills, or describe what you want and it routes:

| Skill | Use it to |
|---|---|
| `uno-research` | gather context: user studies, Slack threads, analytics, the codebase |
| `uno-synthesize` | turn findings into takeaways and a PRD; update the blueprint |
| `uno-prototype` | build a prototype from a PRD, at low, mid or high fidelity, or in code |
| `uno-publish` | share work out, hand it off to engineering, or register it in the marketplace |
| `uno-review` | review against the design system, product intent and accessibility; run Design QA |
| `uno-maintain` | file an intake, fix drift, and keep the docs and estates in sync |

Each skill is `skills/<name>/SKILL.md` over its `references/method.md`. The agents a skill summons are in `agents/`: **researchers** gather, **reviewers** judge, **writers** write to Notion, Figma and the blueprint. [`AGENTS.md`](AGENTS.md) is the constitution every agent loads first: identity, the skill routing table, the loading contract and the hard rules.

## uno-bot

uno in Slack, as `@uno-bot`. It answers grounded questions across Notion, the blueprint, GitHub and Slack, and stages anything with a side effect (filing a PRD or an issue, a share-out, a workflow run) on a proposal card that a person approves first. Scheduled runs post a morning sweep and check the Figma library against the code.

- **Runtime:** a Cloudflare Worker, with Durable Objects for per-thread state. It is self-hosted on purpose; the reasons and what would reopen the question are [ADR-027](docs/adr/027-own-the-worker-rather-than-rent-a-managed-slack-agent.md).
- **Brain:** `AGENTS.md`, its persona ([`agents/uno-bot/AGENT.md`](agents/uno-bot/AGENT.md)) and its bot skills (`agents/uno-bot/skills/`) are baked into the bundle at build time, so a guidance change reaches Slack only when the Worker deploys.
- **Deploy:** every push to `main` runs [`uno-bot-deploy.yml`](.github/workflows/uno-bot-deploy.yml), which runs `npm run deploy` in `agents/uno-bot/`: the checks and tests, then the harness bake, then `wrangler deploy`.
- **Docs:** [`agents/uno-bot/README.md`](agents/uno-bot/README.md) for architecture, local dev, config and smoke tests.

## uno-blueprint

The source of truth for how the PLUS service runs today: phases, scenarios, steps and who does each, stored in Supabase and rendered at [plus-uno.netlify.app/blueprint](https://plus-uno.netlify.app/blueprint/). Its toolkit is its own repo, [BilLogic/uno-blueprint](https://github.com/BilLogic/uno-blueprint). Agents cite the blueprint for current-state claims and Roadmap cards and PRDs for planned work, and surface a conflict between them rather than blending it ([`docs/connectors/supabase/overview.md`](docs/connectors/supabase/overview.md)).

## Prototypes and the marketplace

`main` hosts three surfaces: Storybook, the Vibe app (`/home`, alias `/app`) and the Full Demo Walkthrough (`/demo/*`, entry `/demo/demo.html`). Everything else is an experiment:

1. Copy `prototypes/starter/` on a feature branch and build with design-system components.
2. Open a PR; the Netlify deploy preview is the prototype's URL.
3. Run `uno-publish` to register it in the [Prototype Marketplace](https://app.notion.com/p/plus-tutors/397b7cca49828002826cc45e2baa8e4f), the Notion catalog with that deploy URL.
4. When accepted, fold it into the Storybook specs and the Vibe app. One-off experiments are not merged to `main`.

## Repository layout

```
plus-uno/
├── AGENTS.md            the constitution: identity, skills, hard rules
├── design-system/       components, patterns, data viz, specs, tokens, guidelines
│   ├── agent-views/     generated indexes agents read (regenerate, never hand-edit)
│   └── figma/           Figma registries and alignment runbooks
├── prototypes/          the Vibe app (live-app/), the demo (home-redesign/), experiments
├── src/                 the Vite shell that routes /home and embeds Storybook
├── skills/              the six uno skills
├── agents/              researchers/, reviewers/, writers/, and uno-bot/ (the Worker)
├── docs/                connectors/, engineering/, conventions/, adr/, evals/, knowledge/
├── netlify/functions/   the hosted DS MCP and the Storybook docs assistant
└── scripts/             generators, the ds CLI and MCP, and the check:* gates
```

## Deployment

Netlify hosts the site. Every PR gets a free deploy preview at `deploy-preview-<PR>--plus-uno.netlify.app`. A merge to `main` does not publish: production deploys only when a release is called, by running [`netlify-production-deploy.yml`](.github/workflows/netlify-production-deploy.yml) by hand; `netlify.toml` skips every other production build. uno-bot deploys separately, on every push to `main` (above).

## Documentation

| Read | For |
|---|---|
| [`SETUP.md`](SETUP.md) | running the repo and finding your way around |
| [`docs/product-and-service/onboarding.md`](docs/product-and-service/onboarding.md) | a new teammate's first day |
| [`AGENTS.md`](AGENTS.md) | how every agent here is told to work |
| [`INDEX.md`](INDEX.md) | every document, routed by task |
| [`docs/product-and-service/plus-app.md`](docs/product-and-service/plus-app.md) | the PLUS product: users, features, flows |
| [`docs/adr/overview.md`](docs/adr/overview.md) | the architecture decisions, one file each |
| [`docs/engineering/setup.md`](docs/engineering/setup.md) | aliases, generated files and the harness gate |

## Contributing

Branch from `main`, follow `AGENTS.md`, and open a PR. `npm run check:harness` runs the same gates CI runs on the PR; the deploy preview is what reviewers look at. Changes to what agents read go through `skills/uno-maintain`.

## License

No license file is published yet.
