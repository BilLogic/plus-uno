# PLUS Design Agent

## Identity

See docs/context/agent-persona.md

## Product

See docs/context/product/plus-app.md

## Conventions

See docs/context/conventions/coding.md
See docs/context/conventions/terminology.md

## Design Principles

See docs/context/design-system/foundations/principles.md

## Knowledge Index

See docs/knowledge/INDEX.md

## Knowledge Architecture

Design System knowledge lives in `design-system/docs/` (hand-authored) and `design-system/agent-views/` (generated from MDX / propTypes / SCSS). Start at `design-system/docs/discovery.md`; load only task-relevant docs. Workflow skills (uno-prototype, uno-review, etc.) own process; DS facts live under `design-system/`. Refresh agent artifacts: `npm run generate:agent`.

## Forbidden Patterns

1. Never hardcode colors, spacing, typography, radius, or elevation — use design tokens. Map to compile-ready tokens (e.g., `var(--color-on-surface-state-08)`), not raw Figma literal names.
2. **DS knowledge is law**: Start at `design-system/docs/discovery.md`, then load only required docs (e.g., `design-system/agent-views/components/index.md`, `design-system/agent-views/foundations/tokens.md`). If a component is not listed, it does not exist.
3. **Never hallucinate layouts**: When building a new page, read `design-system/docs/patterns/layout.md` and use official structural React formulas (e.g., `<PageLayout>`).
4. **Never hallucinate props**: Always read component `.jsx` or `.stories.jsx` to verify exact prop names and types before implementing.
5. Never skip reading component source + story + styles before using unfamiliar components.
6. Use PLUS components first — only fall back to generic React-Bootstrap when no PLUS equivalent exists.
7. When Figma design input exists, follow the full implement-design workflow (see `.agent/skills/uno-prototype/references/figma-mcp-guide.md`): **MANDATORY load** `design-system/figma/component-registry.json` + `design-system/figma/token-registry.json` first (see `.agent/skills/uno-prototype/references/figma-registry-mandatory-load.md`) → extract node IDs → fetch design context → capture screenshot → download assets → translate to PLUS token conventions → achieve visual parity → validate against source. Do not skip steps.
8. Never install new packages without explicit user approval.
9. Never introduce non-Bootstrap UI frameworks (no Material UI, no Ant Design, no Tailwind).
10. Never deep-import from `design-system/src/` — use barrel exports from `@` alias.
11. Never create components that duplicate existing ones — check `docs/context/design-system/components/components-index.json` first.
12. Never edit generated token files directly — run `npm run generate:tokens` after changes.
13. Always validate in Storybook when component behavior is touched.
14. Confirm implementation plan and touched files before large or risky edits.
15. Never use Font Awesome Pro icons — only FA Free: `fa-solid`, `fa-regular`, `fa-brands`. No `fa-light`, `fa-thin`, `fa-sharp`, `fa-duotone`, or Pro-only icon names (e.g., `fa-grid-2`). Brand icons (`fa-brands fa-notion`, `fa-brands fa-figma`, etc.) are included in FA Free.
16. **Figma registries are law for design-to-code**: Before mapping Figma nodes to imports or variables to tokens, read `design-system/figma/component-registry.json` and `design-system/figma/token-registry.json`. Never hallucinate component imports or token names when Figma input is involved.

## Skills

| Skill | Trigger | Location |
|-------|---------|----------|
| uno-research | "What is…", "How does…", explore | `.agent/skills/uno-research/SKILL.md` |
| uno-plan | "Plan", "scope", "how should we build" | `.agent/skills/uno-plan/SKILL.md` |
| uno-prototype | Scaffold playground prototype | `.agent/skills/uno-prototype/SKILL.md` |
| uno-review | Quality gate before shipping | `.agent/skills/uno-review/SKILL.md` |
| uno-post | "Submit", "Publish" | `.agent/skills/uno-post/SKILL.md` |
| uno-compound | Document learnings | `.agent/skills/uno-compound/SKILL.md` |

## Pipeline

See .agent/SKILL.md for skill routing, tier-aware loading, and compaction protocol.

## Learnings

Check `docs/knowledge/INDEX.md` before starting work — past lessons may apply.
After completing significant work, document learnings via `/uno:compound`.

## Setup

Read `docs/setup-guide.md` for onboarding: recommended CE skills, MCP server config, platform setup.

## Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Vite + Storybook concurrent (ports 4100 + 4200) |
| `npm run dev:vite` | Vite only (port 4100) |
| `npm run storybook` | Storybook only (port 4200) |
| `npm run build` | Production build |
| `npm run build-storybook` | Build Storybook static site |
| `npm run sync:tokens` | Sync tokens from Figma |
| `npm run generate:tokens` | Generate SCSS/JS from token source |
| `npm run generate:agent` | Regenerate agent-views + Figma registries + audit |
| `npm run dev:home-redesign` | Home redesign prototype |
| `npm run dev:monthly-report` | Monthly report prototype |

## Progressive Loading

Load docs on-demand based on what comes up in conversation:

| Trigger | Load |
|---------|------|
| Any DS implementation task | `design-system/docs/discovery.md` (MANDATORY entry — route from here) |
| Building UI, using components or tokens | `design-system/agent-views/components/{name}.md` if exists, else `index.md` + `foundations/tokens.md` |
| Designer knowledge verification status | `design-system/figma/knowledge-audit.md` |
| Building new pages, dashboards, layouts | `design-system/docs/patterns/layout.md` (MANDATORY) |
| Implementation setup (aliases, playground, Vite) | `design-system/docs/setup.md` |
| Design philosophy / agent role | `design-system/docs/guidelines.md` |
| Figma link, implement-design, or design-to-code mapping | `design-system/figma/component-registry.json` + `design-system/figma/token-registry.json` (MANDATORY — load first); then `.agent/skills/uno-prototype/references/figma-registry-mandatory-load.md` + `figma-mcp-guide.md` |
| Need a specific component's Figma node id / link to reference | `design-system/figma/component-figma-links.md` (generated from component MDX; run `npm run generate:figma-links`) |
| Component architecture questions | `docs/context/design-system/components/inventory.md` |
| Build, preview, or deployment | `.agent/skills/uno-prototype/references/local-preview.md` |
| Exact file paths or env vars needed | Relevant `*-index.json` in skill references |
| Token sync or repo scripts | `.agent/skills/uno-compound/references/scripts.md` |
| Product context, users, or domain terms | `docs/context/product/*.md` |

Keep context lean: load only 2-3 needed guides (~2,000-2,500 tokens). Avoid full load (~5,500 tokens).
